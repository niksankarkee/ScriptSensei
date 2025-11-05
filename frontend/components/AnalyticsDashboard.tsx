'use client'

/**
 * Analytics Dashboard Component
 *
 * Comprehensive analytics for video performance tracking
 * Features:
 * - Overview metrics (views, engagement, watch time)
 * - Performance charts (line, bar, pie)
 * - Platform breakdown
 * - Top performing videos
 * - Geographic distribution
 * - Date range filtering
 * - Export functionality
 */

import { useState } from 'react'
import {
  Eye,
  TrendingUp,
  Clock,
  ThumbsUp,
  Share2,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Play,
  Users,
  Globe,
  BarChart3,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalViews: number
    viewsChange: number
    totalEngagement: number
    engagementChange: number
    avgWatchTime: number
    watchTimeChange: number
    totalShares: number
    sharesChange: number
  }
  platformBreakdown: {
    platform: string
    views: number
    percentage: number
    color: string
  }[]
  topVideos: {
    id: string
    title: string
    thumbnailUrl: string
    views: number
    engagement: number
    platform: string
  }[]
  viewsOverTime: {
    date: string
    views: number
  }[]
  geographicData: {
    country: string
    views: number
    percentage: number
  }[]
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
  dateRange?: string
  onDateRangeChange?: (range: string) => void
  onExport?: () => void
}

export default function AnalyticsDashboard({
  data,
  dateRange = '7d',
  onDateRangeChange,
  onExport,
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement' | 'watchTime'>(
    'views'
  )

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string
    value: string
    change: number
    icon: any
    color: string
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Track your video performance and insights</p>
            </div>

            {/* Date Range & Export */}
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => onDateRangeChange?.(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>

              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Views"
            value={formatNumber(data.overview.totalViews)}
            change={data.overview.viewsChange}
            icon={Eye}
            color="bg-blue-600"
          />
          <MetricCard
            title="Engagement Rate"
            value={`${data.overview.totalEngagement}%`}
            change={data.overview.engagementChange}
            icon={ThumbsUp}
            color="bg-green-600"
          />
          <MetricCard
            title="Avg Watch Time"
            value={formatTime(data.overview.avgWatchTime)}
            change={data.overview.watchTimeChange}
            icon={Clock}
            color="bg-purple-600"
          />
          <MetricCard
            title="Total Shares"
            value={formatNumber(data.overview.totalShares)}
            change={data.overview.sharesChange}
            icon={Share2}
            color="bg-pink-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Views Over Time */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Views Over Time</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMetric('views')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMetric === 'views'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Views
                </button>
                <button
                  onClick={() => setSelectedMetric('engagement')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMetric === 'engagement'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Engagement
                </button>
                <button
                  onClick={() => setSelectedMetric('watchTime')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMetric === 'watchTime'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Watch Time
                </button>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            <div className="h-64">
              <div className="flex items-end justify-between h-full gap-2">
                {data.viewsOverTime.map((item, index) => {
                  const maxViews = Math.max(...data.viewsOverTime.map((v) => v.views))
                  const height = (item.views / maxViews) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatNumber(item.views)} views
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{item.date}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Breakdown</h3>

            {/* Simple Pie Chart Representation */}
            <div className="space-y-4 mb-6">
              {data.platformBreakdown.map((platform, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{platform.platform}</span>
                    <span className="text-sm text-gray-600">{platform.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${platform.color} transition-all duration-500`}
                      style={{ width: `${platform.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatNumber(platform.views)} views
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Videos and Geographic Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Videos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Videos</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {data.topVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>

                  <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(video.views)}
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {video.engagement}%
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">{video.platform}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {data.geographicData.map((country, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    </div>
                    <span className="text-sm text-gray-600">{country.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">
                      {formatNumber(country.views)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights & Recommendations</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  • Your videos perform best on {data.platformBreakdown[0]?.platform} with{' '}
                  {data.platformBreakdown[0]?.percentage}% of total views
                </p>
                <p className="text-sm text-gray-700">
                  • Average engagement rate of {data.overview.totalEngagement}% is{' '}
                  {data.overview.engagementChange >= 0 ? 'above' : 'below'} platform average
                </p>
                <p className="text-sm text-gray-700">
                  • {data.geographicData[0]?.country} represents your largest audience at{' '}
                  {data.geographicData[0]?.percentage}% of views
                </p>
                <p className="text-sm text-gray-700">
                  • Consider creating more content for {data.platformBreakdown[0]?.platform} to maximize reach
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
