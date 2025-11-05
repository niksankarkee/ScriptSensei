'use client'

/**
 * Idea Step Component (Prompt Step)
 *
 * Initial step for "Idea to Video" mode where users enter their topic/prompt
 * Includes duration slider and file upload like Fliki
 */

import { useState } from 'react'
import { Upload } from 'lucide-react'

interface IdeaStepProps {
  topic: string
  duration: number
  onChange: (data: { topic?: string; duration?: number }) => void
  onNext: () => void
}

export function IdeaStep({ topic, duration, onChange, onNext }: IdeaStepProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim()) {
      onNext()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload here
    const files = Array.from(e.dataTransfer.files)
    console.log('Files dropped:', files)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="topic" className="block text-sm font-semibold text-gray-900 mb-2">
          Prompt
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => onChange({ topic: e.target.value })}
          placeholder="Eg: Motivating video on the benefits of eating healthy diet and exercising"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {/* Duration Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-900">
            Duration: {duration} seconds
          </label>
        </div>
        <input
          type="range"
          min="15"
          max="180"
          step="15"
          value={duration}
          onChange={(e) => onChange({ duration: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>15s</span>
          <span>30s</span>
          <span>60s</span>
          <span>90s</span>
          <span>120s</span>
          <span>180s</span>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Additional resources (optional)
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-pink-500 bg-pink-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop files or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported: .pdf, .txt, .jpeg, .jpg, .png. Up to 11 files total, with a maximum size of 5MB per file.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip and create
        </button>
        <button
          type="submit"
          disabled={!topic.trim()}
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </form>
  )
}
