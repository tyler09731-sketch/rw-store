import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useDropzone,
  type FileError,
  type FileRejection,
} from 'react-dropzone'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
  uploadId: string
}

interface UploadedFile {
  uploadId: string
  name: string
  path: string
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

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

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
  const [errors, setErrors] = useState<
    { name: string; message: string }[]
  >([])
  const [successes, setSuccesses] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const uploadInProgress = useRef(false)
  const attemptedUploads = useRef(new Set<string>())
  const uploadedIds = useRef(new Set<string>())
  const filesRef = useRef<FileWithPreview[]>([])

  const updateFiles = useCallback((newFiles: FileWithPreview[]) => {
    filesRef.current = newFiles
    setFiles(newFiles)
  }, [])

  const isSuccess = useMemo(() => {
    return (
      files.length > 0 &&
      files.every((file) => uploadedFiles.some(
        (uploaded) => uploaded.uploadId === file.uploadId
      )) &&
      errors.length === 0
    )
  }, [files, uploadedFiles, errors])

  // Create file objects with previews and unique IDs.
  const createFile = useCallback(
    (file: File, fileErrors: readonly FileError[] = []) => {
      return Object.assign(file, {
        preview: URL.createObjectURL(file),
        errors: fileErrors,
        uploadId: crypto.randomUUID(),
      }) as FileWithPreview
    },
    []
  )

  // Handle file selection.
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles.map((file) => createFile(file))

      const invalidFiles = fileRejections.map(({ file, errors }) =>
        createFile(file, errors)
      )

      // Replace the previous selection for single-file uploads.
      const newFiles =
        maxFiles === 1
          ? [...validFiles, ...invalidFiles]
          : [...filesRef.current, ...validFiles, ...invalidFiles]

      // Clean up previews from files being replaced.
      if (maxFiles === 1) {
        filesRef.current.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview)
          }
        })
      }

      updateFiles(newFiles)

      // Reset upload tracking for the new selection.
      attemptedUploads.current.clear()
      uploadedIds.current.clear()

      setErrors([])
      setSuccesses([])
      setUploadedFiles([])
    },
    [createFile, maxFiles, updateFiles]
  )

  // Dropzone configuration.
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

  // Upload files to Supabase.
  const uploadPending = useCallback(
    async (retryFailed = false) => {
      if (uploadInProgress.current) return

      const pendingFiles = files.filter(
        (file) =>
          file.errors.length === 0 &&
          !uploadedIds.current.has(file.uploadId) &&
          (
            retryFailed ||
            !attemptedUploads.current.has(file.uploadId)
          )
      )

      if (pendingFiles.length === 0) return

      uploadInProgress.current = true
      setLoading(true)

      pendingFiles.forEach((file) => {
        attemptedUploads.current.add(file.uploadId)
      })

      try {
        const responses = await Promise.all(
          pendingFiles.map(async (file) => {
            // Unique filenames prevent stale image caching.
            const extension = file.name.includes('.')
              ? file.name.split('.').pop()
              : 'bin'

            const uniqueName = `${crypto.randomUUID()}.${extension}`

            const filePath = path
              ? `${path}/${uniqueName}`
              : uniqueName

            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(filePath, file, {
                cacheControl: cacheControl.toString(),
                upsert,
                contentType: file.type || undefined,
              })

            if (error) {
              return {
                uploadId: file.uploadId,
                name: file.name,
                path: '',
                message: error.message,
              }
            }

            return {
              uploadId: file.uploadId,
              name: file.name,
              path: data.path,
              message: undefined,
            }
          })
        )

        const failed = responses.filter(
          (response) => response.message !== undefined
        )

        const successful = responses.filter(
          (response) => response.message === undefined
        )

        // Track successful uploads.
        successful.forEach((response) => {
          uploadedIds.current.add(response.uploadId)
        })

        setErrors(
          failed.map((response) => ({
            name: response.name,
            message: response.message!,
          }))
        )

        setSuccesses((previous) => [
          ...new Set([
            ...previous,
            ...successful.map((response) => response.name),
          ]),
        ])

        setUploadedFiles((previous) => [
          ...previous.filter(
            (uploaded) =>
              !successful.some(
                (response) => response.uploadId === uploaded.uploadId
              )
          ),
          ...successful.map((response) => ({
            uploadId: response.uploadId,
            name: response.name,
            path: response.path,
          })),
        ])
      } catch (error) {
        setErrors([
          {
            name: 'Upload',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected upload error occurred.',
          },
        ])
      } finally {
        uploadInProgress.current = false
        setLoading(false)
      }
    },
    [files, path, bucketName, cacheControl, upsert]
  )

  // Automatically upload newly selected files.
  useEffect(() => {
    const hasNewFiles = files.some(
      (file) =>
        file.errors.length === 0 &&
        !uploadedIds.current.has(file.uploadId) &&
        !attemptedUploads.current.has(file.uploadId)
    )

    if (hasNewFiles && !loading && !uploadInProgress.current) {
      uploadPending()
    }
  }, [files, loading, uploadPending])

  // Manually retry failed uploads.
  const onUpload = useCallback(async () => {
    await uploadPending(true)
  }, [uploadPending])

  // Release preview URLs when the component unmounts.
  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  // Handle empty file selection.
  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
      setSuccesses([])
      setUploadedFiles([])
      attemptedUploads.current.clear()
      uploadedIds.current.clear()
    }
  }, [files.length])

  return {
    files,
    setFiles: updateFiles,
    successes,
    uploadedFiles,
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

export {
  useSupabaseUpload,
  type UseSupabaseUploadOptions,
  type UseSupabaseUploadReturn,
}