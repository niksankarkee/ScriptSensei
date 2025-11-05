/**
 * Video Service API
 *
 * Handles video generation, processing, and management
 */

import { apiClient } from '../api-client'

export interface Video {
  id: string
  title: string
  script_id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  thumbnail_url?: string
  video_url?: string
  duration?: number
  platform?: string
  created_at: string
  updated_at: string
  views: number
  metadata?: {
    resolution: string
    aspect_ratio: string
    file_size: number
    codec: string
  }
}

export interface GenerateVideoRequest {
  script_id: string
  title: string
  template_id?: string
  voice_id: string
  media_type: 'stock' | 'ai'
  ai_media_style?: string
  use_avatar?: boolean
  platform?: string
  duration?: number
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5'
}

export interface Scene {
  id: string
  video_id: string
  scene_number: number
  text: string
  duration: number
  thumbnail_url?: string
  media_url?: string
  media_type: 'image' | 'video' | 'ai_generated'
  voice_id?: string
  start_time: number
  end_time: number
}

// Generate video
export const generateVideo = async (data: GenerateVideoRequest): Promise<{
  job_id: string
  video_id: string
}> => {
  const response = await apiClient.post('/api/v1/videos/generate', data)
  return response.data
}

// Get video by ID
export const getVideo = async (id: string): Promise<Video> => {
  const response = await apiClient.get(`/api/v1/videos/${id}`)
  return response.data
}

// List user videos
export const listVideos = async (params?: {
  page?: number
  limit?: number
  status?: string
  platform?: string
}): Promise<{ videos: Video[]; total: number; page: number; limit: number }> => {
  const response = await apiClient.get('/api/v1/videos', { params })
  return response.data
}

// Update video
export const updateVideo = async (id: string, data: Partial<Video>): Promise<Video> => {
  const response = await apiClient.put(`/api/v1/videos/${id}`, data)
  return response.data
}

// Delete video
export const deleteVideo = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/videos/${id}`)
}

// Download video
export const downloadVideo = async (id: string): Promise<Blob> => {
  const response = await apiClient.get(`/api/v1/videos/${id}/download`, {
    responseType: 'blob',
  })
  return response.data
}

// Get video scenes
export const getVideoScenes = async (videoId: string): Promise<Scene[]> => {
  const response = await apiClient.get(`/api/v1/videos/${videoId}/scenes`)
  return response.data
}

// Update scene
export const updateScene = async (
  videoId: string,
  sceneId: string,
  data: Partial<Scene>
): Promise<Scene> => {
  const response = await apiClient.put(`/api/v1/videos/${videoId}/scenes/${sceneId}`, data)
  return response.data
}

// Delete scene
export const deleteScene = async (videoId: string, sceneId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/videos/${videoId}/scenes/${sceneId}`)
}

// Add scene
export const addScene = async (videoId: string, data: Partial<Scene>): Promise<Scene> => {
  const response = await apiClient.post(`/api/v1/videos/${videoId}/scenes`, data)
  return response.data
}

// Bulk video generation
export interface BulkVideoRequest {
  videos: GenerateVideoRequest[]
}

export const generateBulkVideos = async (data: BulkVideoRequest): Promise<{
  job_id: string
  video_ids: string[]
}> => {
  const response = await apiClient.post('/api/v1/videos/bulk', data)
  return response.data
}

// Get bulk job status
export const getBulkJobStatus = async (jobId: string): Promise<{
  job_id: string
  total: number
  completed: number
  failed: number
  processing: number
  videos: Video[]
}> => {
  const response = await apiClient.get(`/api/v1/videos/bulk/${jobId}`)
  return response.data
}
