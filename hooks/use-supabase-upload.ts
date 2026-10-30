import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone, type FileError, type FileRejection } from 'react-dropzone'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
  uploadId: string
}

type UseSupabaseUploadOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  cacheControl?: number
  upsert?: boolean
}

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])

  // Track uploads by unique ID, never by original filename.
  const attemptedUploads = useRef<Set<string>>(new Set())

  // Prevent old upload responses from affecting a newer selection.
  const uploadGeneration = useRef(0)

  const isSuccess = useMemo(() => {
    if (files.length === 0) return false
    if (errors.length > 0) return false
    if (files.some((file) => file.errors.length > 0)) return false

    return successes.length === files.length
  }, [files, errors, successes])

  // Handle selected files.
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Invalidate any previous upload session.
      uploadGeneration.current += 1

      const validFiles = acceptedFiles.map((file) => {
        const fileWithPreview = file as FileWithPreview

        fileWithPreview.preview = URL.createObjectURL(file)
        fileWithPreview.errors = []
        fileWithPreview.uploadId = crypto.randomUUID()

        return fileWithPreview
      })

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        const fileWithPreview = file as FileWithPreview

        fileWithPreview.preview = URL.createObjectURL(file)
        fileWithPreview.errors = errors
        fileWithPreview.uploadId = crypto.randomUUID()

        return fileWithPreview
      })

      // Single-file uploads replace the previous selection entirely.
      const newFiles =
        maxFiles === 1
          ? [...validFiles, ...invalidFiles]
          : [...files, ...validFiles, ...invalidFiles]

      if (maxFiles === 1) {
        attemptedUploads.current.clear()
      }

      setSuccesses([])
      setErrors([])
      setFiles(newFiles)
    },
    [files, maxFiles]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>
    ),
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles !== 1,
  })

  // Upload selected files to Supabase.
  const onUpload = useCallback(async () => {
    const currentGeneration = uploadGeneration.current

    // Only upload files that haven't already been attempted.
    const filesToUpload = files.filter(
      (file) =>
        file.errors.length === 0 &&
        !attemptedUploads.current.has(file.uploadId)
    )

    if (filesToUpload.length === 0) return

    // Mark these files immediately to prevent duplicate uploads.
    filesToUpload.forEach((file) => {
      attemptedUploads.current.add(file.uploadId)
    })

    setLoading(true)

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        try {
          // Generate a unique storage filename.
          const originalExtension = file.name.split('.').pop() || 'bin'

          const extension = /^[a-z0-9]+$/i.test(originalExtension)
            ? originalExtension.toLowerCase()
            : 'bin'

          const uniqueFileName = `${crypto.randomUUID()}.${extension}`

          const storagePath = path
            ? `${path}/${uniqueFileName}`
            : uniqueFileName

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, file, {
              cacheControl: cacheControl.toString(),
              upsert: false,
              contentType: file.type || 'application/octet-stream',
            })

          if (error) {
            return {
              id: file.uploadId,
              name: file.name,
              message: error.message,
              storageName: null,
            }
          }

          return {
            id: file.uploadId,
            name: file.name,
            message: undefined,
            storageName: uniqueFileName,
          }
        } catch (error) {
          return {
            id: file.uploadId,
            name: file.name,
            message:
              error instanceof Error
                ? error.message
                : 'Unknown upload error',
            storageName: null,
          }
        }
      })
    )

    // Ignore responses from an older product/image selection.
    if (currentGeneration !== uploadGeneration.current) return

    const responseErrors = responses
      .filter((response) => response.message !== undefined)
      .map((response) => ({
        name: response.name,
        message: response.message as string,
      }))

    const responseSuccesses = responses
      .filter((response) => response.storageName !== null)
      .map((response) => response.storageName as string)

    setErrors((previous) => [...previous, ...responseErrors])

    setSuccesses((previous) => [
      ...previous,
      ...responseSuccesses,
    ])

    setLoading(false)
  }, [files, path, bucketName, cacheControl])

  // Automatically upload newly selected files.
  useEffect(() => {
    const hasNewFiles = files.some(
      (file) =>
        file.errors.length === 0 &&
        !attemptedUploads.current.has(file.uploadId)
    )

    if (hasNewFiles) {
      onUpload()
    }
  }, [files, onUpload])

  // Reset upload state when files are cleared.
  useEffect(() => {
    if (files.length === 0) {
      uploadGeneration.current += 1
      setErrors([])
      setSuccesses([])
      setLoading(false)
      attemptedUploads.current.clear()
    }
  }, [files.length])

  // Remove unnecessary "too many files" errors when selection is valid.
  useEffect(() => {
    if (files.length <= maxFiles) {
      let changed = false

      const newFiles = files.map((file) => {
        if (file.errors.some((error) => error.code === 'too-many-files')) {
          file.errors = file.errors.filter(
            (error) => error.code !== 'too-many-files'
          )

          changed = true
        }

        return file
      })

      if (changed) {
        setFiles(newFiles)
      }
    }
  }, [files, maxFiles])

  // Clean up local image previews.
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

export {
  useSupabaseUpload,
  type UseSupabaseUploadOptions,
  type UseSupabaseUploadReturn,
}