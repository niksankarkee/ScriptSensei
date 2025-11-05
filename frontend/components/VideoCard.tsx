'use client'

/**
 * Video Card Component
 *
 * Individual video item display for grid and list views
 * Features:
 * - Thumbnail with play overlay
 * - Video metadata (title, duration, views, date)
 * - Status badge (processing/completed/failed)
 * - Quick action menu (edit, download, delete)
 * - Platform badge
 * - Hover animations
 */

import { useState } from 'react'
import {
  Play,
  MoreVertical,
  Edit2,
  Download,
  Trash2,
  Eye,
  Clock,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Video {
  id: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  createdAt: Date
  views: number
  status: 'completed' | 'processing' | 'failed'
  platform?: 'tiktok' | 'youtube' | 'instagram' | 'facebook'
}

interface VideoCardProps {
  video: Video
  viewMode: 'grid' | 'list'
  onPlay?: () => void
  onEdit?: () => void
  onDownload?: () => void
  onDelete?: () => void
}

export default function VideoCard({
  video,
  viewMode,
  onPlay,
  onEdit,
  onDownload,
  onDelete,
}: VideoCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return new Date(date).toLocaleDateString()
  }

  const getStatusBadge = () => {
    switch (video.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </div>
        )
      case 'processing':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </div>
        )
      case 'failed':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Failed
          </div>
        )
    }
  }

  const getPlatformBadge = () => {
    if (!video.platform) return null

    const platforms = {
      tiktok: { name: 'TikTok', color: 'bg-black text-white' },
      youtube: { name: 'YouTube', color: 'bg-red-600 text-white' },
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' },
      facebook: { name: 'Facebook', color: 'bg-blue-600 text-white' },
    }

    const platform = platforms[video.platform]
    return (
      <div className={`px-2 py-1 ${platform.color} rounded text-xs font-medium`}>
        {platform.name}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div
            className="relative w-40 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
            onClick={onPlay}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />

            {/* Play Overlay */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <div className="p-3 bg-white/90 rounded-full">
                <Play className="h-6 w-6 text-pink-600" />
              </div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs rounded">
              {formatDuration(video.duration)}
            </div>
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                  {video.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {video.views.toLocaleString()} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(video.createdAt)}
                  </div>
                </div>
              </div>

              {/* Status and Platform */}
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {getPlatformBadge()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              title="Edit video"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              title="Download video"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete video"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 cursor-pointer group" onClick={onPlay}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-4 bg-white/90 rounded-full transform transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-pink-600" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
          {formatDuration(video.duration)}
        </div>

        {/* Platform Badge */}
        {video.platform && (
          <div className="absolute top-2 left-2">
            {getPlatformBadge()}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
            {video.title}
          </h3>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      onEdit?.()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDownload?.()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {video.views >= 1000
              ? `${(video.views / 1000).toFixed(1)}K`
              : video.views}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(video.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
