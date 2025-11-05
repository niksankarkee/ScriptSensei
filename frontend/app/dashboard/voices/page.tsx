'use client'

import { useState, useEffect } from 'react'
import { Mic, Play, Star } from 'lucide-react'

interface Voice {
  id: string
  name: string
  language: string
  gender: string
  provider: string
  is_premium: boolean
  description: string
}

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [previewMessage, setPreviewMessage] = useState<string>('')

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8012/api/v1/voices')
      const data = await response.json()
      if (data.success) {
        setVoices(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewVoice = async (voiceId: string) => {
    setPreviewingVoice(voiceId)
    setPreviewMessage('')
    try {
      const response = await fetch(
        `http://localhost:8012/api/v1/voices/preview?voice_id=${voiceId}`,
        { method: 'POST' }
      )
      const data = await response.json()

      if (data.success) {
        setPreviewMessage(data.data.note || 'Voice preview successful!')
        // In production, this would play actual audio
        // For now, show a success message
        setTimeout(() => {
          setPreviewMessage('')
          setPreviewingVoice(null)
        }, 3000)
      } else {
        setPreviewMessage('Failed to preview voice')
        setTimeout(() => setPreviewMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to preview voice:', error)
      setPreviewMessage('Failed to preview voice')
      setTimeout(() => setPreviewMessage(''), 3000)
    } finally {
      setTimeout(() => {
        setPreviewingVoice(null)
      }, 500)
    }
  }

  const languages = ['all', ...Array.from(new Set(voices.map(v => v.language)))]

  const filteredVoices = selectedLanguage === 'all'
    ? voices
    : voices.filter(v => v.language === selectedLanguage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Voice Library</h1>
        <p className="mt-2 text-gray-600">
          Choose from our collection of AI voices in multiple languages
        </p>
      </div>

      {/* Preview Message */}
      {previewMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">{previewMessage}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">
          Filter by language:
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Languages</option>
          {languages.filter(l => l !== 'all').map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVoices.map((voice) => (
          <div
            key={voice.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Voice Icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Mic className="h-6 w-6 text-indigo-600" />
              </div>
              {voice.is_premium && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                  <Star className="h-3 w-3" />
                  <span>Premium</span>
                </span>
              )}
            </div>

            {/* Voice Info */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {voice.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {voice.description}
            </p>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Language:</span>
                <span className="text-gray-900 font-medium">{voice.language}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Gender:</span>
                <span className="text-gray-900 font-medium">{voice.gender}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Provider:</span>
                <span className="text-gray-900 font-medium capitalize">{voice.provider}</span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => handlePreviewVoice(voice.id)}
              disabled={previewingVoice === voice.id}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewingVoice === voice.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Previewing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Preview Voice</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Mic className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No voices found
          </h3>
          <p className="text-gray-600">
            Try selecting a different language filter
          </p>
        </div>
      )}
    </div>
  )
}
