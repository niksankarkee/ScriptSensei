'use client'

/**
 * Avatar Picker Modal Component
 *
 * Full-featured avatar selection modal matching Fliki's interface
 * Includes: Avatar grid with thumbnails, gender filters, pose variations
 */

import { useState, useEffect } from 'react'
import { X, User, Check, Loader2, AlertCircle } from 'lucide-react'
import { getAvatarLibrary, type AvatarItem } from '@/lib/api/libraries'

interface AvatarPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAvatar: (avatarId: string, avatarUrl: string, avatarName: string) => void
}

type TabType = 'stock' | 'my' | 'generate'
type GenderFilter = 'all' | 'male' | 'female'

export default function AvatarPickerModal({
  isOpen,
  onClose,
  onSelectAvatar
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stock')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [applyToAllScenes, setApplyToAllScenes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // API state
  const [avatarLibrary, setAvatarLibrary] = useState<AvatarItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch avatar library when modal opens or filters change
  useEffect(() => {
    if (isOpen && activeTab === 'stock') {
      fetchAvatarLibrary()
    }
  }, [isOpen, activeTab, genderFilter])

  const fetchAvatarLibrary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: any = { limit: 50 }
      if (genderFilter !== 'all') filters.gender = genderFilter

      const data = await getAvatarLibrary(filters)
      setAvatarLibrary(data)
    } catch (err) {
      console.error('Failed to fetch avatar library:', err)
      setError('Failed to load avatar library. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // Filter avatars based on search query (client-side)
  const filteredAvatars = searchQuery
    ? avatarLibrary.filter(avatar =>
        avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        avatar.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : avatarLibrary

  const handleSelect = () => {
    if (selectedAvatarId) {
      const avatar = avatarLibrary.find(a => a.id === selectedAvatarId)
      if (avatar) {
        onSelectAvatar(avatar.id, avatar.video_url || avatar.thumbnail, avatar.name)
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Avatar picker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-gray-200">
          {[
            { id: 'stock', label: 'Stock' },
            { id: 'my', label: 'My' },
            { id: 'generate', label: 'Generate' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'stock' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-4">
                {/* Gender Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="all">All</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search avatars..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    <button
                      onClick={fetchAvatarLibrary}
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
                  <span className="ml-3 text-gray-600">Loading avatars...</span>
                </div>
              )}

              {/* Avatar Grid */}
              {!isLoading && !error && filteredAvatars.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {filteredAvatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedAvatarId === avatar.id
                          ? 'border-pink-500 ring-2 ring-pink-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Avatar Thumbnail */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {avatar.thumbnail ? (
                          <img
                            src={avatar.thumbnail}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-16 w-16 text-gray-400" />
                        )}
                      </div>

                      {/* Selected Indicator */}
                      {selectedAvatarId === avatar.id && (
                        <div className="absolute top-2 right-2 bg-pink-600 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      {/* Avatar Info */}
                      <div className="p-3 bg-white">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {avatar.name}
                        </div>
                        {avatar.description && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {avatar.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {avatar.gender}
                          </span>
                          {avatar.tags.slice(0, 1).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-pink-50 text-pink-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredAvatars.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No avatars found.</p>
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

          {activeTab === 'my' && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No custom avatars yet</p>
              <button className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                Upload Avatar
              </button>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Avatar Generation
              </h3>
              <p className="text-gray-600 mb-6">
                Generate custom AI avatars (Coming soon)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAllScenes}
              onChange={(e) => setApplyToAllScenes(e.target.checked)}
              className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded"
            />
            <span className="text-sm text-gray-700">Apply to all scenes</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedAvatarId}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
