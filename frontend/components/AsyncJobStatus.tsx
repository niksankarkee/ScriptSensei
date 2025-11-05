'use client'

/**
 * Async Job Status Component
 *
 * Displays real-time status and progress for async video generation jobs
 * Uses polling to check job status every few seconds
 */

import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'
import {
  getJobStatus,
  cancelJob,
  getEstimatedTimeRemaining,
  isJobComplete,
  canCancelJob,
  type JobStatus,
  type JobResult,
  type JobStatusResponse,
} from '@/lib/asyncJobService'
import VideoPlayer from './VideoPlayer'

const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'

interface AsyncJobStatusProps {
  jobId: string
  scriptTitle?: string
  onComplete?: (result: JobResult) => void
  onError?: (error: string) => void
  onCancel?: () => void
  showCancelButton?: boolean
}

export default function AsyncJobStatus({
  jobId,
  scriptTitle,
  onComplete,
  onError,
  onCancel,
  showCancelButton = true,
}: AsyncJobStatusProps) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Initializing...')
  const [result, setResult] = useState<JobResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

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

  // Poll job status
  useEffect(() => {
    if (!jobId) return

    const pollStatus = async () => {
      if (!isMountedRef.current) return

      try {
        console.log(`Polling job status for ${jobId}...`)
        const statusResponse = await getJobStatus(jobId)
        console.log('Job status response:', statusResponse)

        if (!isMountedRef.current) return

        // Update state
        setStatus(statusResponse.status)
        setProgress(statusResponse.progress || 0)
        setProgressMessage(statusResponse.progress_message || 'Processing...')
        setResult(statusResponse.result || null)
        setError(statusResponse.error || null)
        setIsPolling(true)

        // Check if job is complete
        if (isJobComplete(statusResponse.status)) {
          console.log('Job is complete:', statusResponse.status)
          setIsPolling(false)

          if (statusResponse.status === 'success' && statusResponse.result) {
            console.log('Video completed successfully:', statusResponse.result)
            if (onComplete) {
              onComplete(statusResponse.result)
            }
          } else if (statusResponse.status === 'failure') {
            const errorMsg = statusResponse.error || 'Job failed'
            console.error('Video failed:', errorMsg)
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
          } else if (statusResponse.status === 'cancelled') {
            const errorMsg = 'Job was cancelled'
            console.log('Job cancelled')
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
          }
        } else {
          // Schedule next poll (every 2 seconds for faster updates)
          pollTimeoutRef.current = setTimeout(pollStatus, 2000)
        }
      } catch (err) {
        console.error('Failed to poll job status:', err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to get job status'
        setError(errorMsg)
        setIsPolling(false)
        if (onError) {
          onError(errorMsg)
        }
      }
    }

    // Start polling immediately
    pollStatus()

    // Cleanup timeout on unmount or when jobId changes
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [jobId, onComplete, onError])

  const handleCancel = async () => {
    try {
      await cancelJob(jobId)
      setStatus('cancelled')
      setError('Job cancelled')
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const progressPercentage = Math.round(progress * 100)
  const canCancel = status ? canCancelJob(status) : false

  // Transform video URL from file:// to HTTP download endpoint
  const getVideoUrl = (videoPath: string) => {
    if (!videoPath) return ''
    // If it's a file:// URL, convert to download endpoint
    if (videoPath.startsWith('file://')) {
      return `${API_BASE_URL}/api/v1/videos/${jobId}/download`
    }
    return videoPath
  }

  const getThumbnailUrl = (thumbnailPath?: string) => {
    if (!thumbnailPath) return undefined
    // If it's a file:// URL, convert to thumbnail endpoint
    if (thumbnailPath.startsWith('file://')) {
      return `${API_BASE_URL}/api/v1/videos/${jobId}/thumbnail`
    }
    return thumbnailPath
  }

  // Completed state
  if (status === 'success' && result) {
    return (
      <div className="space-y-4">
        {/* Success Message */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Video Ready!</h3>
            <p className="text-sm text-green-700">
              Your video has been generated successfully
            </p>
          </div>
        </div>

        {/* Video Player */}
        <VideoPlayer
          videoUrl={getVideoUrl(result.video_path)}
          thumbnailUrl={getThumbnailUrl(result.thumbnail_path)}
          title={scriptTitle}
          duration={result.duration}
          showDownload={true}
          className="w-full max-w-4xl mx-auto"
        />

        {/* Video Details */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-medium text-gray-900">
              {result.duration ? `${Math.round(result.duration)}s` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Format</div>
            <div className="font-medium text-gray-900">MP4</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Quality</div>
            <div className="font-medium text-gray-900">
              {result.resolution || 'HD 1080p'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Failed state
  if (status === 'failure' || status === 'cancelled') {
    return (
      <div className="space-y-4">
        {/* Error Message */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">
              {status === 'cancelled' ? 'Job Cancelled' : 'Processing Failed'}
            </h3>
            <p className="text-sm text-red-700 mb-3">
              {error || 'An error occurred while processing your video'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Processing state
  return (
    <div className="max-w-2xl mx-auto">
      {/* Polling Status Indicator */}
      {!isPolling && status !== 'success' && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <span>Connecting to server...</span>
        </div>
      )}

      {/* Processing Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with Icon */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-8 text-center border-b border-gray-200 relative">
          {/* Cancel Button */}
          {showCancelButton && canCancel && (
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
              title="Cancel job"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
            <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'processing'
              ? 'Creating Your Video...'
              : status === 'started'
              ? 'Starting Video Generation...'
              : 'Preparing...'}
          </h2>
          <p className="text-gray-600">{progressMessage || 'Generating video...'}</p>
        </div>

        {/* Progress Section */}
        <div className="p-8 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-2xl font-bold text-pink-600">{progressPercentage}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Current Status */}
          {status && (
            <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {status.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Estimated time remaining</p>
            <p className="text-lg font-semibold text-gray-900">
              {getEstimatedTimeRemaining(progress)}
            </p>
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-blue-50 border-t border-blue-100 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Processing in background
              </p>
              <p className="text-sm text-blue-700">
                Feel free to leave this page. Your video will be saved automatically and you can
                access it from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
