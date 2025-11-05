/**
 * Content Service API
 *
 * Handles scripts, templates, and content generation
 */

import { apiClient, streamResponse } from '../api-client'

export interface Script {
  id: string
  title: string
  content: string
  user_id: string
  platform?: string
  language: string
  hook_score: number
  seo_score: number
  engagement_score: number
  overall_quality: number
  created_at: string
  updated_at: string
}

export interface GenerateScriptRequest {
  topic?: string
  idea?: string
  content?: string
  url?: string
  platform?: string
  language?: string
  tone?: string
  duration?: number
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  platform: string
  duration: number
  thumbnail_url: string
  features: string[]
  is_premium: boolean
  usage_count: number
  rating: number
}

// Generate script from idea
export const generateScript = async (data: GenerateScriptRequest): Promise<Script> => {
  const response = await apiClient.post('/api/v1/scripts/generate', data)
  // API returns { success: boolean, data: Script }
  return response.data.data || response.data
}

// Generate script with streaming
export const generateScriptStream = async (
  data: GenerateScriptRequest,
  onChunk: (chunk: string) => void
): Promise<void> => {
  await streamResponse('/api/v1/scripts/generate/stream', data, onChunk)
}

// Get script by ID
export const getScript = async (id: string): Promise<Script> => {
  const response = await apiClient.get(`/api/v1/scripts/${id}`)
  return response.data
}

// Update script
export const updateScript = async (id: string, data: Partial<Script>): Promise<Script> => {
  const response = await apiClient.put(`/api/v1/scripts/${id}`, data)
  return response.data
}

// Delete script
export const deleteScript = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/scripts/${id}`)
}

// List user scripts
export const listScripts = async (params?: {
  page?: number
  limit?: number
  platform?: string
  language?: string
}): Promise<{ scripts: Script[]; total: number; page: number; limit: number }> => {
  const response = await apiClient.get('/api/v1/scripts', { params })
  return response.data
}

// Get templates
export const getTemplates = async (params?: {
  category?: string
  platform?: string
  is_premium?: boolean
}): Promise<Template[]> => {
  const response = await apiClient.get('/api/v1/templates', { params })
  return response.data
}

// Analyze content quality
export const analyzeContent = async (content: string): Promise<{
  hook_score: number
  seo_score: number
  engagement_score: number
  overall_quality: number
  suggestions: string[]
}> => {
  const response = await apiClient.post('/api/v1/content/analyze', { content })
  return response.data
}

// Import content from URL
export const importFromUrl = async (url: string): Promise<{
  content: string
  title: string
}> => {
  const response = await apiClient.post('/api/v1/content/import/url', { url })
  return response.data
}

// Import content from file
export const importFromFile = async (file: File): Promise<{
  content: string
  title: string
}> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/v1/content/import/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
