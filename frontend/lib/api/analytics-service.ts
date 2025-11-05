/**
 * Analytics Service API
 */

import { apiClient } from '../api-client'

export interface AnalyticsOverview {
  total_views: number
  views_change: number
  total_engagement: number
  engagement_change: number
  avg_watch_time: number
  watch_time_change: number
  total_shares: number
  shares_change: number
}

export interface PlatformStats {
  platform: string
  views: number
  percentage: number
}

export interface TopVideo {
  id: string
  title: string
  thumbnail_url: string
  views: number
  engagement: number
  platform: string
}

export interface ViewsData {
  date: string
  views: number
}

export interface GeographicData {
  country: string
  views: number
  percentage: number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  platform_breakdown: PlatformStats[]
  top_videos: TopVideo[]
  views_over_time: ViewsData[]
  geographic_data: GeographicData[]
}

export const getAnalytics = async (dateRange?: string): Promise<AnalyticsData> => {
  const response = await apiClient.get('/api/v1/analytics/overview', {
    params: { date_range: dateRange },
  })
  return response.data
}

export const getVideoAnalytics = async (videoId: string): Promise<{
  views: number
  engagement: number
  watch_time: number
  shares: number
  views_over_time: ViewsData[]
}> => {
  const response = await apiClient.get(`/api/v1/analytics/videos/${videoId}`)
  return response.data
}

export const exportAnalytics = async (format: 'csv' | 'pdf' = 'csv'): Promise<Blob> => {
  const response = await apiClient.get('/api/v1/analytics/export', {
    params: { format },
    responseType: 'blob',
  })
  return response.data
}
