/**
 * Async Job API Service
 *
 * Handles communication with the async video generation job API
 * Provides methods for creating jobs, polling status, and managing job lifecycle
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'
const JOBS_API_URL = `${API_BASE_URL}/api/v1/jobs`

export type JobStatus = 'pending' | 'started' | 'processing' | 'success' | 'failure' | 'cancelled'

export interface VideoRequest {
  script_id: string
  user_id: string
  title: string
  script_content: string
  language: string
  platform: string
  duration: number
  voice_provider: 'azure' | 'google' | 'elevenlabs'
  voice_name?: string
  background_music?: string
  template_id?: string
}

export interface CreateJobRequest {
  video_request: VideoRequest
  priority?: number // 1-10 (1=highest, 10=lowest)
}

export interface CreateJobResponse {
  job_id: string
  status: JobStatus
  message: string
  estimated_duration?: number
}

export interface JobResult {
  video_path: string
  thumbnail_path: string
  duration: number
  file_size?: number
  resolution?: string
}

export interface JobStatusResponse {
  job_id: string
  status: JobStatus
  progress: number // 0.0 - 1.0
  progress_message: string
  result?: JobResult
  error?: string
  created_at: string
  started_at?: string
  completed_at?: string
  retry_count: number
  duration?: number
}

export interface JobListResponse {
  jobs: JobStatusResponse[]
  total: number
  page: number
  page_size: number
}

export interface JobStatistics {
  pending: number
  started: number
  processing: number
  success: number
  failure: number
  cancelled: number
  total: number
}

/**
 * Create a new video generation job
 */
export async function createJob(request: CreateJobRequest): Promise<CreateJobResponse> {
  const response = await fetch(`${JOBS_API_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add auth header when implemented
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create job' }))
    throw new Error(error.detail || 'Failed to create job')
  }

  return response.json()
}

/**
 * Get job status and progress
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${JOBS_API_URL}/${jobId}`, {
    headers: {
      // Add auth header when implemented
      // 'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Job not found')
    }
    const error = await response.json().catch(() => ({ detail: 'Failed to get job status' }))
    throw new Error(error.detail || 'Failed to get job status')
  }

  return response.json()
}

/**
 * Cancel a running job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const response = await fetch(`${JOBS_API_URL}/${jobId}`, {
    method: 'DELETE',
    headers: {
      // Add auth header when implemented
      // 'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to cancel job' }))
    throw new Error(error.detail || 'Failed to cancel job')
  }
}

/**
 * List all jobs for a user with pagination
 */
export async function listUserJobs(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<JobListResponse> {
  const params = new URLSearchParams({
    user_id: userId,
    page: page.toString(),
    page_size: pageSize.toString(),
  })

  const response = await fetch(`${JOBS_API_URL}/?${params}`, {
    headers: {
      // Add auth header when implemented
      // 'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to list jobs' }))
    throw new Error(error.detail || 'Failed to list jobs')
  }

  return response.json()
}

/**
 * Get job statistics
 */
export async function getJobStatistics(): Promise<{ statistics: JobStatistics; timestamp: string }> {
  const response = await fetch(`${JOBS_API_URL}/stats/counts`, {
    headers: {
      // Add auth header when implemented
      // 'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get statistics' }))
    throw new Error(error.detail || 'Failed to get statistics')
  }

  return response.json()
}

/**
 * Poll job status until completion
 * @param jobId Job ID to poll
 * @param onProgress Callback for progress updates
 * @param pollInterval Polling interval in milliseconds (default: 3000)
 * @returns Promise that resolves with the job result when complete
 */
export async function pollJobUntilComplete(
  jobId: string,
  onProgress?: (status: JobStatusResponse) => void,
  pollInterval: number = 3000
): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId)

        // Call progress callback
        if (onProgress) {
          onProgress(status)
        }

        // Check if job is complete
        if (status.status === 'success') {
          if (status.result) {
            resolve(status.result)
          } else {
            reject(new Error('Job completed but no result found'))
          }
        } else if (status.status === 'failure') {
          reject(new Error(status.error || 'Job failed'))
        } else if (status.status === 'cancelled') {
          reject(new Error('Job was cancelled'))
        } else {
          // Job still processing, poll again
          setTimeout(poll, pollInterval)
        }
      } catch (error) {
        reject(error)
      }
    }

    // Start polling
    poll()
  })
}

/**
 * Check service health
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${JOBS_API_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Format progress percentage
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`
}

/**
 * Get estimated time remaining based on progress
 */
export function getEstimatedTimeRemaining(progress: number): string {
  if (progress < 0.2) return '~2 minutes'
  if (progress < 0.5) return '~1.5 minutes'
  if (progress < 0.8) return '~1 minute'
  if (progress < 0.95) return '~30 seconds'
  return 'Almost done...'
}

/**
 * Check if job is in a final state
 */
export function isJobComplete(status: JobStatus): boolean {
  return status === 'success' || status === 'failure' || status === 'cancelled'
}

/**
 * Check if job can be cancelled
 */
export function canCancelJob(status: JobStatus): boolean {
  return status === 'pending' || status === 'started' || status === 'processing'
}
