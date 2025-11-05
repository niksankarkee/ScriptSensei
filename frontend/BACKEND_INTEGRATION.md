# Backend Integration Guide

Complete guide for integrating frontend components with ScriptSensei microservices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [API Client Architecture](#api-client-architecture)
4. [Service Layer Usage](#service-layer-usage)
5. [Component Integration Examples](#component-integration-examples)
6. [Real-time WebSocket Updates](#real-time-websocket-updates)
7. [Error Handling](#error-handling)
8. [Authentication Flow](#authentication-flow)
9. [File Upload Patterns](#file-upload-patterns)
10. [Best Practices](#best-practices)

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install axios socket.io-client
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# API Gateway (Kong)
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000

# Microservices (Direct - Optional)
NEXT_PUBLIC_CONTENT_SERVICE_URL=http://localhost:8011
NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:8012
NEXT_PUBLIC_VOICE_SERVICE_URL=http://localhost:8013
NEXT_PUBLIC_TRANSLATION_SERVICE_URL=http://localhost:8014
NEXT_PUBLIC_ANALYTICS_SERVICE_URL=http://localhost:8015
NEXT_PUBLIC_TREND_SERVICE_URL=http://localhost:8016

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Import and Use Services

```typescript
import { generateScript, listScripts } from '@/lib/api'

// In your component
const script = await generateScript({
  topic: 'AI in Healthcare',
  platform: 'youtube',
  language: 'en',
  duration: 60,
})
```

---

## Environment Setup

### Development vs Production

**Development** (`.env.local`):
```bash
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
```

**Production** (`.env.production`):
```bash
NEXT_PUBLIC_API_GATEWAY_URL=https://api.scriptsensei.com
```

### Service Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Kong API Gateway | 8000 | Main entry point (use this) |
| Content Service | 8011 | Scripts, templates |
| Video Processing | 8012 | Video generation |
| Voice Service | 8013 | Voice cloning, TTS |
| Translation | 8014 | Multi-language support |
| Analytics | 8015 | Performance metrics |
| Trend Service | 8016 | Trending topics |

**Recommendation**: Always use Kong Gateway (port 8000) for production. Direct service URLs are for development debugging only.

---

## API Client Architecture

### Core Client (`lib/api-client.ts`)

The API client provides:
- **Automatic authentication** - JWT token injection
- **Token refresh** - Automatic refresh on 401 errors
- **Error handling** - Centralized error processing
- **Request/response logging** - Development debugging
- **File upload helpers** - Multipart form data with progress
- **Streaming support** - Real-time script generation

### Client Creation

```typescript
import { apiClient } from '@/lib/api-client'

// Makes authenticated request
const response = await apiClient.get('/api/v1/scripts')
```

### Request Interceptor Flow

```
1. Your code calls apiClient.get('/api/v1/scripts')
2. Request interceptor adds: Authorization: Bearer <token>
3. Request sent to backend
4. Response interceptor checks for 401
5. If 401: Refresh token → Retry request
6. If success: Return data to your code
```

---

## Service Layer Usage

All services follow consistent patterns. Import from `@/lib/api`:

```typescript
import {
  // Content Service
  generateScript,
  listScripts,
  getScript,
  updateScript,
  deleteScript,
  getTemplates,

  // Video Service
  generateVideo,
  listVideos,
  getVideo,
  deleteVideo,
  getVideoScenes,
  updateScene,

  // Voice Service
  listVoices,
  getVoice,
  cloneVoice,
  previewVoice,

  // Analytics Service
  getAnalytics,
  getVideoAnalytics,
  exportAnalytics,

  // Trend Service
  getTrends,
  getTrendsByPlatform,
  searchTrends,
  predictTrends,

  // Media Service
  getStockMedia,
  generateAIMedia,
  uploadMedia,
  getUserMedia,
  deleteMedia,
} from '@/lib/api'
```

### TypeScript Interfaces

All requests and responses are fully typed:

```typescript
import type {
  Script,
  GenerateScriptRequest,
  Video,
  GenerateVideoRequest,
  Voice,
  MediaItem,
  AnalyticsData,
  Trend,
} from '@/lib/api'
```

---

## Component Integration Examples

### Example 1: Script Generation in VideoCreationWizard

**File**: `components/VideoCreationWizard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { generateScript, generateScriptStream } from '@/lib/api'
import type { GenerateScriptRequest, Script } from '@/lib/api'

export default function VideoCreationWizard() {
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Method 1: Standard request (wait for complete response)
  const handleGenerateScript = async (formData: GenerateScriptRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await generateScript(formData)
      setScript(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate script')
      console.error('Script generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Method 2: Streaming request (real-time updates)
  const handleGenerateScriptStreaming = async (formData: GenerateScriptRequest) => {
    setLoading(true)
    setError(null)
    let streamedContent = ''

    try {
      await generateScriptStream(formData, (chunk) => {
        streamedContent += chunk
        setScript((prev) => ({
          ...prev!,
          content: streamedContent,
        }))
      })
    } catch (err: any) {
      setError(err.message || 'Failed to generate script')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Your form UI */}
      <button onClick={() => handleGenerateScript({ topic: 'AI' })}>
        Generate Script
      </button>

      {loading && <div>Generating script...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {script && <div>{script.content}</div>}
    </div>
  )
}
```

### Example 2: Video Generation with Real-time Progress

**File**: `components/VideoCreationWizard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { generateVideo } from '@/lib/api'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import type { GenerateVideoRequest } from '@/lib/api'

export default function VideoGenerator() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)

  // WebSocket hook for real-time progress
  const { isConnected, progressState } = useVideoProgress(jobId, {
    onCompleted: (data) => {
      console.log('Video completed!', data.video_url)
      // Show success message, redirect, etc.
    },
    onFailed: (error) => {
      console.error('Video generation failed:', error)
      // Show error message
    },
  })

  const handleGenerateVideo = async (formData: GenerateVideoRequest) => {
    try {
      // Start video generation
      const result = await generateVideo(formData)

      // Store job ID for WebSocket tracking
      setJobId(result.job_id)
      setVideoId(result.video_id)

      // WebSocket will now receive real-time updates
    } catch (err: any) {
      console.error('Failed to start video generation:', err)
    }
  }

  return (
    <div>
      <button onClick={() => handleGenerateVideo({
        script_id: 'script-123',
        title: 'My Video',
        voice_id: 'voice-456',
        media_type: 'stock',
        platform: 'youtube',
      })}>
        Generate Video
      </button>

      {/* Progress indicator */}
      {jobId && (
        <div>
          <div>Status: {progressState.status}</div>
          <div>Progress: {progressState.progress}%</div>
          <div>Message: {progressState.message}</div>
          <div>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-600 h-2 rounded-full transition-all"
              style={{ width: `${progressState.progress}%` }}
            />
          </div>

          {/* Completed video */}
          {progressState.status === 'completed' && progressState.videoUrl && (
            <video src={progressState.videoUrl} controls />
          )}
        </div>
      )}
    </div>
  )
}
```

### Example 3: Video Library with Data Fetching

**File**: `components/VideoLibrary.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { listVideos, deleteVideo } from '@/lib/api'
import type { Video } from '@/lib/api'

export default function VideoLibrary() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all')

  // Fetch videos on mount and when filters change
  useEffect(() => {
    fetchVideos()
  }, [page, filter])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const result = await listVideos({
        page,
        limit: 12,
        status: filter === 'all' ? undefined : filter,
      })

      setVideos(result.videos)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return

    try {
      await deleteVideo(videoId)
      // Refresh list
      fetchVideos()
    } catch (err) {
      console.error('Failed to delete video:', err)
    }
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
        <button onClick={() => setFilter('processing')}>Processing</button>
      </div>

      {/* Video grid */}
      {loading ? (
        <div>Loading videos...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border rounded-lg p-4">
              <img src={video.thumbnail_url} alt={video.title} />
              <h3>{video.title}</h3>
              <p>Status: {video.status}</p>
              <p>Views: {video.views}</p>
              <button onClick={() => handleDeleteVideo(video.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / 12)}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / 12)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### Example 4: Voice Cloning with Upload Progress

**File**: `components/VoiceCloningModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { cloneVoice } from '@/lib/api'
import type { Voice } from '@/lib/api'

export default function VoiceCloningModal() {
  const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [clonedVoice, setClonedVoice] = useState<Voice | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file')
        return
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB')
        return
      }

      setAudioFile(file)
    }
  }

  const handleCloneVoice = async () => {
    if (!voiceName || !audioFile) {
      alert('Please provide voice name and audio file')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const result = await cloneVoice(
        voiceName,
        audioFile,
        // Progress callback
        (progress) => {
          setUploadProgress(progress)
        }
      )

      setClonedVoice(result)
      alert('Voice cloned successfully!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clone voice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2>Clone Your Voice</h2>

      <input
        type="text"
        placeholder="Voice name"
        value={voiceName}
        onChange={(e) => setVoiceName(e.target.value)}
      />

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />

      {audioFile && <p>Selected: {audioFile.name}</p>}

      <button onClick={handleCloneVoice} disabled={loading}>
        {loading ? 'Cloning...' : 'Clone Voice'}
      </button>

      {/* Upload progress */}
      {loading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      {/* Cloned voice preview */}
      {clonedVoice && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3>Voice Cloned!</h3>
          <p>Voice ID: {clonedVoice.id}</p>
          <p>Name: {clonedVoice.name}</p>
          <audio src={clonedVoice.preview_url} controls />
        </div>
      )}
    </div>
  )
}
```

### Example 5: Analytics Dashboard Integration

**File**: `components/AnalyticsDashboard.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getAnalytics, exportAnalytics } from '@/lib/api'
import type { AnalyticsData } from '@/lib/api'

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const data = await getAnalytics(dateRange)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportAnalytics(dateRange, 'csv')

      // Download file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${dateRange}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export analytics:', err)
    }
  }

  if (loading || !analytics) {
    return <div>Loading analytics...</div>
  }

  return (
    <div>
      {/* Date range selector */}
      <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>

      <button onClick={handleExport}>Export CSV</button>

      {/* Overview metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <h3>Total Views</h3>
          <p>{analytics.overview.totalViews.toLocaleString()}</p>
          <p className="text-sm">
            {analytics.overview.viewsChange > 0 ? '+' : ''}
            {analytics.overview.viewsChange}%
          </p>
        </div>

        <div>
          <h3>Engagement</h3>
          <p>{analytics.overview.totalEngagement}%</p>
          <p className="text-sm">
            {analytics.overview.engagementChange > 0 ? '+' : ''}
            {analytics.overview.engagementChange}%
          </p>
        </div>

        {/* More metrics... */}
      </div>

      {/* Platform breakdown */}
      <div className="mt-8">
        <h3>Platform Breakdown</h3>
        {analytics.platformBreakdown.map((platform) => (
          <div key={platform.platform}>
            <span>{platform.platform}</span>
            <span>{platform.percentage}%</span>
            <span>{platform.views.toLocaleString()} views</span>
          </div>
        ))}
      </div>

      {/* Top videos */}
      <div className="mt-8">
        <h3>Top Performing Videos</h3>
        {analytics.topVideos.map((video) => (
          <div key={video.id}>
            <img src={video.thumbnailUrl} alt={video.title} />
            <h4>{video.title}</h4>
            <p>{video.views.toLocaleString()} views</p>
            <p>{video.engagement}% engagement</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Example 6: Trend Explorer Integration

**File**: `components/TrendExplorer.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getTrends, getTrendsByPlatform, searchTrends } from '@/lib/api'
import type { Trend } from '@/lib/api'

export default function TrendExplorer() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [platform, setPlatform] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [platform])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const data = platform === 'all'
        ? await getTrends({ time_range: '24h' })
        : await getTrendsByPlatform(platform as any, '24h')

      setTrends(data)
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) return

    setLoading(true)
    try {
      const results = await searchTrends(searchQuery, platform === 'all' ? undefined : platform as any)
      setTrends(results)
    } catch (err) {
      console.error('Failed to search trends:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Platform filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setPlatform('all')}>All</button>
        <button onClick={() => setPlatform('tiktok')}>TikTok</button>
        <button onClick={() => setPlatform('youtube')}>YouTube</button>
        <button onClick={() => setPlatform('instagram')}>Instagram</button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search trends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Trends grid */}
      {loading ? (
        <div>Loading trends...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {trends.map((trend) => (
            <div key={trend.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3>{trend.topic}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  trend.hotness === 'viral' ? 'bg-red-100 text-red-600' :
                  trend.hotness === 'rising' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {trend.hotness}
                </span>
              </div>

              {trend.hashtag && (
                <p className="text-blue-600 text-sm">#{trend.hashtag}</p>
              )}

              <div className="mt-2 text-sm text-gray-600">
                <p>{trend.views.toLocaleString()} views</p>
                <p>{trend.posts.toLocaleString()} posts</p>
                <p className="text-green-600">
                  {trend.views_change > 0 ? '+' : ''}
                  {trend.views_change}% growth
                </p>
              </div>

              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Predicted growth: {trend.predicted_growth}%
                </p>
              </div>

              {/* Related topics */}
              {trend.related_topics.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold">Related:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trend.related_topics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Use trend button */}
              <button
                className="mt-3 w-full bg-pink-600 text-white py-2 rounded"
                onClick={() => {
                  // Navigate to script generator with trend topic
                  window.location.href = `/create?topic=${encodeURIComponent(trend.topic)}`
                }}
              >
                Create Video
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Example 7: Bulk Video Creator Integration

**File**: `components/BulkVideoCreator.tsx`

```typescript
'use client'

import { useState } from 'react'
import { generateBulkVideos, getBulkJobStatus } from '@/lib/api'
import type { BulkVideoRequest } from '@/lib/api'

export default function BulkVideoCreator() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file')
        return
      }
      setCsvFile(file)
    }
  }

  const handleBulkGenerate = async () => {
    if (!csvFile) return

    setLoading(true)
    try {
      // Parse CSV and create bulk request
      const csvData = await parseCsvFile(csvFile)

      const bulkRequest: BulkVideoRequest = {
        template_id: 'template-123',
        voice_id: 'voice-456',
        videos: csvData.map((row) => ({
          title: row.title,
          script_content: row.script,
          custom_data: {
            product_name: row.product_name,
            price: row.price,
          },
        })),
        platform: 'tiktok',
        aspect_ratio: '9:16',
      }

      const result = await generateBulkVideos(bulkRequest)
      setJobId(result.job_id)

      // Poll for status
      pollJobStatus(result.job_id)
    } catch (err) {
      console.error('Failed to start bulk generation:', err)
      alert('Failed to start bulk video generation')
    } finally {
      setLoading(false)
    }
  }

  const pollJobStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getBulkJobStatus(id)
        setJobStatus(status)

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err)
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds
  }

  const parseCsvFile = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const rows = text.split('\n').slice(1) // Skip header
        const data = rows.map((row) => {
          const [title, script, product_name, price] = row.split(',')
          return { title, script, product_name, price }
        })
        resolve(data)
      }
      reader.readAsText(file)
    })
  }

  return (
    <div className="p-6">
      <h2>Bulk Video Creator</h2>

      {/* CSV upload */}
      <div className="mb-4">
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        {csvFile && <p>Selected: {csvFile.name}</p>}
      </div>

      {/* Download sample CSV */}
      <a href="/sample-bulk-videos.csv" download className="text-blue-600">
        Download Sample CSV
      </a>

      {/* Generate button */}
      <button
        onClick={handleBulkGenerate}
        disabled={!csvFile || loading}
        className="mt-4 bg-pink-600 text-white px-6 py-2 rounded"
      >
        {loading ? 'Starting...' : 'Generate Videos'}
      </button>

      {/* Job status */}
      {jobStatus && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3>Bulk Job Status</h3>
          <p>Status: {jobStatus.status}</p>
          <p>Total: {jobStatus.total_videos}</p>
          <p>Completed: {jobStatus.completed_videos}</p>
          <p>Failed: {jobStatus.failed_videos}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{
                width: `${(jobStatus.completed_videos / jobStatus.total_videos) * 100}%`,
              }}
            />
          </div>

          {/* Completed videos */}
          {jobStatus.status === 'completed' && (
            <div className="mt-4">
              <h4>Generated Videos:</h4>
              <ul className="list-disc pl-5">
                {jobStatus.video_ids.map((id: string) => (
                  <li key={id}>
                    <a href={`/videos/${id}`} className="text-blue-600">
                      {id}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Real-time WebSocket Updates

### useVideoProgress Hook

The `useVideoProgress` hook provides real-time video processing updates via Socket.IO.

**Usage**:

```typescript
import { useVideoProgress } from '@/hooks/useVideoProgress'

const {
  isConnected,      // WebSocket connection status
  progressState,    // Current progress state
  socket,           // Socket.IO instance (for advanced usage)
} = useVideoProgress(jobId, {
  onStarted: (data) => {
    console.log('Video processing started', data)
  },
  onProgress: (data) => {
    console.log('Progress update', data.progress, data.message)
  },
  onCompleted: (data) => {
    console.log('Video completed!', data.video_url)
  },
  onFailed: (error) => {
    console.error('Video failed', error)
  },
})
```

### Progress State Interface

```typescript
interface VideoProgressState {
  status: 'idle' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  message?: string
  currentStep?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
}
```

### WebSocket Events

| Event | Description | Data |
|-------|-------------|------|
| `processing_started` | Video processing started | `{ job_id, video_id, message }` |
| `progress_update` | Progress update | `{ job_id, progress, message, current_step }` |
| `processing_completed` | Video completed | `{ job_id, video_id, video_url, thumbnail_url, duration }` |
| `processing_failed` | Processing failed | `{ job_id, error, message }` |

### Connection Management

The hook automatically:
- ✅ Connects to Socket.IO server (port 8012)
- ✅ Subscribes to job-specific updates
- ✅ Handles reconnection with exponential backoff
- ✅ Cleans up on unmount
- ✅ Provides connection status

---

## Error Handling

### Error Response Format

All API errors follow this structure:

```typescript
{
  error: string          // Error type (e.g., "VALIDATION_ERROR")
  message: string        // User-friendly message
  details?: any          // Additional error details
  field?: string         // Field that caused error (for validation)
}
```

### Error Handling Pattern

```typescript
try {
  const result = await generateScript({ topic: 'AI' })
  // Success
} catch (error: any) {
  if (error.response) {
    // Server responded with error status
    const { error: errorType, message, details } = error.response.data

    switch (error.response.status) {
      case 400:
        // Validation error
        console.error('Validation error:', message, details)
        break
      case 401:
        // Unauthorized (token expired or invalid)
        console.error('Please log in again')
        // Redirect to login
        break
      case 403:
        // Forbidden (insufficient permissions)
        console.error('You do not have permission')
        break
      case 404:
        // Resource not found
        console.error('Resource not found')
        break
      case 429:
        // Rate limit exceeded
        console.error('Too many requests. Please try again later.')
        break
      case 500:
        // Server error
        console.error('Server error. Please try again.')
        break
      default:
        console.error('Unexpected error:', message)
    }
  } else if (error.request) {
    // Request made but no response (network error)
    console.error('Network error. Please check your connection.')
  } else {
    // Something else happened
    console.error('Error:', error.message)
  }
}
```

### Global Error Handler (Recommended)

Create a global error handler component:

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

Use in your app:

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

---

## Authentication Flow

### Clerk Integration

ScriptSensei uses Clerk for authentication. The API client automatically handles JWT tokens.

### Authentication Flow

```
1. User logs in via Clerk
2. Clerk returns JWT token
3. Store token in localStorage
4. API client adds token to all requests
5. Backend verifies token via Kong Gateway
6. If token expires (401), refresh automatically
```

### Getting User Token

```typescript
import { useAuth } from '@clerk/nextjs'

export default function Component() {
  const { getToken, userId } = useAuth()

  const makeAuthenticatedRequest = async () => {
    const token = await getToken()

    // Token is automatically added by apiClient
    // But you can manually add it if needed:
    const response = await fetch('/api/v1/scripts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }
}
```

### Protected Routes

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <div>Dashboard</div>
}
```

### Middleware for Auth

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  ignoredRoutes: ['/api/public'],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

---

## File Upload Patterns

### Single File Upload with Progress

```typescript
import { uploadMedia } from '@/lib/api'

const [progress, setProgress] = useState(0)
const [file, setFile] = useState<File | null>(null)

const handleUpload = async () => {
  if (!file) return

  try {
    const result = await uploadMedia(file, (progress) => {
      setProgress(progress)
      console.log(`Upload progress: ${progress}%`)
    })

    console.log('Uploaded:', result.url)
  } catch (err) {
    console.error('Upload failed:', err)
  }
}
```

### Multiple File Upload

```typescript
const handleMultipleUpload = async (files: File[]) => {
  const uploads = files.map((file) =>
    uploadMedia(file, (progress) => {
      console.log(`${file.name}: ${progress}%`)
    })
  )

  try {
    const results = await Promise.all(uploads)
    console.log('All files uploaded:', results)
  } catch (err) {
    console.error('Some uploads failed:', err)
  }
}
```

### Drag and Drop Upload

```typescript
const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault()

  const files = Array.from(e.dataTransfer.files)
  const mediaFiles = files.filter((file) =>
    file.type.startsWith('image/') || file.type.startsWith('video/')
  )

  for (const file of mediaFiles) {
    await uploadMedia(file, (progress) => {
      console.log(`${file.name}: ${progress}%`)
    })
  }
}

return (
  <div
    onDrop={handleDrop}
    onDragOver={(e) => e.preventDefault()}
    className="border-2 border-dashed p-8"
  >
    Drop files here
  </div>
)
```

---

## Best Practices

### 1. Always Handle Loading States

```typescript
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await apiCall()
  } catch (err) {
    // Handle error
  } finally {
    setLoading(false)  // Always reset loading
  }
}
```

### 2. Show User-Friendly Error Messages

```typescript
const [error, setError] = useState<string | null>(null)

try {
  await apiCall()
} catch (err: any) {
  // Don't show technical errors to users
  const userMessage = err.response?.data?.message || 'Something went wrong. Please try again.'
  setError(userMessage)
}
```

### 3. Implement Optimistic Updates

```typescript
// Update UI immediately, revert if API fails
const handleDeleteVideo = async (videoId: string) => {
  // Optimistic update
  setVideos((prev) => prev.filter((v) => v.id !== videoId))

  try {
    await deleteVideo(videoId)
    // Success - no need to update UI again
  } catch (err) {
    // Revert on error
    fetchVideos() // Re-fetch to restore state
    alert('Failed to delete video')
  }
}
```

### 4. Debounce Search Queries

```typescript
import { useState, useEffect } from 'react'
import { searchTrends } from '@/lib/api'

const [searchQuery, setSearchQuery] = useState('')
const [results, setResults] = useState([])

// Debounce search
useEffect(() => {
  if (!searchQuery) return

  const timer = setTimeout(async () => {
    const data = await searchTrends(searchQuery)
    setResults(data)
  }, 500) // Wait 500ms after user stops typing

  return () => clearTimeout(timer)
}, [searchQuery])
```

### 5. Cache Data When Appropriate

Consider using React Query for automatic caching:

```bash
npm install @tanstack/react-query
```

```typescript
// lib/hooks/useScripts.ts
import { useQuery } from '@tanstack/react-query'
import { listScripts } from '@/lib/api'

export function useScripts() {
  return useQuery({
    queryKey: ['scripts'],
    queryFn: () => listScripts(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// In component
const { data: scripts, isLoading, error } = useScripts()
```

### 6. Handle Token Expiration Gracefully

The API client automatically refreshes tokens, but you should handle logout:

```typescript
import { useAuth } from '@clerk/nextjs'

const { signOut } = useAuth()

// When token refresh fails
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If refresh fails, log out
      await signOut()
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  }
)
```

### 7. Validate User Input Before API Calls

```typescript
const handleGenerateScript = async () => {
  // Client-side validation
  if (!topic || topic.length < 3) {
    setError('Topic must be at least 3 characters')
    return
  }

  if (duration < 15 || duration > 180) {
    setError('Duration must be between 15 and 180 seconds')
    return
  }

  // Make API call
  try {
    await generateScript({ topic, duration })
  } catch (err) {
    // Handle API error
  }
}
```

### 8. Use TypeScript Interfaces

```typescript
// Always import types
import type { Script, Video, Voice } from '@/lib/api'

// Type your state
const [script, setScript] = useState<Script | null>(null)
const [videos, setVideos] = useState<Video[]>([])

// Type your function parameters
const handleSelectVoice = (voice: Voice) => {
  console.log('Selected voice:', voice.name)
}
```

### 9. Implement Retry Logic for Failed Requests

```typescript
const retryRequest = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}

// Usage
const data = await retryRequest(() => generateVideo(params))
```

### 10. Monitor API Performance

```typescript
// Add performance tracking
const startTime = Date.now()

try {
  await generateScript({ topic: 'AI' })
  const duration = Date.now() - startTime
  console.log(`Script generation took ${duration}ms`)

  // Send to analytics
  // analytics.track('script_generated', { duration })
} catch (err) {
  const duration = Date.now() - startTime
  console.error(`Failed after ${duration}ms`, err)
}
```

---

## Summary

### Key Files

- **`lib/api-client.ts`** - Core API client with interceptors
- **`lib/api/*.ts`** - Service layer (6 services)
- **`lib/api/index.ts`** - Central export
- **`hooks/useVideoProgress.ts`** - WebSocket hook

### Import Pattern

```typescript
import { generateScript, listVideos, getTrends } from '@/lib/api'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import type { Script, Video, Trend } from '@/lib/api'
```

### Quick Reference

| Task | API Function | WebSocket |
|------|--------------|-----------|
| Generate script | `generateScript()` | No |
| Generate script (streaming) | `generateScriptStream()` | No |
| Generate video | `generateVideo()` | Yes (useVideoProgress) |
| Bulk videos | `generateBulkVideos()` | Yes (getBulkJobStatus polling) |
| Clone voice | `cloneVoice()` | No (progress callback) |
| Get analytics | `getAnalytics()` | No |
| Get trends | `getTrends()` | No |
| Upload media | `uploadMedia()` | No (progress callback) |

### Environment Variables Required

```bash
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Testing API Integration

```bash
# Start backend services
make docker-up

# Start frontend
cd frontend
npm run dev

# Test in browser console
const { generateScript } = await import('@/lib/api')
const result = await generateScript({ topic: 'AI in Healthcare' })
console.log(result)
```

---

## Need Help?

- **API Errors**: Check backend service logs (`docker logs <service-name>`)
- **WebSocket Issues**: Verify port 8012 is accessible
- **Authentication**: Check Clerk dashboard for user status
- **Network Errors**: Verify backend services are running (`docker ps`)

For more details, see:
- [ScriptSensei Technical Guide](../ScriptSensei_Technical_Implementation_Guide.md)
- [API Documentation](../docs/api/)
- [CLAUDE.md](../CLAUDE.md)
