'use client'

/**
 * Voice Selection Modal Component
 *
 * Full-featured voice selection modal matching Fliki's interface
 * Includes: Language/Gender/Style filters
 * Voice preview functionality with play button
 */

import { useState, useEffect } from 'react'
import { X, Play, Volume2, Loader2, AlertCircle } from 'lucide-react'
import { getVoiceLibrary, type VoiceItem, type VoiceGender, type VoiceStyle } from '@/lib/api/libraries'

interface VoiceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedVoiceId: string
  onSelectVoice: (voiceId: string, voiceName: string, voiceDetails: string) => void
}

const genders = ['All', 'female', 'male', 'neutral']
const voiceStyles = ['All', 'neutral', 'friendly', 'professional', 'energetic', 'calm']

export default function VoiceSelectionModal({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice
}: VoiceSelectionModalProps) {
  const [selectedGender, setSelectedGender] = useState('All')
  const [selectedStyle, setSelectedStyle] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [localSelectedVoice, setLocalSelectedVoice] = useState(selectedVoiceId)

  // API state
  const [voiceLibrary, setVoiceLibrary] = useState<VoiceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get unique languages from voice library
  const languages = ['All', ...Array.from(new Set(voiceLibrary.map(v => v.language_code)))]

  // Fetch voice library when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchVoiceLibrary()
    }
  }, [isOpen, selectedLanguage, selectedGender, selectedStyle])

  const fetchVoiceLibrary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: any = { limit: 100 }
      if (selectedLanguage !== 'All') filters.language = selectedLanguage
      if (selectedGender !== 'All') filters.gender = selectedGender as VoiceGender
      if (selectedStyle !== 'All') filters.style = selectedStyle as VoiceStyle

      const data = await getVoiceLibrary(filters)
      setVoiceLibrary(data)
    } catch (err) {
      console.error('Failed to fetch voice library:', err)
      setError('Failed to load voice library. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const handlePlayVoice = (voiceId: string) => {
    // In production, this would play the actual voice preview
    setPlayingVoiceId(voiceId)

    // Simulate audio playing
    setTimeout(() => {
      setPlayingVoiceId(null)
    }, 2000)
  }

  const handleSelectVoice = () => {
    const voice = voiceLibrary.find(v => v.id === localSelectedVoice)
    if (voice) {
      onSelectVoice(
        voice.id,
        voice.name,
        `${voice.language_name} - ${voice.gender}`
      )
    }
    onClose()
  }

  const getGenderIcon = (gender: string) => {
    if (gender === 'female') return '♀'
    if (gender === 'male') return '♂'
    return '⚪'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Voice selection</h3>
            <button className="mt-1 text-sm text-pink-600 hover:text-pink-700 font-medium">
              Try voice cloning →
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {genders.map(gender => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Style Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice style
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {voiceStyles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Voice List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={fetchVoiceLibrary}
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
              <span className="ml-3 text-gray-600">Loading voices...</span>
            </div>
          )}

          {/* Voice Grid */}
          {!isLoading && !error && voiceLibrary.length > 0 && (
            <div className="space-y-2">
              {voiceLibrary.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setLocalSelectedVoice(voice.id)}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                    localSelectedVoice === voice.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Voice Icon */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-lg">
                      {getGenderIcon(voice.gender)}
                    </div>

                    {/* Voice Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{voice.name}</div>
                      <div className="text-sm text-gray-500">
                        {voice.language_name} ({voice.language_code}) • {voice.gender} • {voice.style}
                      </div>
                      {voice.description && (
                        <div className="text-xs text-gray-400 mt-1">{voice.description}</div>
                      )}
                    </div>
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayVoice(voice.id)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {playingVoiceId === voice.id ? (
                      <>
                        <Volume2 className="h-4 w-4 text-pink-600" />
                        <span className="text-sm">Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 ml-0.5" />
                        <span className="text-sm">Preview</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && voiceLibrary.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No voices found with the selected filters.</p>
              <button
                onClick={() => {
                  setSelectedLanguage('All')
                  setSelectedGender('All')
                  setSelectedStyle('All')
                }}
                className="mt-4 text-pink-600 hover:text-pink-700 text-sm underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {voiceLibrary.length} voice{voiceLibrary.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectVoice}
              disabled={!localSelectedVoice}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select voice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
