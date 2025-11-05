'use client'

/**
 * Bulk Video Creator Component
 *
 * Create multiple videos at once from CSV/spreadsheet data
 * Features:
 * - CSV file upload and parsing
 * - Template selection for all videos
 * - Column mapping (title, script, voice, etc.)
 * - Preview before generation
 * - Batch progress tracking
 * - Individual video status
 * - Pause/resume batch processing
 */

import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Video,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react'

interface VideoData {
  id: string
  title: string
  script: string
  voiceId?: string
  platform?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  error?: string
}

interface BulkVideoCreatorProps {
  onStartBatch?: (videos: VideoData[]) => void
  onCancel?: () => void
}

export default function BulkVideoCreator({ onStartBatch, onCancel }: BulkVideoCreatorProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing'>('upload')
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<{
    title: string
    script: string
    voice: string
    platform: string
  }>({
    title: '',
    script: '',
    voice: '',
    platform: '',
  })
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length === 0) return

      // Parse headers
      const headerLine = lines[0].split(',').map((h) => h.trim())
      setHeaders(headerLine)

      // Parse data rows
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        const row: any = {}
        headerLine.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })

      setCsvData(data)
      setStep('mapping')

      // Auto-detect common column names
      const autoMapping = {
        title: headerLine.find((h) => h.toLowerCase().includes('title')) || '',
        script: headerLine.find((h) => h.toLowerCase().includes('script') || h.toLowerCase().includes('text')) || '',
        voice: headerLine.find((h) => h.toLowerCase().includes('voice')) || '',
        platform: headerLine.find((h) => h.toLowerCase().includes('platform')) || '',
      }
      setColumnMapping(autoMapping)
    }
    reader.readAsText(file)
  }

  // Generate videos from mapped data
  const handleGeneratePreview = () => {
    const generatedVideos: VideoData[] = csvData.map((row, index) => ({
      id: `video-${index}`,
      title: row[columnMapping.title] || `Video ${index + 1}`,
      script: row[columnMapping.script] || '',
      voiceId: row[columnMapping.voice] || undefined,
      platform: row[columnMapping.platform] || undefined,
      status: 'pending',
      progress: 0,
    }))

    setVideos(generatedVideos)
    setStep('preview')
  }

  // Start batch processing
  const handleStartProcessing = () => {
    setStep('processing')
    setIsProcessing(true)
    onStartBatch?.(videos)

    // Simulate batch processing
    simulateBatchProcessing()
  }

  // Simulate batch processing
  const simulateBatchProcessing = () => {
    let currentIndex = 0

    const processNext = () => {
      if (currentIndex >= videos.length || isPaused) return

      setVideos((prev) =>
        prev.map((v, i) =>
          i === currentIndex ? { ...v, status: 'processing', progress: 0 } : v
        )
      )

      // Simulate progress
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        setVideos((prev) =>
          prev.map((v, i) => (i === currentIndex ? { ...v, progress } : v))
        )

        if (progress >= 100) {
          clearInterval(progressInterval)

          // Simulate random success/failure
          const success = Math.random() > 0.1
          setVideos((prev) =>
            prev.map((v, i) =>
              i === currentIndex
                ? {
                    ...v,
                    status: success ? 'completed' : 'failed',
                    progress: 100,
                    videoUrl: success ? 'https://example.com/video.mp4' : undefined,
                    error: success ? undefined : 'Failed to generate video',
                  }
                : v
            )
          )

          currentIndex++
          setTimeout(processNext, 500)
        }
      }, 200)
    }

    processNext()
  }

  // Toggle pause/resume
  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      simulateBatchProcessing()
    }
  }

  // Get batch statistics
  const stats = {
    total: videos.length,
    completed: videos.filter((v) => v.status === 'completed').length,
    failed: videos.filter((v) => v.status === 'failed').length,
    processing: videos.filter((v) => v.status === 'processing').length,
    pending: videos.filter((v) => v.status === 'pending').length,
  }

  // Render upload step
  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bulk Video Creator</h2>
          <p className="text-gray-600">Create multiple videos at once from a CSV file</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-pink-600 hover:bg-pink-50 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload CSV File</h3>
          <p className="text-gray-600 mb-6">
            Upload a CSV file containing video titles and scripts
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Choose File
          </button>
        </div>

        {/* CSV Format Guide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h4>
              <p className="text-sm text-blue-700 mb-2">Your CSV file should include these columns:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li><strong>title</strong> - Video title (required)</li>
                <li><strong>script</strong> - Video script or text content (required)</li>
                <li><strong>voice</strong> - Voice ID or name (optional)</li>
                <li><strong>platform</strong> - Target platform: tiktok, youtube, instagram (optional)</li>
              </ul>
              <a
                href="/sample-bulk-videos.csv"
                download
                className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render column mapping step
  if (step === 'mapping') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Map Columns</h2>
          <p className="text-gray-600">Match your CSV columns to video fields</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.title}
                onChange={(e) => setColumnMapping({ ...columnMapping, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              >
                <option value="">Select column...</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.script}
                onChange={(e) => setColumnMapping({ ...columnMapping, script: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              >
                <option value="">Select column...</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Column (Optional)
              </label>
              <select
                value={columnMapping.voice}
                onChange={(e) => setColumnMapping({ ...columnMapping, voice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              >
                <option value="">Select column...</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Column (Optional)
              </label>
              <select
                value={columnMapping.platform}
                onChange={(e) => setColumnMapping({ ...columnMapping, platform: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              >
                <option value="">Select column...</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview first row */}
          {csvData.length > 0 && columnMapping.title && columnMapping.script && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (First Row)</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Title:</span>{' '}
                  <span className="font-medium">{csvData[0][columnMapping.title]}</span>
                </p>
                <p>
                  <span className="text-gray-600">Script:</span>{' '}
                  <span className="font-medium">
                    {csvData[0][columnMapping.script]?.substring(0, 100)}...
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep('upload')}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleGeneratePreview}
            disabled={!columnMapping.title || !columnMapping.script}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Preview
          </button>
        </div>
      </div>
    )
  }

  // Render preview step
  if (step === 'preview') {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Preview Videos</h2>
          <p className="text-gray-600">Review and edit before generating {videos.length} videos</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Script Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video, index) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {video.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {video.script.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {video.platform || 'Default'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep('mapping')}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleStartProcessing}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
          >
            <Play className="h-5 w-5" />
            Start Generating {videos.length} Videos
          </button>
        </div>
      </div>
    )
  }

  // Render processing step
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generating Videos</h2>
        <p className="text-gray-600">Processing {videos.length} videos in batch</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600 mb-1">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {stats.completed + stats.failed} / {stats.total}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((stats.completed + stats.failed) / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Video List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-b-0"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {video.status === 'completed' && (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
                {video.status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
                {video.status === 'processing' && (
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                )}
                {video.status === 'pending' && (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                {video.error && (
                  <p className="text-xs text-red-600 mt-1">{video.error}</p>
                )}
              </div>

              {/* Progress Bar */}
              {video.status === 'processing' && (
                <div className="flex-1">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {video.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={togglePause}
          className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
        >
          {isPaused ? (
            <>
              <Play className="h-5 w-5" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-5 w-5" />
              Pause
            </>
          )}
        </button>
      </div>
    </div>
  )
}
