/**
 * Trend Service API
 */

import { apiClient } from '../api-client'

export interface Trend {
  id: string
  topic: string
  hashtag?: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'twitter'
  views: number
  views_change: number
  engagement: number
  posts: number
  region: string
  category: string
  hotness: 'viral' | 'rising' | 'steady' | 'declining'
  predicted_growth: number
  related_topics: string[]
}

export const getTrends = async (params?: {
  platform?: string
  region?: string
  category?: string
  time_range?: string
}): Promise<Trend[]> => {
  const response = await apiClient.get('/api/v1/trends/current', { params })
  return response.data
}

export const getTrendsByPlatform = async (platform: string): Promise<Trend[]> => {
  const response = await apiClient.get(`/api/v1/trends/platform/${platform}`)
  return response.data
}

export const getTrendsByRegion = async (region: string): Promise<Trend[]> => {
  const response = await apiClient.get(`/api/v1/trends/region/${region}`)
  return response.data
}

export const predictTrend = async (topic: string): Promise<{
  topic: string
  predicted_growth: number
  confidence: number
  insights: string[]
}> => {
  const response = await apiClient.post('/api/v1/trends/predict', { topic })
  return response.data
}
