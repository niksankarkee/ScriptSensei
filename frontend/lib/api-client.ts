/**
 * API Client Configuration
 *
 * Centralized API client with:
 * - Axios instance with interceptors
 * - Authentication header injection
 * - Error handling
 * - Request/response logging
 * - Retry logic
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Gateway URL (Kong proxy)
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000'

// Service-specific base URLs (for direct access if needed)
export const SERVICE_URLS = {
  content: process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL || 'http://localhost:8011',
  video: process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012',
  voice: process.env.NEXT_PUBLIC_VOICE_SERVICE_URL || 'http://localhost:8013',
  translation: process.env.NEXT_PUBLIC_TRANSLATION_SERVICE_URL || 'http://localhost:8014',
  analytics: process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:8015',
  trend: process.env.NEXT_PUBLIC_TREND_SERVICE_URL || 'http://localhost:8016',
}

// Create axios instance
const createApiClient = (baseURL: string = API_GATEWAY_URL): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config) => {
      // Get token from localStorage or session
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data)
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
      }

      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data)
      }

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        // Try to refresh token
        try {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

          if (refreshToken) {
            const response = await axios.post(`${API_GATEWAY_URL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken,
            })

            const { access_token } = response.data

            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_token', access_token)
            }

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`
            }

            return client(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      }

      // Handle network errors
      if (!error.response) {
        return Promise.reject({
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        })
      }

      // Handle other errors
      const errorData = error.response?.data as { message?: string } | undefined
      const errorMessage = errorData?.message || error.message || 'An error occurred'

      return Promise.reject({
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      })
    }
  )

  return client
}

// Default API client (uses Kong gateway)
export const apiClient = createApiClient()

// Service-specific clients (for direct access)
export const contentApi = createApiClient(SERVICE_URLS.content)
export const videoApi = createApiClient(SERVICE_URLS.video)
export const voiceApi = createApiClient(SERVICE_URLS.voice)
export const translationApi = createApiClient(SERVICE_URLS.translation)
export const analyticsApi = createApiClient(SERVICE_URLS.analytics)
export const trendApi = createApiClient(SERVICE_URLS.trend)

// Helper function for file uploads
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<AxiosResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    },
  })
}

// Helper function for streaming responses
export const streamResponse = async (
  url: string,
  data: any,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const response = await fetch(`${API_GATEWAY_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Response body is not readable')
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    const chunk = decoder.decode(value)
    onChunk(chunk)
  }
}

export default apiClient
