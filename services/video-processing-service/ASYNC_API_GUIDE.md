# Async Video Generation API - Complete Guide

## Overview

The ScriptSensei video processing service uses an **asynchronous job queue system** (Celery + Redis) to handle video generation requests. This eliminates API timeouts and enables scalable, non-blocking video processing.

### Key Benefits
- **No Timeouts**: API responds in < 100ms, video processes in background
- **Scalable**: Add workers to handle more concurrent jobs
- **Progress Tracking**: Real-time job progress via Redis
- **Automatic Retry**: Failed jobs retry up to 3 times
- **Priority Queues**: Separate queues for free/premium users

---

## Quick Start

### 1. Start the Job Queue System

```bash
# Start complete job queue (Celery worker + beat + Flower)
make job-queue-start

# Or start components individually:
make start-celery-worker  # Background video processor
make start-celery-beat    # Scheduled task runner
make start-flower         # Monitoring UI at http://localhost:5555
```

### 2. Start the Video Processing API

```bash
# Start FastAPI server
cd services/video-processing-service
source venv/bin/activate
python3 -m uvicorn app.main:socket_app --host 0.0.0.0 --port 8012 --reload
```

### 3. Submit Your First Job

```bash
curl -X POST http://localhost:8012/api/v1/jobs/ \
  -H "Content-Type: application/json" \
  -d '{
    "video_request": {
      "script_id": "test-123",
      "user_id": "user-456",
      "title": "My First Video",
      "script_content": "This is a test video script.",
      "language": "en-US",
      "platform": "youtube",
      "duration": 15,
      "voice_provider": "azure"
    },
    "priority": 5
  }'
```

**Response (< 100ms):**
```json
{
  "job_id": "a3916274-a4ce-4fc8-bef9-b76d994fe482",
  "status": "pending",
  "message": "Video generation job queued successfully",
  "estimated_duration": 30
}
```

### 4. Poll Job Status

```bash
# Check status (poll every 2-5 seconds)
curl http://localhost:8012/api/v1/jobs/a3916274-a4ce-4fc8-bef9-b76d994fe482
```

**Response (while processing):**
```json
{
  "job_id": "a3916274-a4ce-4fc8-bef9-b76d994fe482",
  "status": "processing",
  "progress": 0.60,
  "progress_message": "Generating images for scene 2/3",
  "created_at": "2025-11-04T20:11:20Z",
  "started_at": "2025-11-04T20:11:22Z",
  "retry_count": 0
}
```

**Response (completed):**
```json
{
  "job_id": "a3916274-a4ce-4fc8-bef9-b76d994fe482",
  "status": "success",
  "progress": 1.0,
  "progress_message": "Video generation completed",
  "result": {
    "video_path": "/tmp/scriptsensei/videos/a3916274-a4ce-4fc8-bef9-b76d994fe482/video.mp4",
    "thumbnail_path": "/tmp/scriptsensei/videos/a3916274-a4ce-4fc8-bef9-b76d994fe482/thumbnail.jpg",
    "duration": 15,
    "file_size": 345678,
    "resolution": "1920x1080"
  },
  "created_at": "2025-11-04T20:11:20Z",
  "started_at": "2025-11-04T20:11:22Z",
  "completed_at": "2025-11-04T20:12:15Z",
  "duration": 53,
  "retry_count": 0
}
```

---

## API Reference

### Base URL
```
http://localhost:8012/api/v1/jobs
```

### Authentication
All endpoints require JWT authentication (to be implemented). For development, no authentication is required.

---

## Endpoints

### 1. Create Job (Async)

**POST /api/v1/jobs/**

Submit a video generation job for background processing.

**Request Body:**
```json
{
  "video_request": {
    "script_id": "string",           // Required: Script identifier
    "user_id": "string",             // Required: User identifier
    "title": "string",               // Required: Video title
    "script_content": "string",      // Required: Script text
    "language": "string",            // Required: Language code (e.g., "en-US")
    "platform": "string",            // Required: Target platform (youtube, tiktok, instagram)
    "duration": 15,                  // Required: Video duration in seconds
    "voice_provider": "string",      // Required: azure, google, elevenlabs
    "voice_name": "string",          // Optional: Specific voice
    "background_music": "string",    // Optional: Music URL
    "template_id": "string"          // Optional: Template identifier
  },
  "priority": 5                      // Optional: 1-10 (1=highest, 10=lowest)
}
```

**Priority Levels:**
- `1-3`: High priority (premium users, processed first)
- `4-7`: Default priority (standard processing)
- `8-10`: Low priority (free tier, processed last)

**Response (202 Accepted):**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "message": "Video generation job queued successfully",
  "estimated_duration": 30
}
```

**Error Responses:**
```json
// 500 Internal Server Error
{
  "detail": "Failed to create job: error message"
}
```

---

### 2. Get Job Status

**GET /api/v1/jobs/{job_id}**

Retrieve current status and progress of a job.

**Path Parameters:**
- `job_id` (string): Job UUID from create response

**Response (200 OK):**
```json
{
  "job_id": "uuid",
  "status": "processing",           // pending, started, processing, success, failure, cancelled
  "progress": 0.65,                 // 0.0 - 1.0
  "progress_message": "Generating images",
  "result": null,                   // Present when status=success
  "error": null,                    // Present when status=failure
  "created_at": "2025-11-04T20:11:20Z",
  "started_at": "2025-11-04T20:11:22Z",
  "completed_at": null,             // Present when completed
  "retry_count": 0,
  "duration": null                  // Total seconds when completed
}
```

**Job Status Values:**
- `pending`: Job queued, waiting for worker
- `started`: Worker picked up job
- `processing`: Actively generating video
- `success`: Video ready (check `result` field)
- `failure`: Generation failed (check `error` field)
- `cancelled`: Job cancelled by user

**Polling Recommendation:**
- Poll every **2-5 seconds** while status is `pending`, `started`, or `processing`
- Stop polling when status is `success`, `failure`, or `cancelled`
- Use exponential backoff for long-running jobs

**Error Responses:**
```json
// 404 Not Found
{
  "detail": "Job uuid not found"
}
```

---

### 3. List User Jobs

**GET /api/v1/jobs/?user_id={user_id}&page={page}&page_size={page_size}**

List all jobs for a specific user with pagination.

**Query Parameters:**
- `user_id` (string, required): User identifier
- `page` (int, optional): Page number (default: 1)
- `page_size` (int, optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "job_id": "uuid",
      "status": "success",
      "progress": 1.0,
      "progress_message": "Completed",
      "result": {...},
      "created_at": "2025-11-04T20:11:20Z",
      "completed_at": "2025-11-04T20:12:15Z",
      "duration": 55,
      "retry_count": 0
    },
    // ... more jobs
  ],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

**Use Cases:**
- Display user's job history
- Show recent videos
- Filter by status (implement client-side)

---

### 4. Cancel Job

**DELETE /api/v1/jobs/{job_id}**

Cancel a running or pending job.

**Path Parameters:**
- `job_id` (string): Job UUID

**Response (200 OK):**
```json
{
  "job_id": "uuid",
  "status": "cancelled",
  "message": "Job cancelled successfully"
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "detail": "Job uuid not found"
}

// 400 Bad Request (already completed)
{
  "detail": "Cannot cancel job in success status"
}
```

**Notes:**
- Can only cancel jobs in `pending`, `started`, or `processing` status
- Cannot cancel completed jobs (`success`, `failure`, `cancelled`)
- Cancellation is best-effort (may complete if already processing)

---

### 5. Get Job Statistics

**GET /api/v1/jobs/stats/counts**

Get count of jobs by status (system-wide).

**Response (200 OK):**
```json
{
  "statistics": {
    "pending": 5,
    "started": 2,
    "processing": 8,
    "success": 1234,
    "failure": 12,
    "cancelled": 3,
    "total": 1264
  },
  "timestamp": "2025-11-04T20:30:00Z"
}
```

**Use Cases:**
- System monitoring
- Admin dashboards
- Queue depth tracking

---

### 6. Health Check

**GET /api/v1/jobs/health**

Check job service health (Redis connection).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "job-service",
  "message": "Redis connection OK"
}
```

**Error Responses:**
```json
// 503 Service Unavailable
{
  "detail": "Redis connection failed"
}
```

---

## Job Lifecycle

### Complete Workflow

```
1. CLIENT CREATES JOB
   POST /api/v1/jobs/
   ↓
   Response: job_id, status=pending (< 100ms)

2. JOB QUEUED IN REDIS
   Redis stores job metadata
   Celery broker queues task
   ↓

3. WORKER PICKS UP JOB
   Celery worker dequeues task
   Updates status=started
   ↓

4. VIDEO GENERATION STARTS
   Updates status=processing
   Updates progress: 0.0 → 1.0
   ↓
   Progress updates:
   - 0.10 - Analyzing script
   - 0.30 - Generating audio (scene 1/3)
   - 0.50 - Generating audio (scene 2/3)
   - 0.70 - Generating images
   - 0.90 - Compositing video
   ↓

5. JOB COMPLETES
   Updates status=success or failure
   Stores result or error
   Sets completed_at timestamp
   ↓

6. CLIENT RETRIEVES RESULT
   GET /api/v1/jobs/{job_id}
   Downloads video from result.video_path
```

### Status Transitions

```
pending → started → processing → success
                             ↘ failure
                             ↘ cancelled (via DELETE)
```

**Valid Transitions:**
- `pending` → `started` (worker picks up)
- `started` → `processing` (generation begins)
- `processing` → `success` (completed successfully)
- `processing` → `failure` (error occurred)
- `pending/started/processing` → `cancelled` (user cancels)

**Invalid Transitions:**
- `success` → any other status (final state)
- `failure` → any other status (final state, unless retrying)
- `cancelled` → any other status (final state)

---

## Client Implementation Examples

### JavaScript/TypeScript (React)

```typescript
// 1. Create job
async function createVideoJob(videoRequest: VideoRequest) {
  const response = await fetch('http://localhost:8012/api/v1/jobs/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}`, // Add when auth implemented
    },
    body: JSON.stringify({
      video_request: videoRequest,
      priority: 5
    })
  });

  const data = await response.json();
  return data.job_id;
}

// 2. Poll for completion
async function pollJobStatus(jobId: string): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8012/api/v1/jobs/${jobId}`);
        const job = await response.json();

        // Update UI with progress
        console.log(`Progress: ${(job.progress * 100).toFixed(0)}% - ${job.progress_message}`);

        if (job.status === 'success') {
          clearInterval(interval);
          resolve(job.result);
        } else if (job.status === 'failure') {
          clearInterval(interval);
          reject(new Error(job.error));
        } else if (job.status === 'cancelled') {
          clearInterval(interval);
          reject(new Error('Job cancelled'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 3000); // Poll every 3 seconds
  });
}

// 3. Complete workflow
async function generateVideo(videoRequest: VideoRequest) {
  try {
    // Create job
    const jobId = await createVideoJob(videoRequest);
    console.log('Job created:', jobId);

    // Wait for completion
    const result = await pollJobStatus(jobId);
    console.log('Video ready:', result.video_path);

    // Download video
    window.location.href = result.video_path;
  } catch (error) {
    console.error('Video generation failed:', error);
  }
}
```

### Python

```python
import requests
import time

BASE_URL = "http://localhost:8012/api/v1/jobs"

def create_video_job(video_request: dict, priority: int = 5) -> str:
    """Create video generation job"""
    response = requests.post(
        f"{BASE_URL}/",
        json={
            "video_request": video_request,
            "priority": priority
        }
    )
    response.raise_for_status()
    return response.json()["job_id"]

def poll_job_status(job_id: str, poll_interval: int = 3) -> dict:
    """Poll job until completion"""
    while True:
        response = requests.get(f"{BASE_URL}/{job_id}")
        response.raise_for_status()
        job = response.json()

        print(f"Progress: {job['progress']*100:.0f}% - {job['progress_message']}")

        if job["status"] == "success":
            return job["result"]
        elif job["status"] == "failure":
            raise Exception(f"Job failed: {job['error']}")
        elif job["status"] == "cancelled":
            raise Exception("Job cancelled")

        time.sleep(poll_interval)

def generate_video(video_request: dict) -> dict:
    """Complete video generation workflow"""
    # Create job
    job_id = create_video_job(video_request)
    print(f"Job created: {job_id}")

    # Wait for completion
    result = poll_job_status(job_id)
    print(f"Video ready: {result['video_path']}")

    return result

# Usage
if __name__ == "__main__":
    video_request = {
        "script_id": "test-123",
        "user_id": "user-456",
        "title": "Test Video",
        "script_content": "This is a test script.",
        "language": "en-US",
        "platform": "youtube",
        "duration": 15,
        "voice_provider": "azure"
    }

    result = generate_video(video_request)
    print("Done!")
```

### cURL (Bash Script)

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8012/api/v1/jobs"
POLL_INTERVAL=3

# Create job
echo "Creating job..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/" \
  -H "Content-Type: application/json" \
  -d '{
    "video_request": {
      "script_id": "test-123",
      "user_id": "user-456",
      "title": "Test Video",
      "script_content": "This is a test.",
      "language": "en-US",
      "platform": "youtube",
      "duration": 15,
      "voice_provider": "azure"
    },
    "priority": 5
  }')

JOB_ID=$(echo $RESPONSE | jq -r '.job_id')
echo "Job created: $JOB_ID"

# Poll for completion
echo "Waiting for completion..."
while true; do
  STATUS_RESPONSE=$(curl -s "${BASE_URL}/${JOB_ID}")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.progress')
  MESSAGE=$(echo $STATUS_RESPONSE | jq -r '.progress_message')

  echo "Progress: $(echo "$PROGRESS * 100" | bc)% - $MESSAGE"

  if [ "$STATUS" == "success" ]; then
    VIDEO_PATH=$(echo $STATUS_RESPONSE | jq -r '.result.video_path')
    echo "Video ready: $VIDEO_PATH"
    break
  elif [ "$STATUS" == "failure" ]; then
    ERROR=$(echo $STATUS_RESPONSE | jq -r '.error')
    echo "Job failed: $ERROR"
    exit 1
  elif [ "$STATUS" == "cancelled" ]; then
    echo "Job cancelled"
    exit 1
  fi

  sleep $POLL_INTERVAL
done
```

---

## Monitoring & Operations

### Flower Dashboard

Access real-time Celery monitoring at:
```
http://localhost:5555
```

**Features:**
- Active tasks
- Worker status
- Task success/failure rates
- Queue depths
- Execution times

### Makefile Commands

```bash
# Start job queue system
make job-queue-start

# Check worker status
make celery-status

# View statistics
make celery-stats

# View logs
make celery-logs

# Stop all Celery processes
make stop-celery

# Purge queue (⚠️ destructive)
make celery-purge
```

### Redis CLI

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# List all jobs
KEYS jobs:*

# Get job details
GET jobs:{job_id}

# List jobs by status
ZRANGE jobs:status:processing 0 -1

# Count jobs by status
ZCARD jobs:status:pending
```

---

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=  # Optional

# Database (for job metadata)
DATABASE_URL=postgresql://user:password@localhost:5433/scriptsensei_dev

# Voice Providers
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=your_region
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Celery Worker Settings
CELERY_WORKER_CONCURRENCY=8      # Number of concurrent workers
CELERY_TASK_TIME_LIMIT=1800      # 30 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT=1500 # 25 minutes soft limit
```

### Worker Configuration

Adjust worker concurrency based on available resources:

```bash
# Low resources (2 workers)
celery -A app.celery_app worker --concurrency=2

# Default (8 workers)
celery -A app.celery_app worker --concurrency=8

# High performance (16 workers)
celery -A app.celery_app worker --concurrency=16
```

---

## Error Handling

### Common Errors

#### 1. Redis Connection Failed
```
Error: Failed to connect to Redis: Connection refused
```
**Solution:**
```bash
# Start Redis
make docker-up  # Or: docker-compose up redis -d
```

#### 2. Celery Worker Not Running
```
Error: No workers found
```
**Solution:**
```bash
make start-celery-worker
```

#### 3. Job Timeout
```
Job status: failure
Error: Task exceeded time limit
```
**Solution:**
- Video too long (reduce duration)
- Increase time limits in `app/celery_app.py`
- Add more workers for better throughput

#### 4. FFmpeg Not Found
```
Error: ffmpeg: command not found
```
**Solution:**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Docker (already included in Dockerfile)
```

---

## Performance Tuning

### Optimizing Throughput

1. **Add More Workers**
   ```bash
   # Start additional worker processes
   celery -A app.celery_app worker --concurrency=16 &
   celery -A app.celery_app worker --concurrency=16 &
   ```

2. **Redis Optimization**
   ```bash
   # Increase Redis max memory
   redis-cli CONFIG SET maxmemory 4gb
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

3. **Monitor Queue Depth**
   ```bash
   # Check pending jobs
   redis-cli ZCARD jobs:status:pending

   # If > 100, add more workers
   ```

### Optimizing Latency

1. **Use Local Redis** (not remote)
2. **Enable Redis Persistence** (AOF for durability)
3. **Optimize Video Generation Pipeline** (parallel scene processing)
4. **Cache Frequently Used Assets** (voices, templates)

---

## Production Checklist

Before deploying to production:

- [ ] **Enable Authentication** (JWT verification)
- [ ] **Rate Limiting** (jobs per user per hour)
- [ ] **Cloud Storage** (S3/GCS for video storage)
- [ ] **Redis High Availability** (Redis Sentinel or Cluster)
- [ ] **Worker Auto-scaling** (Kubernetes HPA or AWS Auto Scaling)
- [ ] **Monitoring & Alerts** (Prometheus + Grafana)
- [ ] **Logging** (ELK stack or CloudWatch)
- [ ] **Error Tracking** (Sentry or Rollbar)
- [ ] **Load Testing** (ensure 100+ concurrent jobs)
- [ ] **Backup Strategy** (job metadata and videos)

---

## FAQ

### Q: How long do jobs stay in Redis?
**A:** Jobs are retained for 24 hours (configurable via `job_ttl` parameter). Completed jobs are automatically cleaned up hourly by Celery Beat.

### Q: Can I cancel a job after it's started?
**A:** Yes, use `DELETE /api/v1/jobs/{job_id}`. Cancellation is best-effort; if the video is already being composited, it may complete anyway.

### Q: What happens if a worker crashes?
**A:** Celery will automatically retry the job (up to 3 times) after a 60-second delay.

### Q: How do I prioritize premium users?
**A:** Set `priority=1-3` for premium users when creating jobs. Lower priority numbers are processed first.

### Q: Can I process multiple videos for the same user in parallel?
**A:** Yes, submit multiple jobs. Each will be queued independently and processed by available workers.

### Q: What's the maximum video duration?
**A:** Default maximum is 30 minutes (task time limit). Adjust `CELERY_TASK_TIME_LIMIT` for longer videos.

### Q: How do I scale horizontally?
**A:** Run multiple Celery workers on different machines, all connecting to the same Redis instance.

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/yourusername/scriptsensei/issues
- **Documentation**: See `WEEK4_CELERY_IMPLEMENTATION_COMPLETE.md`
- **API Docs**: http://localhost:8012/docs (Swagger UI)

---

## Changelog

### v1.0.0 (2025-11-04)
- Initial async API implementation
- Celery + Redis job queue
- Priority queues (high/default/low)
- Progress tracking
- Automatic retry logic
- Flower monitoring integration
- Complete API documentation
