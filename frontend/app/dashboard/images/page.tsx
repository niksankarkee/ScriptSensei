'use client'

import { useState } from 'react'
import { Image as ImageIcon, Sparkles, Download } from 'lucide-react'

export default function ImagesPage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // TODO: Implement actual image generation API call
    setTimeout(() => {
      setError('Image generation will be implemented in the next phase')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Image Generation</h1>
        <p className="mt-2 text-gray-600">
          Generate custom images for your videos using AI
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleGenerate}>
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Image Prompt
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the image you want to generate... (e.g., 'A futuristic city at sunset with flying cars')"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sample Images Gallery - Placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Images</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No images yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate your first AI image to get started
          </p>
          <p className="text-sm text-gray-500">
            <strong>Coming soon:</strong> Integration with DALL-E, Midjourney, and Stable Diffusion
          </p>
        </div>
      </div>
    </div>
  )
}
