'use client'

/**
 * Media Library Component
 *
 * Browse and select stock media or AI-generated images
 * Features:
 * - Tab switching between Stock Media, AI Media, and Uploaded
 * - Search and type filtering
 * - Grid layout with media preview
 * - Selection mode for inserting into videos
 */

import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  Upload,
  X,
  Check,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { getMediaLibrary, type MediaItem as APIMediaItem, type MediaType } from '@/lib/api/libraries'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string
  title: string
  duration?: number
  source: 'stock' | 'ai' | 'uploaded'
  width?: number
  height?: number
  tags?: string[]
}

interface MediaLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelectMedia?: (media: MediaItem) => void
  allowMultiple?: boolean
  mediaType?: 'all' | 'image' | 'video'
}

export default function MediaLibrary({
  isOpen,
  onClose,
  onSelectMedia,
  allowMultiple = false,
  mediaType = 'all',
}: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'ai' | 'uploaded'>('stock')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API state
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch media library when modal opens or filters change
  useEffect(() => {
    if (isOpen && activeTab === 'stock') {
      fetchMediaLibrary()
    }
  }, [isOpen, activeTab, selectedType])

  useEffect(() => {
    if (!isOpen) {
      setSelectedMedia([])
      setSearchQuery('')
    }
  }, [isOpen])

  const fetchMediaLibrary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: any = { limit: 50 }
      if (selectedType !== 'all') filters.type = selectedType

      const data = await getMediaLibrary(filters)

      // Convert API data to component format
      const convertedData: MediaItem[] = data.map(item => ({
        id: item.id,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnail,
        title: item.title,
        duration: item.duration,
        source: item.source as 'stock' | 'ai' | 'uploaded',
        width: item.width,
        height: item.height,
        tags: item.tags
      }))

      setMediaLibrary(convertedData)
    } catch (err) {
      console.error('Failed to fetch media library:', err)
      setError('Failed to load media library. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMediaClick = (media: MediaItem) => {
    if (allowMultiple) {
      const isSelected = selectedMedia.find((m) => m.id === media.id)
      if (isSelected) {
        setSelectedMedia(selectedMedia.filter((m) => m.id !== media.id))
      } else {
        setSelectedMedia([...selectedMedia, media])
      }
    } else {
      setSelectedMedia([media])
      onSelectMedia?.(media)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (selectedMedia.length > 0 && onSelectMedia) {
      selectedMedia.forEach((media) => onSelectMedia(media))
      onClose()
    }
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      const newMedia: MediaItem = {
        id: `ai-${Date.now()}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        title: aiPrompt,
        source: 'ai',
        tags: ['ai-generated'],
      }
      setMediaLibrary([newMedia, ...mediaLibrary])
      setIsGenerating(false)
      setAiPrompt('')
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file)
      const newMedia: MediaItem = {
        id: `upload-${Date.now()}-${Math.random()}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url,
        thumbnailUrl: url,
        title: file.name,
        source: 'uploaded',
      }
      setUploadedMedia([newMedia, ...uploadedMedia])
    })
    setActiveTab('uploaded')
  }

  // Get the right data source based on active tab
  const getMediaSource = () => {
    if (activeTab === 'uploaded') return uploadedMedia
    if (activeTab === 'ai') return mediaLibrary.filter(item => item.source === 'ai')
    return mediaLibrary
  }

  const filteredMedia = getMediaSource().filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = mediaType === 'all' || item.type === mediaType

    return matchesSearch && matchesType
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b">
          {[
            { id: 'stock', label: 'Stock Media', icon: ImageIcon },
            { id: 'ai', label: 'AI Generate', icon: Wand2 },
            { id: 'uploaded', label: 'Uploaded', icon: Upload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stock Media Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search media..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as MediaType | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    <button
                      onClick={fetchMediaLibrary}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading media library...</span>
                </div>
              )}

              {/* Media Grid */}
              {!isLoading && !error && filteredMedia.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMediaClick(item)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia.find((m) => m.id === item.id)
                          ? 'border-pink-500 ring-2 ring-pink-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="h-12 w-12 text-white opacity-80" />
                          </div>
                        )}
                        {item.type === 'video' && item.duration && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                            {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      {selectedMedia.find((m) => m.id === item.id) && (
                        <div className="absolute top-2 right-2 bg-pink-600 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="p-2 bg-white">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.type === 'video' ? (
                            <VideoIcon className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ImageIcon className="h-3 w-3 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">{item.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredMedia.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No media found.</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-pink-600 hover:text-pink-700 text-sm underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Generate Tab */}
          {activeTab === 'ai' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generate AI Media
                </h3>
                <p className="text-gray-600 mb-6">
                  Create custom images using AI
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  rows={4}
                />
                <button
                  onClick={handleGenerateAI}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Uploaded Tab */}
          {activeTab === 'uploaded' && (
            <div className="space-y-4">
              {uploadedMedia.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No uploaded media yet</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Upload Media
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload More
                  </button>
                  <div className="grid grid-cols-4 gap-4">
                    {uploadedMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleMediaClick(item)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                          selectedMedia.find((m) => m.id === item.id)
                            ? 'border-pink-500'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-video bg-gray-100">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {selectedMedia.find((m) => m.id === item.id) && (
                          <div className="absolute top-2 right-2 bg-pink-600 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiple && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedMedia.length === 0}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Selected
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
