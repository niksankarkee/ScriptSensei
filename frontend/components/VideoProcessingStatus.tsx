'use client'

/**
 * Video Processing Status Component
 *
 * Shows real-time progress of video generation with WebSocket updates
 * Displays video player when processing is complete
 */

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import VideoPlayer from './VideoPlayer'

interface VideoProcessingStatusProps {
  jobId: string
  scriptTitle?: string
  onComplete?: (videoUrl: string) => void
  onError?: (error: string) => void
}

export default function VideoProcessingStatus({
  jobId,
  scriptTitle,
  onComplete,
  onError,
}: VideoProcessingStatusProps) {
  const { isConnected, progressState } = useVideoProgress(jobId, {
    onCompleted: (result) => {
      console.log('Video completed:', result)
      if (onComplete) {
        onComplete(result.video_url)
      }
    },
    onFailed: (error) => {
      console.error('Video failed:', error)
      if (onError) {
        onError(error.error)
      }
    },
  })

  const { status, progress, message, currentStep, videoUrl, thumbnailUrl, duration, error } =
    progressState

  // Connection status indicator
  const ConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>Connecting to server...</span>
        </div>
      )
    }
    return null
  }

  // Render based on status
  if (status === 'completed' && videoUrl) {
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
          videoUrl={videoUrl}
          thumbnailUrl={thumbnailUrl}
          title={scriptTitle}
          duration={duration}
          showDownload={true}
          className="w-full max-w-4xl mx-auto"
        />

        {/* Video Details */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-medium text-gray-900">
              {duration ? `${Math.round(duration)}s` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Format</div>
            <div className="font-medium text-gray-900">MP4</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Quality</div>
            <div className="font-medium text-gray-900">HD 1080p</div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <ConnectionStatus />

        {/* Error Message */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Processing Failed</h3>
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

  // Processing or idle state
  return (
    <div className="max-w-2xl mx-auto">
      <ConnectionStatus />

      {/* Simple Processing Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with Icon */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-8 text-center border-b border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
            <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'processing' ? 'Creating Your Video...' : 'Preparing...'}
          </h2>
          <p className="text-gray-600">
            {message || 'Generating video...'}
          </p>
        </div>

        {/* Progress Section */}
        <div className="p-8 space-y-6">
          {/* Simple Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-2xl font-bold text-pink-600">{progress}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Current Status */}
          {currentStep && (
            <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {currentStep.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Estimated time remaining</p>
            <p className="text-lg font-semibold text-gray-900">
              {progress < 20
                ? '~2 minutes'
                : progress < 50
                ? '~1.5 minutes'
                : progress < 80
                ? '~1 minute'
                : progress < 95
                ? '~30 seconds'
                : 'Almost done...'}
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
                Feel free to leave this page. Your video will be saved automatically and you can access it from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
