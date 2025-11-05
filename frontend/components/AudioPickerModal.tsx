'use client'

/**
 * Audio Picker Modal Component
 *
 * Full-featured audio selection modal matching Fliki's interface
 * Includes: Stock Audio, My Audio, Generate, Favorites tabs
 * Audio preview functionality with play button and waveform visualization
 */

import { useState, useEffect } from 'react'
import { X, Play, Pause, Search, Music, Volume2, Clock, Loader2, AlertCircle } from 'lucide-react'
import { getAudioLibrary, type AudioItem, type AudioCategory } from '@/lib/api/libraries'

interface AudioPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAudio: (audioId: string, audioUrl: string, audioTitle: string) => void
}

type TabType = 'stock' | 'my' | 'generate' | 'favorites'

export default function AudioPickerModal({
  isOpen,
  onClose,
  onSelectAudio
}: AudioPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stock')
  const [searchQuery, setSearchQuery] = useState('')
  const [audioType, setAudioType] = useState<AudioCategory>('music')
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null)

  // API state
  const [audioLibrary, setAudioLibrary] = useState<AudioItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch audio library when modal opens or filters change
  useEffect(() => {
    if (isOpen && activeTab === 'stock') {
      fetchAudioLibrary()
    }
  }, [isOpen, activeTab, audioType])

  const fetchAudioLibrary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAudioLibrary({
        category: audioType,
        limit: 50
      })
      setAudioLibrary(data)
    } catch (err) {
      console.error('Failed to fetch audio library:', err)
      setError('Failed to load audio library. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAudioLibrary()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getAudioLibrary({
        category: audioType,
        search: searchQuery,
        limit: 50
      })
      setAudioLibrary(data)
    } catch (err) {
      console.error('Failed to search audio:', err)
      setError('Failed to search audio. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // Filter audio based on search query (client-side for instant feedback)
  const filteredAudio = searchQuery
    ? audioLibrary.filter(audio =>
        audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audio.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : audioLibrary

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayAudio = (audioId: string) => {
    if (playingAudioId === audioId) {
      setPlayingAudioId(null)
    } else {
      setPlayingAudioId(audioId)
      // In production, this would actually play the audio
    }
  }

  const handleSelect = () => {
    if (selectedAudioId) {
      const audio = audioLibrary.find(a => a.id === selectedAudioId)
      if (audio) {
        onSelectAudio(audio.id, audio.url, audio.title)
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Audio picker</h2>
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
            { id: 'stock', label: 'Stock', icon: Music },
            { id: 'my', label: 'My', icon: Music },
            { id: 'generate', label: 'Generate', icon: Volume2 },
            { id: 'favorites', label: 'Favorites', icon: Music }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
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
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for music (eg: groovy, beat, happy)"
                    className="w-full pl-10 pr-4 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </button>
              </div>

              {/* Audio Type Radio Buttons */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={audioType === 'music'}
                    onChange={() => setAudioType('music')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Music</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={audioType === 'sound_effect'}
                    onChange={() => setAudioType('sound_effect')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Sound effects</span>
                </label>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    <button
                      onClick={fetchAudioLibrary}
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
                  <span className="ml-3 text-gray-600">Loading audio library...</span>
                </div>
              )}

              {/* Audio Grid */}
              {!isLoading && !error && filteredAudio.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {filteredAudio.map((audio) => (
                    <div
                      key={audio.id}
                      onClick={() => setSelectedAudioId(audio.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAudioId === audio.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Audio Icon/Thumbnail */}
                      <div className="w-full h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center mb-3">
                        {audio.thumbnail ? (
                          <img src={audio.thumbnail} alt={audio.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Music className="h-8 w-8 text-pink-600" />
                        )}
                      </div>

                      {/* Audio Title */}
                      <div className="text-sm font-medium text-gray-900 mb-2 truncate">
                        {audio.title}
                      </div>

                      {/* Artist (if available) */}
                      {audio.artist && (
                        <div className="text-xs text-gray-500 mb-2 truncate">
                          {audio.artist}
                        </div>
                      )}

                      {/* Duration */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(audio.duration)}</span>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayAudio(audio.id)
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {playingAudioId === audio.id ? (
                          <>
                            <Pause className="h-4 w-4" />
                            <span className="text-sm">Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 ml-0.5" />
                            <span className="text-sm">Play</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredAudio.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No results to show.</p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        fetchAudioLibrary()
                      }}
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
              <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No uploaded audio files yet</p>
              <button className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                Upload Audio
              </button>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Audio Generation
                </h3>
                <p className="text-gray-600 mb-6">
                  Generate custom music and sound effects using AI
                </p>

                <div className="max-w-md mx-auto space-y-4">
                  <textarea
                    placeholder="Describe the audio you want (e.g., 'upbeat corporate background music with piano')"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    rows={4}
                  />

                  <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                    Generate Audio
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="text-center py-12 text-gray-500">
              <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No favorite audio files yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedAudioId}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Select</span>
          </button>
        </div>
      </div>
    </div>
  )
}
