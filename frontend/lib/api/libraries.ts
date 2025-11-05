/**
 * Libraries API Client
 *
 * Client for interacting with the Audio, Voice, Avatar, and Media library APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'

// =============================================================================
// Audio Library Types
// =============================================================================

export type AudioCategory = 'music' | 'sound_effect'

export interface AudioItem {
  id: string
  title: string
  category: AudioCategory
  duration: number
  url: string
  thumbnail: string
  artist: string
  tags: string[]
}

export interface AudioLibraryResponse {
  success: boolean
  data: AudioItem[]
  total: number
}

// =============================================================================
// Voice Library Types
// =============================================================================

export type VoiceGender = 'male' | 'female' | 'neutral'
export type VoiceStyle = 'neutral' | 'friendly' | 'professional' | 'energetic' | 'calm'

export interface VoiceItem {
  id: string
  name: string
  language_code: string
  language_name: string
  gender: VoiceGender
  style: VoiceStyle
  preview_url: string
  provider: string
  description?: string
  tags: string[]
}

export interface VoiceLibraryResponse {
  success: boolean
  data: VoiceItem[]
  total: number
}

// =============================================================================
// Avatar Library Types
// =============================================================================

export interface AvatarItem {
  id: string
  name: string
  gender: string
  age_range: string
  style: string
  thumbnail: string
  preview_video: string
  video_url?: string
  description?: string
  tags: string[]
}

export interface AvatarLibraryResponse {
  success: boolean
  data: AvatarItem[]
  total: number
}

// =============================================================================
// Media Library Types
// =============================================================================

export type MediaType = 'image' | 'video'

export interface MediaItem {
  id: string
  title: string
  type: MediaType
  url: string
  thumbnail: string
  duration?: number
  resolution: string
  aspect_ratio: string
  width?: number
  height?: number
  source: string
  tags: string[]
}

export interface MediaLibraryResponse {
  success: boolean
  data: MediaItem[]
  total: number
}

// =============================================================================
// Library Options Types
// =============================================================================

export interface LibraryOptions {
  audio_categories: string[]
  voice_genders: string[]
  voice_styles: string[]
  media_types: string[]
}

export interface LibraryOptionsResponse {
  success: boolean
  data: LibraryOptions
}

// =============================================================================
// Audio Library APIs
// =============================================================================

/**
 * Get audio library catalog
 */
export async function getAudioLibrary(filters?: {
  category?: AudioCategory
  search?: string
  limit?: number
}): Promise<AudioItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/api/v1/audio/library${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    const data: AudioLibraryResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch audio library')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching audio library:', error)
    throw error
  }
}

/**
 * Get single audio item by ID
 */
export async function getAudioItem(audioId: string): Promise<AudioItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/audio/${audioId}`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.detail || 'Failed to fetch audio item')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching audio item:', error)
    throw error
  }
}

// =============================================================================
// Voice Library APIs
// =============================================================================

/**
 * Get voice library catalog
 */
export async function getVoiceLibrary(filters?: {
  language?: string
  gender?: VoiceGender
  style?: VoiceStyle
  search?: string
  limit?: number
}): Promise<VoiceItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.language) params.append('language', filters.language)
    if (filters?.gender) params.append('gender', filters.gender)
    if (filters?.style) params.append('style', filters.style)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/api/v1/voices/library${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    const data: VoiceLibraryResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch voice library')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching voice library:', error)
    throw error
  }
}

/**
 * Get single voice item by ID
 */
export async function getVoiceItem(voiceId: string): Promise<VoiceItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/voices/${voiceId}`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.detail || 'Failed to fetch voice item')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching voice item:', error)
    throw error
  }
}

// =============================================================================
// Avatar Library APIs
// =============================================================================

/**
 * Get avatar library catalog
 */
export async function getAvatarLibrary(filters?: {
  gender?: string
  search?: string
  limit?: number
}): Promise<AvatarItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.gender) params.append('gender', filters.gender)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/api/v1/avatars/library${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    const data: AvatarLibraryResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch avatar library')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching avatar library:', error)
    throw error
  }
}

/**
 * Get single avatar item by ID
 */
export async function getAvatarItem(avatarId: string): Promise<AvatarItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/avatars/${avatarId}`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.detail || 'Failed to fetch avatar item')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching avatar item:', error)
    throw error
  }
}

// =============================================================================
// Media Library APIs
// =============================================================================

/**
 * Get media library catalog
 */
export async function getMediaLibrary(filters?: {
  type?: MediaType
  source?: string
  search?: string
  limit?: number
}): Promise<MediaItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/api/v1/media/library${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    const data: MediaLibraryResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch media library')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching media library:', error)
    throw error
  }
}

/**
 * Get single media item by ID
 */
export async function getMediaItem(mediaId: string): Promise<MediaItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/media/${mediaId}`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.detail || 'Failed to fetch media item')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching media item:', error)
    throw error
  }
}

// =============================================================================
// Library Options API
// =============================================================================

/**
 * Get all available filter options for libraries
 */
export async function getLibraryOptions(): Promise<LibraryOptions> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/libraries/options`)
    const data: LibraryOptionsResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch library options')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching library options:', error)
    throw error
  }
}
