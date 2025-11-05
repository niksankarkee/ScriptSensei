'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  TrendingUp,
  ShoppingBag,
  BookOpen,
  Lightbulb,
  Heart,
  Briefcase,
  Gamepad2,
  Sparkles,
  Search,
  Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  platform: string
  duration: number
  tone: string
  language: string
  promptTemplate: string
  exampleOutput?: string
  tags: string[]
}

const templates: Template[] = [
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Engaging product review script with pros, cons, and verdict',
    icon: <ShoppingBag className="h-6 w-6" />,
    category: 'Review',
    platform: 'youtube',
    duration: 60,
    tone: 'professional',
    language: 'en',
    promptTemplate: 'Create a detailed product review script for {productName}. Include an attention-grabbing hook, key features, pros and cons, comparison with alternatives, and a clear verdict. Make it engaging and authentic.',
    tags: ['review', 'product', 'comparison'],
  },
  {
    id: 'educational-explainer',
    name: 'Educational Explainer',
    description: 'Clear and concise educational content that teaches a concept',
    icon: <BookOpen className="h-6 w-6" />,
    category: 'Education',
    platform: 'youtube',
    duration: 90,
    tone: 'professional',
    language: 'en',
    promptTemplate: 'Create an educational explainer script about {topic}. Start with why it matters, break down the concept into simple terms, use relatable examples, and end with key takeaways. Make it easy to understand for beginners.',
    tags: ['education', 'tutorial', 'learning'],
  },
  {
    id: 'viral-hook',
    name: 'Viral Hook Story',
    description: 'Short-form viral content with a powerful hook',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'Viral',
    platform: 'tiktok',
    duration: 30,
    tone: 'casual',
    language: 'en',
    promptTemplate: 'Create a viral short-form script about {topic}. Start with an irresistible hook in the first 3 seconds, build tension or curiosity, deliver value or entertainment, and end with a memorable punchline or call-to-action.',
    tags: ['viral', 'short-form', 'trending'],
  },
  {
    id: 'motivational-speech',
    name: 'Motivational Speech',
    description: 'Inspiring motivational content to energize viewers',
    icon: <Sparkles className="h-6 w-6" />,
    category: 'Motivation',
    platform: 'youtube',
    duration: 45,
    tone: 'inspirational',
    language: 'en',
    promptTemplate: 'Create an inspiring motivational script about {topic}. Open with a powerful statement, share relatable struggles, build up with actionable advice, and close with an empowering call-to-action that inspires viewers to take action.',
    tags: ['motivation', 'inspiration', 'self-improvement'],
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step tutorial for completing a task',
    icon: <Lightbulb className="h-6 w-6" />,
    category: 'Tutorial',
    platform: 'youtube',
    duration: 120,
    tone: 'professional',
    language: 'en',
    promptTemplate: 'Create a comprehensive how-to guide for {task}. Include an introduction explaining the benefits, list required materials or prerequisites, provide clear step-by-step instructions, add pro tips, and summarize with final thoughts.',
    tags: ['tutorial', 'how-to', 'guide'],
  },
  {
    id: 'story-time',
    name: 'Story Time',
    description: 'Engaging storytelling script with narrative arc',
    icon: <Heart className="h-6 w-6" />,
    category: 'Entertainment',
    platform: 'youtube',
    duration: 90,
    tone: 'casual',
    language: 'en',
    promptTemplate: 'Create an engaging story-time script about {storyTopic}. Start with a captivating hook, set the scene, build tension with challenges or conflicts, include emotional moments, and wrap up with a satisfying resolution and lesson learned.',
    tags: ['storytelling', 'entertainment', 'personal'],
  },
  {
    id: 'business-tip',
    name: 'Business Tip',
    description: 'Quick actionable business advice',
    icon: <Briefcase className="h-6 w-6" />,
    category: 'Business',
    platform: 'youtube_shorts',
    duration: 45,
    tone: 'professional',
    language: 'en',
    promptTemplate: 'Create a concise business tip script about {businessTopic}. Open with a bold statement or statistic, explain the tip clearly, provide a real-world example, and end with an actionable step viewers can take today.',
    tags: ['business', 'entrepreneurship', 'tips'],
  },
  {
    id: 'gaming-commentary',
    name: 'Gaming Commentary',
    description: 'Entertaining gaming content with commentary',
    icon: <Gamepad2 className="h-6 w-6" />,
    category: 'Gaming',
    platform: 'youtube',
    duration: 180,
    tone: 'casual',
    language: 'en',
    promptTemplate: 'Create a gaming commentary script for {gameName}. Include an exciting intro, gameplay highlights with reactions, funny moments or fails, strategic tips, and an engaging outro encouraging likes and subscriptions.',
    tags: ['gaming', 'commentary', 'entertainment'],
  },
]

const categories = ['All', 'Review', 'Education', 'Viral', 'Motivation', 'Tutorial', 'Entertainment', 'Business', 'Gaming']
const platforms = ['All', 'tiktok', 'youtube', 'youtube_shorts', 'instagram_reel']

export default function TemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedPlatform, setSelectedPlatform] = useState('All')

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesPlatform = selectedPlatform === 'All' || template.platform === selectedPlatform

    return matchesSearch && matchesCategory && matchesPlatform
  })

  const handleUseTemplate = (template: Template) => {
    // Store template in session storage and redirect to create page
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    router.push('/dashboard/scripts/new?template=' + template.id)
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      tiktok: 'TikTok',
      youtube: 'YouTube',
      youtube_shorts: 'YouTube Shorts',
      instagram_reel: 'Instagram Reel',
      instagram_story: 'Instagram Story',
      facebook: 'Facebook',
    }
    return names[platform] || platform
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Script Templates</h1>
        <p className="text-gray-600">
          Choose from pre-made templates to quickly generate professional scripts
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Platform Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'All' ? 'All Platforms' : getPlatformName(platform)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedCategory !== 'All' || selectedPlatform !== 'All') && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                    setSelectedPlatform('All')
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No templates found matching your criteria</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
              setSelectedPlatform('All')
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                {/* Icon and Category */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                    {template.icon}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {template.category}
                  </span>
                </div>

                {/* Template Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <span>{getPlatformName(template.platform)}</span>
                  <span>{template.duration}s</span>
                  <span className="capitalize">{template.tone}</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Templates</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Browse templates or use search and filters to find what you need</li>
          <li>Click "Use Template" on your chosen template</li>
          <li>Fill in the specific details for your content (e.g., product name, topic)</li>
          <li>Generate your customized script with AI</li>
          <li>Edit and refine the script as needed</li>
        </ol>
      </div>
    </div>
  )
}
