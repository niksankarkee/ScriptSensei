'use client'

/**
 * Video Generation Progress Component
 *
 * Displays live progress for video generation with animated progress bar
 * Similar to Fliki.ai's video creation experience
 * Polls job status every 2 seconds and shows real-time updates
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react'
import {
  getJobStatus,
  isJobComplete,
  type JobStatus,
  type JobStatusResponse,
} from '@/lib/asyncJobService'

const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'

interface VideoGenerationProgressProps {
  jobId: string
  scriptTitle?: string
  onComplete?: () => void
  onError?: (error: string) => void
}

export default function VideoGenerationProgress({
  jobId,
  scriptTitle,
  onComplete,
  onError,
}: VideoGenerationProgressProps) {
  const router = useRouter()
  const [status, setStatus] = useState<JobStatus>('pending')
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Elapsed time counter
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Poll job status
  useEffect(() => {
    if (!jobId) return

    const pollStatus = async () => {
      if (!isMountedRef.current) return

      try {
        console.log(`[VideoGenerationProgress] Polling job ${jobId}...`)

        // Try jobs API first
        let statusResponse: JobStatusResponse
        try {
          statusResponse = await getJobStatus(jobId)
        } catch (jobError) {
          // If job not found, fall back to checking video status directly
          console.log('[VideoGenerationProgress] Job not found, checking video status directly...')
          const videoResponse = await fetch(`${API_BASE_URL}/api/v1/videos/${jobId}`)

          if (!videoResponse.ok) {
            throw new Error('Video not found')
          }

          const videoData = await videoResponse.json()

          if (!videoData.success) {
            throw new Error(videoData.error || 'Failed to get video status')
          }

          // Convert video status to job status format
          const video = videoData.data
          statusResponse = {
            job_id: video.id,
            status: video.status === 'completed' ? 'success' : video.status === 'failed' ? 'failure' : 'processing',
            progress: video.status === 'completed' ? 1.0 : 0.5,
            progress_message: video.status === 'completed' ? 'Video completed!' : video.status === 'failed' ? 'Video failed' : 'Processing video...',
            result: video.status === 'completed' ? {
              video_path: video.video_url,
              thumbnail_path: video.thumbnail_url,
              duration: video.duration,
              file_size: video.file_size,
              resolution: '1080p'
            } : undefined,
            error: video.status === 'failed' ? 'Video generation failed' : undefined,
            created_at: video.created_at,
            retry_count: 0
          }
        }

        console.log('[VideoGenerationProgress] Status:', statusResponse)

        if (!isMountedRef.current) return

        // Update state
        setStatus(statusResponse.status)
        setProgress(statusResponse.progress || 0)
        setProgressMessage(statusResponse.progress_message || 'Processing...')

        // Check if job is complete
        if (isJobComplete(statusResponse.status)) {
          console.log('[VideoGenerationProgress] Job completed:', statusResponse.status)
          setIsPolling(false)

          if (statusResponse.status === 'success') {
            console.log('[VideoGenerationProgress] Video completed successfully')

            // Wait 1 second to show 100% completion, then redirect
            setTimeout(() => {
              if (onComplete) {
                onComplete()
              }
              // Redirect to video player page
              router.push(`/dashboard/videos/${jobId}`)
            }, 1000)
          } else if (statusResponse.status === 'failure') {
            const errorMsg = statusResponse.error || 'Video generation failed'
            console.error('[VideoGenerationProgress] Video failed:', errorMsg)
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
          } else if (statusResponse.status === 'cancelled') {
            const errorMsg = 'Video generation was cancelled'
            console.log('[VideoGenerationProgress] Job cancelled')
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
          }
        } else {
          // Schedule next poll (every 2 seconds)
          pollTimeoutRef.current = setTimeout(pollStatus, 2000)
        }
      } catch (err) {
        console.error('[VideoGenerationProgress] Failed to poll job status:', err)
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

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [jobId, router, onComplete, onError])

  const progressPercentage = Math.round(progress * 100)

  // Format elapsed time (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get estimated time remaining based on progress
  const getEstimatedTimeRemaining = (): string => {
    if (progress < 0.1) return '~2 minutes'
    if (progress < 0.3) return '~1.5 minutes'
    if (progress < 0.5) return '~1 minute'
    if (progress < 0.7) return '~45 seconds'
    if (progress < 0.9) return '~30 seconds'
    if (progress < 0.95) return '~15 seconds'
    return 'Almost done...'
  }

  // Get progress stage message
  const getStageMessage = (): string => {
    if (progress < 0.2) return 'Analyzing script content...'
    if (progress < 0.4) return 'Generating voiceover...'
    if (progress < 0.6) return 'Creating video scenes...'
    if (progress < 0.8) return 'Adding music and effects...'
    if (progress < 0.95) return 'Rendering final video...'
    return 'Finalizing your video...'
  }

  // Failed state
  if (status === 'failure' || status === 'cancelled' || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {status === 'cancelled' ? 'Generation Cancelled' : 'Generation Failed'}
              </h2>
              <p className="text-red-100">
                We encountered an issue while creating your video
              </p>
            </div>

            {/* Error Details */}
            <div className="p-8 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  {error || 'An unexpected error occurred during video generation'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/dashboard/create')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/dashboard/videos')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go to Videos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Processing state (main UI)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-3xl w-full">
        {/* Main Progress Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header with animated gradient */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-10 text-center relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-xl">
                <Loader2 className="h-10 w-10 text-pink-600 animate-spin" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                Creating Your Video
              </h2>

              {scriptTitle && (
                <p className="text-lg text-purple-100 mb-2 font-medium">
                  {scriptTitle}
                </p>
              )}

              <p className="text-purple-100">
                {getStageMessage()}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="p-10 space-y-8">
            {/* Large Progress Percentage */}
            <div className="text-center">
              <div className="inline-flex items-baseline space-x-2">
                <span className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {progressPercentage}
                </span>
                <span className="text-3xl font-semibold text-gray-400">%</span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-3">
              <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">{progressMessage}</span>
                <span className="text-gray-500">Est. {getEstimatedTimeRemaining()}</span>
              </div>
            </div>

            {/* Progress Stages */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Script', threshold: 0.2, icon: '📝' },
                { label: 'Voice', threshold: 0.4, icon: '🎙️' },
                { label: 'Scenes', threshold: 0.6, icon: '🎬' },
                { label: 'Final', threshold: 0.9, icon: '✨' },
              ].map((stage, index) => (
                <div
                  key={index}
                  className={`text-center p-3 rounded-lg transition-all duration-300 ${
                    progress >= stage.threshold
                      ? 'bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-300'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{stage.icon}</div>
                  <div
                    className={`text-xs font-semibold ${
                      progress >= stage.threshold ? 'text-pink-700' : 'text-gray-500'
                    }`}
                  >
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Info */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Elapsed Time</div>
                <div className="text-xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="inline-flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="bg-blue-50 border-t border-blue-100 p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Processing in background
                </p>
                <p className="text-sm text-blue-700">
                  Feel free to leave this page. Your video will be ready soon and you can access it from your videos library.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard/videos')}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Go to Videos Library →
          </button>
        </div>
      </div>

      {/* Add shimmer animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
