import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone, type FileError, type FileRejection } from 'react-dropzone'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

type UploadedFile = { name: string; path: string; publicUrl: string }

type UseSupabaseUploadOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  cacheControl?: number
  upsert?: boolean
}

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 0,
    upsert = false,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const uploadInProgress = useRef(false)
  const attemptedUploads = useRef<Set<string>>(new Set())

  // Only true when every file in the current batch is genuinely uploaded.
  const isSuccess = useMemo(() => {
    if (files.length === 0) return false
    return files.every((f) => f.errors.length === 0 && successes.includes(f.name))
  }, [files, successes])

  const reset = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      return []
    })
    setErrors([])
    setSuccesses([])
    setUploadedFiles([])
    attemptedUploads.current.clear()
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const incoming: FileWithPreview[] = [
        ...acceptedFiles.map((file) => {
          const fileWithPreview = file as unknown as FileWithPreview
          fileWithPreview.preview = URL.createObjectURL(file)
          fileWithPreview.errors = []
          return fileWithPreview
        }),
        ...fileRejections.map(({ file, errors }) => {
          const fileWithPreview = file as unknown as FileWithPreview
          fileWithPreview.preview = URL.createObjectURL(file)
          fileWithPreview.errors = errors
          return fileWithPreview
        }),
      ]

      setFiles((prev) => {
        const merged = maxFiles === 1 ? incoming.slice(-1) : [...prev, ...incoming]
        const deduped = merged.filter(
          (f, i, arr) => arr.findIndex((x) => x.name === f.name) === i
        )
        prev.forEach((p) => {
          if (!deduped.includes(p) && p.preview) URL.revokeObjectURL(p.preview)
        })
        return deduped
      })

      // A replacement is a fresh batch. Clear stale bookkeeping so re-picking
      // the same filename still results in a real upload.
      if (maxFiles === 1) {
        setErrors([])
        setSuccesses([])
        setUploadedFiles([])
        attemptedUploads.current.clear()
      }
    },
    [maxFiles]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  })

  const storageKeyFor = (file: File) => {
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
    const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`
    return path ? `${path}/${key}` : key
  }

  const onUpload = useCallback(async () => {
    if (uploadInProgress.current) return
    uploadInProgress.current = true
    setLoading(true)

    try {
      const pending = files.filter(
        (f) => f.errors.length === 0 && !successes.includes(f.name)
      )

      const responses = await Promise.all(
        pending.map(async (file) => {
          const key = storageKeyFor(file)
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(key, file, {
              cacheControl: cacheControl.toString(),
              upsert,
            })

          if (error) {
            return { name: file.name, message: error.message, path: null, publicUrl: null }
          }

          const { data } = supabase.storage.from(bucketName).getPublicUrl(key)
          return { name: file.name, message: undefined, path: key, publicUrl: data.publicUrl }
        })
      )

      const failed = responses.filter((r) => r.message !== undefined)
      const succeeded = responses.filter((r) => !!r.path && !!r.publicUrl)

      if (failed.length > 0) {
        setErrors((prev) => [
          ...prev.filter((e) => !failed.some((f) => f.name === e.name)),
          ...failed.map((f) => ({ name: f.name, message: f.message as string })),
        ])
        // Allow the auto-uploader to retry these.
        failed.forEach((f) => attemptedUploads.current.delete(f.name))
      }

      if (succeeded.length > 0) {
        setSuccesses((prev) =>
          Array.from(new Set([...prev, ...succeeded.map((r) => r.name)]))
        )
        setUploadedFiles((prev) => [
          ...prev,
          ...succeeded.map((r) => ({
            name: r.name,
            path: r.path as string,
            publicUrl: r.publicUrl as string,
          })),
        ])
      }
    } finally {
      setLoading(false)
      uploadInProgress.current = false
    }
  }, [files, path, bucketName, successes, cacheControl, upsert])

  // AUTO-UPLOAD with retry prevention
  useEffect(() => {
    const hasNewFiles = files.some(
      (f) =>
        f.errors.length === 0 &&
        !successes.includes(f.name) &&
        !attemptedUploads.current.has(f.name)
    )
    if (hasNewFiles && !loading && !uploadInProgress.current) {
      files.forEach((f) => {
        if (!successes.includes(f.name) && f.errors.length === 0) {
          attemptedUploads.current.add(f.name)
        }
      })
      onUpload()
    }
  }, [files, onUpload, loading, successes])

  useEffect(() => {
    if (files.length === 0) setErrors([])
  }, [files.length])

  return {
    files,
    setFiles,
    successes,
    uploadedFiles,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    reset,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

export { useSupabaseUpload, type UseSupabaseUploadOptions, type UseSupabaseUploadReturn }