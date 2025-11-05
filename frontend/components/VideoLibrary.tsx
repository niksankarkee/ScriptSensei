'use client'

/**
 * Video Library Component
 *
 * Main dashboard for viewing and managing created videos
 * Features:
 * - Grid view of video cards
 * - Search and filtering
 * - Sort by date, views, duration
 * - Quick actions (play, edit, download, delete)
 * - Pagination
 */

import { useState } from 'react'
import {
  Search,
  Filter,
  SortDesc,
  Plus,
  Grid3x3,
  List,
  Clock,
  Eye,
  Calendar,
  Video,
} from 'lucide-react'
import VideoCard from './VideoCard'

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

interface VideoLibraryProps {
  videos: Video[]
  onCreateNew?: () => void
  onVideoClick?: (video: Video) => void
  onVideoEdit?: (videoId: string) => void
  onVideoDelete?: (videoId: string) => void
  onVideoDownload?: (videoId: string) => void
}

type ViewMode = 'grid' | 'list'
type SortBy = 'date' | 'views' | 'duration' | 'title'
type FilterStatus = 'all' | 'completed' | 'processing' | 'failed'

export default function VideoLibrary({
  videos,
  onCreateNew,
  onVideoClick,
  onVideoEdit,
  onVideoDelete,
  onVideoDownload,
}: VideoLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter videos based on search and status
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || video.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'views':
        return b.views - a.views
      case 'duration':
        return b.duration - a.duration
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
              <p className="text-gray-600 mt-1">
                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Create New Video
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="views">Sort by Views</option>
                <option value="duration">Sort by Duration</option>
                <option value="title">Sort by Title</option>
              </select>
              <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar (Expandable) */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {(['all', 'completed', 'processing', 'failed'] as FilterStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            filterStatus === status
                              ? 'bg-pink-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Videos</p>
                <p className="text-lg font-semibold text-gray-900">{videos.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-lg font-semibold text-gray-900">
                  {videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.floor(videos.reduce((sum, v) => sum + v.duration, 0) / 60)} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Calendar className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-lg font-semibold text-gray-900">
                  {
                    videos.filter((v) => {
                      const videoDate = new Date(v.createdAt)
                      const now = new Date()
                      return (
                        videoDate.getMonth() === now.getMonth() &&
                        videoDate.getFullYear() === now.getFullYear()
                      )
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedVideos.length === 0 ? (
          <div className="text-center py-16">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create your first video to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Your First Video
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {sortedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                viewMode={viewMode}
                onPlay={() => onVideoClick?.(video)}
                onEdit={() => onVideoEdit?.(video.id)}
                onDownload={() => onVideoDownload?.(video.id)}
                onDelete={() => onVideoDelete?.(video.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
