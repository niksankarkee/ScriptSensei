'use client'

/**
 * Customization Step Component
 *
 * Final customization options with AI Media style gallery like Fliki
 * Includes: Stock Media, AI Media styles, Voiceover, AI Avatar, Brand kit
 */

import { useState } from 'react'
import { Image, Wand2, User, Mic, Loader2, Lock } from 'lucide-react'
import VoiceSelectionModal from '../VoiceSelectionModal'
import VoiceCloningModal from '../VoiceCloningModal'

interface CustomizationStepProps {
  voiceId: string
  mediaType: 'stock' | 'ai'
  useAvatar: boolean
  onChange: (data: Partial<{
    voiceId: string
    mediaType: 'stock' | 'ai'
    useAvatar: boolean
    aiMediaStyle?: string
  }>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

const AI_MEDIA_STYLES = [
  { id: 'none', name: 'None', emoji: '🚫' },
  { id: '3d-model', name: '3D model', emoji: '🎨' },
  { id: 'anime', name: 'Anime', emoji: '⭐' },
  { id: 'cinematic', name: 'Cinematic (default)', emoji: '🎬' },
  { id: 'clay', name: 'Clay', emoji: '🧱' },
  { id: 'fantasy-art', name: 'Fantasy art', emoji: '🦄' },
  { id: 'illustration', name: 'Illustration', emoji: '🖌️' },
  { id: 'watercolor', name: 'Watercolor', emoji: '🎨' },
  { id: 'line-art', name: 'Line art', emoji: '✏️' },
  { id: 'realistic', name: 'Realistic', emoji: '📸' },
  { id: 'whimsical', name: 'Whimsical', emoji: '🌈' },
  { id: 'biblical', name: 'Biblical', emoji: '📿' },
  { id: 'film-noir', name: 'Film Noir', emoji: '🎭' },
  { id: 'tiny-world', name: 'Tiny World', emoji: '🌍' },
  { id: 'technical-illustration', name: 'Technical illustration', emoji: '⚙️' },
  { id: 'dynamic', name: 'Dynamic', emoji: '⚡' },
  { id: 'custom', name: 'Custom', emoji: '🎛️' },
]

export function CustomizationStep({
  voiceId,
  mediaType,
  useAvatar,
  onChange,
  onBack,
  onSubmit,
  isSubmitting
}: CustomizationStepProps) {
  const [selectedAiStyle, setSelectedAiStyle] = useState('cinematic')
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showVoiceCloningModal, setShowVoiceCloningModal] = useState(false)
  const [selectedVoiceName, setSelectedVoiceName] = useState('Rose')
  const [selectedVoiceDetails, setSelectedVoiceDetails] = useState('English (US) - Female')

  const handleAiStyleSelect = (styleId: string) => {
    setSelectedAiStyle(styleId)
    onChange({ aiMediaStyle: styleId })
  }

  const handleVoiceSelect = (voiceId: string, voiceName: string, voiceDetails: string) => {
    setSelectedVoiceName(voiceName)
    setSelectedVoiceDetails(voiceDetails)
    onChange({ voiceId })
  }

  const handleVoiceCloned = (voiceId: string, voiceName: string) => {
    setSelectedVoiceName(voiceName)
    setSelectedVoiceDetails('Custom Cloned Voice')
    onChange({ voiceId })
    setShowVoiceCloningModal(false)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Customizations</h3>

      {/* Stock Media vs AI Media */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onChange({ mediaType: 'stock' })}
          className={`p-6 border-2 rounded-lg transition-all ${
            mediaType === 'stock'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Image className="h-8 w-8 mx-auto mb-3 text-gray-700" />
          <h4 className="font-semibold text-gray-900 mb-1">Stock Media</h4>
          <p className="text-sm text-gray-600">
            Use high-quality stock photos and videos
          </p>
        </button>

        <button
          onClick={() => onChange({ mediaType: 'ai' })}
          className={`p-6 border-2 rounded-lg transition-all ${
            mediaType === 'ai'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Wand2 className="h-8 w-8 mx-auto mb-3 text-gray-700" />
          <h4 className="font-semibold text-gray-900 mb-1">AI Media</h4>
          <p className="text-sm text-gray-600">
            Generate unique images with AI
          </p>
        </button>
      </div>

      {/* AI Media Style Gallery - Only show when AI Media is selected */}
      {mediaType === 'ai' && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-pink-600" />
            Select AI Media Style
          </h4>
          <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
            {AI_MEDIA_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleAiStyleSelect(style.id)}
                className={`p-4 border-2 rounded-lg transition-all text-left hover:shadow-md ${
                  selectedAiStyle === style.id
                    ? 'border-pink-600 bg-white shadow-lg'
                    : 'border-gray-300 bg-white hover:border-pink-300'
                }`}
              >
                <div className="text-3xl mb-2">{style.emoji}</div>
                <p className={`text-sm font-medium ${
                  selectedAiStyle === style.id ? 'text-pink-600' : 'text-gray-900'
                }`}>
                  {style.name}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            AI will generate images in the selected style for your video
          </p>
        </div>
      )}

      {/* AI Avatar */}
      <button
        onClick={() => onChange({ useAvatar: !useAvatar })}
        className={`w-full p-6 border-2 rounded-lg transition-all text-left ${
          useAvatar
            ? 'border-pink-600 bg-pink-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <User className="h-6 w-6 text-gray-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">AI Avatar</h4>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                <Lock className="h-3 w-3" />
                Premium
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Add a realistic AI-powered avatar to your video
            </p>
          </div>
        </div>
      </button>

      {/* Voiceover Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-50 rounded-lg">
            <Mic className="h-5 w-5 text-pink-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Voiceover</h4>
        </div>

        <button
          onClick={() => setShowVoiceModal(true)}
          className="w-full px-4 py-3 border-2 border-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{selectedVoiceName}</p>
              <p className="text-sm text-gray-600">{selectedVoiceDetails}</p>
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <p className="mt-3 text-sm text-gray-600">
          Select a voiceover for your video narration
        </p>

        <button
          onClick={() => setShowVoiceCloningModal(true)}
          className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Try voice cloning →
        </button>
      </div>

      {/* Brand Kit (Locked) */}
      <button
        disabled
        className="w-full p-6 border-2 border-gray-200 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed text-left"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">Brand kit</h4>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                <Lock className="h-3 w-3" />
                Premium
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Apply your brand colors, fonts, and logo
            </p>
          </div>
        </div>
      </button>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Video...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Submit
            </>
          )}
        </button>
      </div>

      {/* Voice Selection Modal */}
      <VoiceSelectionModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        selectedVoiceId={voiceId}
        onSelectVoice={handleVoiceSelect}
      />

      {/* Voice Cloning Modal */}
      <VoiceCloningModal
        isOpen={showVoiceCloningModal}
        onClose={() => setShowVoiceCloningModal(false)}
        onVoiceCloned={handleVoiceCloned}
      />
    </div>
  )
}
