/**
 * Voice Service API
 */

import { apiClient, uploadFile } from '../api-client'

export interface Voice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
  age: 'child' | 'young' | 'middle' | 'old'
  style: 'professional' | 'casual' | 'character' | 'narrative'
  provider: 'elevenlabs' | 'azure' | 'google' | 'amazon'
  preview_url: string
  is_premium: boolean
  is_custom: boolean
}

export const listVoices = async (params?: {
  language?: string
  gender?: string
  style?: string
}): Promise<Voice[]> => {
  const response = await apiClient.get('/api/v1/voices', { params })
  return response.data
}

export const getVoice = async (id: string): Promise<Voice> => {
  const response = await apiClient.get(`/api/v1/voices/${id}`)
  return response.data
}

export const cloneVoice = async (
  name: string,
  audioFile: File,
  onProgress?: (progress: number) => void
): Promise<Voice> => {
  const response = await uploadFile('/api/v1/voices/clone', audioFile, onProgress)
  return response.data
}

export const generateVoicePreview = async (
  voiceId: string,
  text: string
): Promise<{ audio_url: string }> => {
  const response = await apiClient.post(`/api/v1/voices/${voiceId}/preview`, { text })
  return response.data
}
