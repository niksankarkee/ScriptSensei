/**
 * Media Service API
 */

import { apiClient, uploadFile } from '../api-client'

export interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail_url: string
  title: string
  duration?: number
  source: 'stock' | 'ai' | 'uploaded'
  category?: string
  tags?: string[]
  created_at: string
}

export const getStockMedia = async (params?: {
  category?: string
  type?: 'image' | 'video'
  query?: string
  page?: number
  limit?: number
}): Promise<{ media: MediaItem[]; total: number }> => {
  const response = await apiClient.get('/api/v1/media/stock', { params })
  return response.data
}

export const generateAIMedia = async (
  prompt: string,
  style?: string
): Promise<MediaItem> => {
  const response = await apiClient.post('/api/v1/media/ai/generate', { prompt, style })
  return response.data
}

export const uploadMedia = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<MediaItem> => {
  const response = await uploadFile('/api/v1/media/upload', file, onProgress)
  return response.data
}

export const getUserMedia = async (params?: {
  type?: 'image' | 'video'
  page?: number
  limit?: number
}): Promise<{ media: MediaItem[]; total: number }> => {
  const response = await apiClient.get('/api/v1/media/user', { params })
  return response.data
}

export const deleteMedia = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/media/${id}`)
}
