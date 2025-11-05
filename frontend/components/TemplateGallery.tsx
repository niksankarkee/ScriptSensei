'use client'

/**
 * Template Gallery Component
 *
 * Browse and select pre-made video templates
 * Features:
 * - Template categories (Business, Education, Social Media, etc.)
 * - Template preview with thumbnails
 * - Filter by platform, duration, style
 * - Search templates
 * - Template details modal
 * - "Use Template" action
 */

import { useState } from 'react'
import {
  Search,
  Filter,
  Play,
  Clock,
  Star,
  TrendingUp,
  Sparkles,
  Eye,
  CheckCircle,
  X,
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'all'
  duration: number
  thumbnailUrl: string
  previewVideoUrl: string
  features: string[]
  isPremium: boolean
  usageCount: number
  rating: number
  style: string
}

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void
  onClose?: () => void
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Sparkles },
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'marketing', name: 'Marketing', icon: '📢' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'tutorial', name: 'Tutorial', icon: '🎓' },
]

const PLATFORMS = [
  { id: 'all', name: 'All Platforms' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
]

// Mock templates data
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Product Launch',
    description: 'Professional product showcase with dynamic transitions',
    category: 'business',
    platform: 'all',
    duration: 30,
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    previewVideoUrl: 'https://example.com/preview1.mp4',
    features: ['Dynamic Text', 'Logo Placement', 'Music Background', 'CTA Button'],
    isPremium: false,
    usageCount: 1234,
    rating: 4.8,
    style: 'Professional',
  },
  {
    id: '2',
    name: 'TikTok Trend',
    description: 'Viral TikTok-style video with trending effects',
    category: 'social',
    platform: 'tiktok',
    duration: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7',
    previewVideoUrl: 'https://example.com/preview2.mp4',
    features: ['Trending Music', 'Text Effects', 'Transitions', 'Hashtags'],
    isPremium: true,
    usageCount: 5678,
    rating: 4.9,
    style: 'Trendy',
  },
  {
    id: '3',
    name: 'Tutorial Explainer',
    description: 'Step-by-step tutorial template with annotations',
    category: 'education',
    platform: 'youtube',
    duration: 60,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    previewVideoUrl: 'https://example.com/preview3.mp4',
    features: ['Step Numbers', 'Annotations', 'Voiceover', 'Chapters'],
    isPremium: false,
    usageCount: 892,
    rating: 4.7,
    style: 'Educational',
  },
  // Add more mock templates...
]

export default function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter templates
  const filteredTemplates = MOCK_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesPlatform =
      selectedPlatform === 'all' ||
      template.platform === selectedPlatform ||
      template.platform === 'all'
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesPlatform && matchesSearch
  })

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate?.(template)
    onClose?.()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Template Gallery</h1>
              <p className="text-gray-600 mt-1">
                Choose from {MOCK_TEMPLATES.length}+ professional templates
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              />
            </div>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white"
            >
              {PLATFORMS.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>

            {/* Filter Toggle */}
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
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => {
              const Icon = typeof category.icon === 'string' ? null : category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="text-base">{String(category.icon)}</span>
                  )}
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-white/90 rounded-full">
                      <Play className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>

                  {/* Premium Badge */}
                  {template.isPremium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                      PRO
                    </div>
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.duration}s
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {template.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {template.usageCount.toLocaleString()}
                    </div>
                  </div>

                  {/* Use Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseTemplate(template)
                    }}
                    className="w-full px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative">
              <img
                src={selectedTemplate.thumbnailUrl}
                alt={selectedTemplate.name}
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {selectedTemplate.isPremium && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded">
                  PRO
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-700">
                    {selectedTemplate.rating}
                  </span>
                </div>
              </div>

              {/* Template Details */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTemplate.duration}s
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Style</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedTemplate.style}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Platform</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedTemplate.platform}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Used by <strong>{selectedTemplate.usageCount.toLocaleString()}</strong> creators
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white text-base font-medium rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
