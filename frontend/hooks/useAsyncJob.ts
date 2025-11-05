/**
 * useAsyncJob Hook
 *
 * React hook for managing async video generation jobs
 * Handles job creation, polling, and status updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  createJob,
  getJobStatus,
  cancelJob,
  pollJobUntilComplete,
  isJobComplete,
  canCancelJob,
  type CreateJobRequest,
  type JobStatusResponse,
  type JobResult,
  type JobStatus,
} from '@/lib/asyncJobService'

export interface UseAsyncJobOptions {
  /**
   * Callback when job completes successfully
   */
  onSuccess?: (result: JobResult) => void

  /**
   * Callback when job fails
   */
  onError?: (error: string) => void

  /**
   * Callback for progress updates
   */
  onProgress?: (status: JobStatusResponse) => void

  /**
   * Polling interval in milliseconds (default: 3000)
   */
  pollInterval?: number

  /**
   * Auto-start polling after job creation (default: true)
   */
  autoStartPolling?: boolean
}

export interface UseAsyncJobReturn {
  // Job state
  jobId: string | null
  status: JobStatus | null
  progress: number
  progressMessage: string
  result: JobResult | null
  error: string | null
  isLoading: boolean
  isPolling: boolean

  // Job actions
  createVideoJob: (request: CreateJobRequest) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  cancelCurrentJob: () => Promise<void>
  reset: () => void

  // Job info
  canCancel: boolean
  isComplete: boolean
  estimatedDuration: number | null
}

export function useAsyncJob(options: UseAsyncJobOptions = {}): UseAsyncJobReturn {
  const {
    onSuccess,
    onError,
    onProgress,
    pollInterval = 3000,
    autoStartPolling = true,
  } = options

  // Job state
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<JobResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)

  // Refs for cleanup
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Update job status from API response
   */
  const updateJobStatus = useCallback(
    (statusResponse: JobStatusResponse) => {
      if (!isMountedRef.current) return

      setStatus(statusResponse.status)
      setProgress(statusResponse.progress)
      setProgressMessage(statusResponse.progress_message)
      setResult(statusResponse.result || null)
      setError(statusResponse.error || null)

      // Call progress callback
      if (onProgress) {
        onProgress(statusResponse)
      }
    },
    [onProgress]
  )

  /**
   * Poll job status
   */
  const pollStatus = useCallback(async () => {
    if (!jobId || !isMountedRef.current) return

    try {
      const statusResponse = await getJobStatus(jobId)
      updateJobStatus(statusResponse)

      // Check if job is complete
      if (isJobComplete(statusResponse.status)) {
        setIsPolling(false)

        if (statusResponse.status === 'success' && statusResponse.result) {
          if (onSuccess) {
            onSuccess(statusResponse.result)
          }
        } else if (statusResponse.status === 'failure') {
          const errorMsg = statusResponse.error || 'Job failed'
          setError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
        } else if (statusResponse.status === 'cancelled') {
          const errorMsg = 'Job was cancelled'
          setError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
        }
      } else {
        // Schedule next poll
        pollTimeoutRef.current = setTimeout(pollStatus, pollInterval)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get job status'
      setError(errorMsg)
      setIsPolling(false)
      if (onError) {
        onError(errorMsg)
      }
    }
  }, [jobId, pollInterval, updateJobStatus, onSuccess, onError])

  /**
   * Start polling job status
   */
  const startPolling = useCallback(() => {
    if (!jobId || isPolling) return

    setIsPolling(true)
    pollStatus()
  }, [jobId, isPolling, pollStatus])

  /**
   * Stop polling job status
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  /**
   * Create a new video job
   */
  const createVideoJob = useCallback(
    async (request: CreateJobRequest) => {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await createJob(request)

        if (!isMountedRef.current) {
          return
        }

        setJobId(response.job_id)
        setStatus(response.status)
        setEstimatedDuration(response.estimated_duration || null)
        setProgress(0)
        setProgressMessage('Job queued successfully')

        // Auto-start polling if enabled
        if (autoStartPolling) {
          // Small delay to let state update
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsPolling(true)
            }
          }, 500)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create job'
        setError(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [autoStartPolling, onError]
  )

  /**
   * Cancel current job
   */
  const cancelCurrentJob = useCallback(async () => {
    if (!jobId || !canCancelJob(status || 'pending')) {
      throw new Error('Cannot cancel job in current state')
    }

    stopPolling()

    try {
      await cancelJob(jobId)
      setStatus('cancelled')
      setError('Job cancelled')
      if (onError) {
        onError('Job cancelled by user')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel job'
      setError(errorMsg)
      throw err
    }
  }, [jobId, status, stopPolling, onError])

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    stopPolling()
    setJobId(null)
    setStatus(null)
    setProgress(0)
    setProgressMessage('')
    setResult(null)
    setError(null)
    setIsLoading(false)
    setEstimatedDuration(null)
  }, [stopPolling])

  // Auto-start polling when jobId changes (if enabled)
  useEffect(() => {
    if (jobId && autoStartPolling && !isPolling && status && !isJobComplete(status)) {
      startPolling()
    }
  }, [jobId, autoStartPolling, isPolling, status, startPolling])

  // Computed values
  const canCancel = status ? canCancelJob(status) : false
  const isComplete = status ? isJobComplete(status) : false

  return {
    // State
    jobId,
    status,
    progress,
    progressMessage,
    result,
    error,
    isLoading,
    isPolling,

    // Actions
    createVideoJob,
    startPolling,
    stopPolling,
    cancelCurrentJob,
    reset,

    // Computed
    canCancel,
    isComplete,
    estimatedDuration,
  }
}
