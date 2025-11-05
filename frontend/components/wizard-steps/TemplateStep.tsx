'use client'

/**
 * Template Step Component
 *
 * Template gallery with aspect ratio selection
 * Similar to Fliki's template selection interface
 * Now with dynamic templates that change based on aspect ratio
 */

import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'

interface TemplateStepProps {
  aspectRatio: '9:16' | '1:1' | '16:9'
  selectedTemplate?: string
  onChange: (data: { aspectRatio?: '9:16' | '1:1' | '16:9'; template?: string }) => void
  onNext: () => void
  onBack?: () => void
}

interface Template {
  id: string
  name: string
  thumbnail: string
  previewVideo?: string
  category: string
}

// Base template definitions (metadata only)
const templateMetadata = [
  { id: 'auto-layout', name: 'Dynamic Template - Auto Layout', category: 'Dynamic', unsplashId: '1501785888041-af3ef285b470' },
  { id: 'martian', name: 'Dynamic Template - The Martian', category: 'Dynamic', unsplashId: '1446776811953-b23d57bd21aa' },
  { id: 'beaches', name: 'Social Media Story - Top 3 hidden beaches', category: 'Social Media', unsplashId: '1559827260-dc66d52bef19' },
  { id: 'productivity', name: 'Social Media Story - Boost your productivity', category: 'Social Media', unsplashId: '1484480974693-6ca0a78fb36b' },
  { id: 'thailand', name: 'Travel & Tourism - Thailand travel guide', category: 'Travel', unsplashId: '1552465011-b4e21bf6e79a' },
  { id: 'fitness', name: 'Motivational Quote - Weight loss journey', category: 'Motivation', unsplashId: '1517836357463-d25dfeac3438' }
]

// Generate templates with correct aspect ratio dimensions
const getTemplatesForAspectRatio = (aspectRatio: '9:16' | '1:1' | '16:9'): Template[] => {
  // Calculate dimensions based on aspect ratio
  const baseWidth = 400
  let dimensions: { width: number; height: number }

  switch (aspectRatio) {
    case '9:16': // Portrait (TikTok, Instagram Reels, YouTube Shorts)
      dimensions = { width: baseWidth, height: Math.round(baseWidth * 16 / 9) } // 400x711
      break
    case '1:1': // Square (Instagram post)
      dimensions = { width: baseWidth, height: baseWidth } // 400x400
      break
    case '16:9': // Landscape (YouTube, horizontal)
      dimensions = { width: baseWidth, height: Math.round(baseWidth * 9 / 16) } // 400x225
      break
  }

  return templateMetadata.map((meta) => ({
    id: meta.id,
    name: meta.name,
    category: meta.category,
    thumbnail: `https://images.unsplash.com/photo-${meta.unsplashId}?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=entropy`,
  }))
}

export function TemplateStep({
  aspectRatio,
  selectedTemplate,
  onChange,
  onNext,
  onBack
}: TemplateStepProps) {
  // State to hold current templates based on aspect ratio
  const [templates, setTemplates] = useState<Template[]>(() => getTemplatesForAspectRatio(aspectRatio))

  // Update templates when aspect ratio changes
  useEffect(() => {
    const newTemplates = getTemplatesForAspectRatio(aspectRatio)
    setTemplates(newTemplates)
    console.log(`Templates updated for aspect ratio ${aspectRatio}:`, newTemplates)
  }, [aspectRatio])

  // Get dynamic aspect ratio class for template containers
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16]' // Portrait
      case '1:1':
        return 'aspect-square' // Square
      case '16:9':
        return 'aspect-video' // Landscape
      default:
        return 'aspect-video'
    }
  }

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size (aspect ratio)</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => onChange({ aspectRatio: '9:16' })}
            className={`p-4 border-2 rounded-lg transition-colors ${
              aspectRatio === '9:16'
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-14 border-2 border-current rounded" />
              <span className="text-sm font-medium">9:16 (portrait)</span>
            </div>
          </button>

          <button
            onClick={() => onChange({ aspectRatio: '1:1' })}
            className={`p-4 border-2 rounded-lg transition-colors ${
              aspectRatio === '1:1'
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-2 border-current rounded" />
              <span className="text-sm font-medium">1:1 (square)</span>
            </div>
          </button>

          <button
            onClick={() => onChange({ aspectRatio: '16:9' })}
            className={`p-4 border-2 rounded-lg transition-colors ${
              aspectRatio === '16:9'
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-8 border-2 border-current rounded" />
              <span className="text-sm font-medium">16:9 (landscape)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Template Gallery */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a template</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onChange({ template: template.id })}
              className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-pink-600 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Video Preview or Thumbnail */}
              <div className={`${getAspectClass()} bg-gray-100 relative`}>
                {template.previewVideo ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={template.thumbnail}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to thumbnail image if video fails to load
                      console.log(`Video failed to load for template ${template.id}, falling back to thumbnail`)
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const img = document.createElement('img')
                        img.src = template.thumbnail
                        img.alt = template.name
                        img.className = 'w-full h-full object-cover'
                        parent.insertBefore(img, parent.firstChild)
                      }
                    }}
                  >
                    <source src={template.previewVideo} type="video/mp4" />
                    Your browser does not support video preview
                  </video>
                ) : (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Template Info */}
              <div className="p-3 bg-white">
                <p className="text-xs text-gray-500 mb-1">{template.category}</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {template.name}
                </p>
              </div>

              {/* Selected Indicator */}
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
