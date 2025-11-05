'use client'

/**
 * Trend Explorer Component
 *
 * Discover trending topics and viral content ideas
 * Features:
 * - Platform-specific trends (TikTok, YouTube, Instagram)
 * - Regional trend filtering
 * - Trending hashtags and topics
 * - Viral content analysis
 * - Trend prediction
 * - "Create from Trend" quick action
 */

import { useState } from 'react'
import {
  TrendingUp,
  Hash,
  Globe,
  Play,
  Eye,
  ThumbsUp,
  Share2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Zap,
  Calendar,
  Video,
} from 'lucide-react'

interface Trend {
  id: string
  topic: string
  hashtag?: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'twitter'
  views: number
  viewsChange: number
  engagement: number
  posts: number
  region: string
  category: string
  hotness: 'viral' | 'rising' | 'steady' | 'declining'
  predictedGrowth: number
  relatedTopics: string[]
  sampleVideoUrl?: string
}

interface TrendExplorerProps {
  onCreateFromTrend?: (trend: Trend) => void
}

const PLATFORMS = [
  { id: 'all', name: 'All Platforms', icon: Globe },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'from-black to-gray-800' },
  { id: 'youtube', name: 'YouTube', icon: Play, color: 'from-red-600 to-red-700' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-purple-600 to-pink-600' },
  { id: 'facebook', name: 'Facebook', icon: '👍', color: 'from-blue-600 to-blue-700' },
  { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-500' },
]

const REGIONS = [
  { id: 'global', name: 'Global' },
  { id: 'us', name: 'United States' },
  { id: 'jp', name: 'Japan' },
  { id: 'np', name: 'Nepal' },
  { id: 'in', name: 'India' },
  { id: 'id', name: 'Indonesia' },
  { id: 'ph', name: 'Philippines' },
]

const CATEGORIES = [
  'All Categories',
  'Entertainment',
  'Technology',
  'Business',
  'Education',
  'Lifestyle',
  'Gaming',
  'Fashion',
  'Food',
  'Travel',
  'Sports',
]

// Mock trends data
const MOCK_TRENDS: Trend[] = [
  {
    id: '1',
    topic: 'AI Video Generation',
    hashtag: '#AIVideo',
    platform: 'tiktok',
    views: 2500000,
    viewsChange: 145,
    engagement: 8.5,
    posts: 15234,
    region: 'global',
    category: 'Technology',
    hotness: 'viral',
    predictedGrowth: 89,
    relatedTopics: ['AI Tools', 'Content Creation', 'Video Editing'],
  },
  {
    id: '2',
    topic: 'Budget Travel Hacks',
    hashtag: '#BudgetTravel',
    platform: 'youtube',
    views: 1800000,
    viewsChange: 78,
    engagement: 6.2,
    posts: 8934,
    region: 'us',
    category: 'Travel',
    hotness: 'rising',
    predictedGrowth: 65,
    relatedTopics: ['Travel Tips', 'Save Money', 'Adventure'],
  },
  {
    id: '3',
    topic: 'Quick Healthy Recipes',
    hashtag: '#HealthyRecipes',
    platform: 'instagram',
    views: 3200000,
    viewsChange: 23,
    engagement: 9.1,
    posts: 25678,
    region: 'global',
    category: 'Food',
    hotness: 'steady',
    predictedGrowth: 45,
    relatedTopics: ['Meal Prep', 'Healthy Living', 'Cooking'],
  },
  // Add more mock trends...
]

export default function TrendExplorer({ onCreateFromTrend }: TrendExplorerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('global')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [timeRange, setTimeRange] = useState('24h')

  // Filter trends
  const filteredTrends = MOCK_TRENDS.filter((trend) => {
    const matchesPlatform = selectedPlatform === 'all' || trend.platform === selectedPlatform
    const matchesRegion = selectedRegion === 'global' || trend.region === selectedRegion
    const matchesCategory =
      selectedCategory === 'All Categories' || trend.category === selectedCategory

    return matchesPlatform && matchesRegion && matchesCategory
  })

  const getHotnessColor = (hotness: Trend['hotness']) => {
    switch (hotness) {
      case 'viral':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'rising':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'steady':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'declining':
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getHotnessIcon = (hotness: Trend['hotness']) => {
    switch (hotness) {
      case 'viral':
        return <Zap className="h-4 w-4" />
      case 'rising':
        return <TrendingUp className="h-4 w-4" />
      case 'steady':
        return <ArrowUp className="h-4 w-4" />
      case 'declining':
        return <ArrowDown className="h-4 w-4" />
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                Trend Explorer
              </h1>
              <p className="text-gray-600 mt-1">
                Discover viral topics and trending content ideas
              </p>
            </div>

            {/* Time Range */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4">
            {PLATFORMS.map((platform) => {
              const Icon = typeof platform.icon === 'string' ? null : platform.icon
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedPlatform === platform.id
                      ? platform.color
                        ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                        : 'bg-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span className="text-lg">{String(platform.icon)}</span>
                  )}
                  {platform.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3">
            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white"
            >
              {REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTrends.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trends found</h3>
            <p className="text-gray-600">Try selecting a different platform or region</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrends.map((trend, index) => (
              <div
                key={trend.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Trend Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{trend.topic}</h3>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${getHotnessColor(
                              trend.hotness
                            )}`}
                          >
                            {getHotnessIcon(trend.hotness)}
                            {trend.hotness.toUpperCase()}
                          </div>
                        </div>

                        {trend.hashtag && (
                          <div className="flex items-center gap-2 text-pink-600 text-sm font-medium">
                            <Hash className="h-4 w-4" />
                            {trend.hashtag}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onCreateFromTrend?.(trend)}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Create Video
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">Views</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatNumber(trend.views)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                          <ArrowUp className="h-3 w-3" />
                          {trend.viewsChange}%
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <ThumbsUp className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">Engagement</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{trend.engagement}%</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Video className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">Posts</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatNumber(trend.posts)}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">Growth</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">+{trend.predictedGrowth}%</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">Region</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {trend.region}
                        </p>
                      </div>
                    </div>

                    {/* Related Topics */}
                    <div>
                      <span className="text-xs text-gray-600 font-medium">Related Topics:</span>
                      <div className="flex items-center gap-2 mt-2">
                        {trend.relatedTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Trend Insights
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  • <strong>Hot Topic:</strong> AI Video Generation is showing explosive growth
                  (+145% in 24 hours)
                </p>
                <p className="text-sm text-gray-700">
                  • <strong>Best Time to Post:</strong> Peak engagement occurs between 6-9 PM in
                  your selected region
                </p>
                <p className="text-sm text-gray-700">
                  • <strong>Predicted Winner:</strong> Budget Travel Hacks expected to reach viral
                  status within 48 hours
                </p>
                <p className="text-sm text-gray-700">
                  • <strong>Platform Tip:</strong> TikTok content performs best with 15-30 second
                  videos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
