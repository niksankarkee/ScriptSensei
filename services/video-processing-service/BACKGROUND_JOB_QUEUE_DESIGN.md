# Background Job Queue - Architecture Design

## Overview

Implement asynchronous video processing using **Celery** with **Redis** as the message broker. This allows the API to return immediately while videos are generated in the background, improving user experience and enabling horizontal scaling.

---

## Current vs Target Architecture

### Current (Synchronous)
```
Client → API Endpoint → VideoGenerationService.generate_video()
          ↓ (blocks for 30-90s)
        Returns video result
```

**Problems**:
- ❌ API blocks for 30-90 seconds
- ❌ Client connection timeouts
- ❌ No scalability (1 request = 1 thread blocked)
- ❌ No retry mechanism
- ❌ No progress tracking after initial request

### Target (Asynchronous with Celery)
```
Client → API Endpoint → Create Job → Return job_id (immediate)
                           ↓
                   Celery Worker Pool
                           ↓
              VideoGenerationService.generate_video()
                           ↓
                   Update job status in Redis
                           ↓
              Client polls: GET /jobs/{job_id}
```

**Benefits**:
- ✅ API returns immediately (<100ms)
- ✅ No client timeouts
- ✅ Horizontal scaling (add more workers)
- ✅ Automatic retry on failure
- ✅ Progress tracking via Redis
- ✅ Job history and monitoring

---

## Architecture Components

### 1. Celery Configuration

**Technology**: Celery 5.x with Redis backend

**Components**:
- **Broker**: Redis (message queue)
- **Backend**: Redis (result storage)
- **Workers**: Python processes running VideoGenerationService
- **Beat**: Scheduled tasks (future: cleanup old jobs)

### 2. Job States

```python
class JobStatus(str, Enum):
    PENDING = "pending"      # Job created, waiting for worker
    STARTED = "started"      # Worker picked up job
    PROCESSING = "processing"  # Video generation in progress
    SUCCESS = "success"      # Video generated successfully
    FAILURE = "failure"      # Video generation failed
    CANCELLED = "cancelled"  # User cancelled job
```

### 3. Job Data Model

```python
class VideoJob(BaseModel):
    job_id: str              # UUID
    user_id: str             # User who created job
    script_id: str           # Script being processed
    status: JobStatus        # Current job status
    progress: float          # 0.0 - 1.0
    progress_message: str    # "Generating audio for scene 2/5"
    result: Optional[dict]   # Video metadata (on success)
    error: Optional[str]     # Error message (on failure)
    created_at: datetime     # Job creation time
    started_at: Optional[datetime]   # When worker started
    completed_at: Optional[datetime] # When job finished
    retry_count: int         # Number of retries
```

### 4. Redis Data Structure

```
# Job metadata
jobs:{job_id}:metadata → JSON (VideoJob)

# Job progress
jobs:{job_id}:progress → float (0.0-1.0)
jobs:{job_id}:progress_message → string

# Job result
jobs:{job_id}:result → JSON (video metadata)

# Job expiry: 24 hours for completed jobs
```

---

## API Endpoints

### POST /api/v1/videos/generate (Async)

**Request**:
```json
{
  "script_id": "script-123",
  "script_content": "Video script text...",
  "language": "en-US",
  "platform": "youtube",
  "voice_provider": "azure"
}
```

**Response** (immediate):
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Video generation job created",
  "estimated_time": "45 seconds"
}
```

### GET /api/v1/jobs/{job_id}

**Response** (while processing):
```json
{
  "job_id": "550e8400-...",
  "status": "processing",
  "progress": 0.65,
  "progress_message": "Rendering video segments...",
  "created_at": "2025-11-04T10:30:00Z",
  "started_at": "2025-11-04T10:30:02Z"
}
```

**Response** (completed):
```json
{
  "job_id": "550e8400-...",
  "status": "success",
  "progress": 1.0,
  "progress_message": "Video generation complete!",
  "result": {
    "video_id": "video-456",
    "video_url": "https://cdn.scriptsensei.com/videos/video-456.mp4",
    "thumbnail_url": "https://cdn.scriptsensei.com/thumbnails/video-456.jpg",
    "duration": 45.2,
    "size_bytes": 5242880
  },
  "created_at": "2025-11-04T10:30:00Z",
  "started_at": "2025-11-04T10:30:02Z",
  "completed_at": "2025-11-04T10:30:47Z"
}
```

### GET /api/v1/jobs (List user jobs)

**Query Parameters**:
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "jobs": [
    {
      "job_id": "550e8400-...",
      "status": "success",
      "created_at": "2025-11-04T10:30:00Z",
      "completed_at": "2025-11-04T10:30:47Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

### DELETE /api/v1/jobs/{job_id} (Cancel job)

**Response**:
```json
{
  "job_id": "550e8400-...",
  "status": "cancelled",
  "message": "Job cancelled successfully"
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Day 1)
1. ✅ Install Celery and dependencies
2. ✅ Create Celery app configuration
3. ✅ Implement Redis job storage
4. ✅ Create VideoJob model
5. ✅ Write basic task: `generate_video_task()`

### Phase 2: API Integration (Day 2)
6. ✅ Create async video generation endpoint
7. ✅ Implement job status endpoint
8. ✅ Add progress tracking callback
9. ✅ Update Redis with progress
10. ✅ Test end-to-end flow

### Phase 3: Monitoring & Management (Day 3)
11. ✅ Job listing endpoint
12. ✅ Job cancellation
13. ✅ Job cleanup (expire old jobs)
14. ✅ Worker monitoring
15. ✅ Error handling & retry logic

### Phase 4: Testing & Documentation (Day 4)
16. ✅ Unit tests for task functions
17. ✅ Integration tests for job flow
18. ✅ Worker deployment guide
19. ✅ Monitoring dashboard (future)

---

## File Structure

```
services/video-processing-service/
├── app/
│   ├── celery_app.py          # Celery configuration
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── video_tasks.py     # Video generation task
│   ├── models/
│   │   └── job.py             # VideoJob model
│   ├── services/
│   │   └── job_service.py     # Job CRUD operations
│   └── api/
│       └── jobs.py            # Job API endpoints
├── worker.py                   # Celery worker entry point
├── tests/
│   ├── test_tasks.py
│   └── test_job_service.py
└── docker-compose.yml         # Add Celery worker service
```

---

## Celery Configuration

### celery_app.py

```python
from celery import Celery
import os

# Create Celery app
celery_app = Celery(
    'video_processing',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task settings
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max
    task_soft_time_limit=540,  # 9 minutes soft limit

    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=86400,  # 24 hours
    result_backend_transport_options={
        'master_name': 'mymaster'
    }
)

# Auto-discover tasks
celery_app.autodiscover_tasks(['app.tasks'])
```

### Worker Configuration

```bash
# Start worker
celery -A app.celery_app worker --loglevel=info --concurrency=4

# Start with autoscale (min 2, max 10 workers)
celery -A app.celery_app worker --autoscale=10,2 --loglevel=info

# Start with specific queues
celery -A app.celery_app worker -Q video_generation,default --loglevel=info
```

---

## Task Implementation

### video_tasks.py

```python
from celery import Task
from app.celery_app import celery_app
from app.services.video_generation_service import VideoGenerationService
from app.services.job_service import JobService
from app.models.video import VideoRequest
from app.models.job import JobStatus
import logging

logger = logging.getLogger(__name__)

class VideoGenerationTask(Task):
    """Base task for video generation with error handling"""

    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3, 'countdown': 60}
    retry_backoff = True
    retry_backoff_max = 300
    retry_jitter = True

@celery_app.task(base=VideoGenerationTask, bind=True, name='tasks.generate_video')
def generate_video_task(self, job_id: str, video_request_dict: dict):
    """
    Generate video asynchronously

    Args:
        self: Task instance (injected by Celery)
        job_id: Unique job identifier
        video_request_dict: VideoRequest as dict
    """
    job_service = JobService()

    try:
        # Update job status to STARTED
        job_service.update_job_status(job_id, JobStatus.STARTED)

        # Convert dict to VideoRequest
        video_request = VideoRequest(**video_request_dict)

        # Create progress callback
        def progress_callback(progress: float, message: str):
            job_service.update_job_progress(job_id, progress, message)
            # Update Celery task state for monitoring
            self.update_state(
                state='PROGRESS',
                meta={'progress': progress, 'message': message}
            )

        # Generate video
        service = VideoGenerationService()
        result = service.generate_video(video_request, progress_callback)

        # Update job with result
        job_service.complete_job(job_id, result)

        return result

    except Exception as e:
        logger.error(f"Video generation failed for job {job_id}: {e}", exc_info=True)

        # Update job status to FAILURE
        job_service.fail_job(job_id, str(e))

        # Re-raise for Celery retry mechanism
        raise
```

---

## Job Service

### job_service.py

```python
from typing import Optional, Dict, List
import redis
import json
from datetime import datetime, timedelta
from app.models.job import VideoJob, JobStatus
import uuid

class JobService:
    """Service for managing video generation jobs"""

    def __init__(self):
        self.redis = redis.from_url(
            os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
            decode_responses=True
        )
        self.job_ttl = 86400  # 24 hours

    def create_job(self, user_id: str, script_id: str, video_request: dict) -> str:
        """Create new video generation job"""
        job_id = str(uuid.uuid4())

        job = VideoJob(
            job_id=job_id,
            user_id=user_id,
            script_id=script_id,
            status=JobStatus.PENDING,
            progress=0.0,
            progress_message="Job created",
            created_at=datetime.utcnow()
        )

        # Store in Redis
        self._save_job(job)

        return job_id

    def get_job(self, job_id: str) -> Optional[VideoJob]:
        """Get job by ID"""
        job_data = self.redis.get(f"jobs:{job_id}:metadata")
        if not job_data:
            return None

        return VideoJob(**json.loads(job_data))

    def update_job_progress(self, job_id: str, progress: float, message: str):
        """Update job progress"""
        job = self.get_job(job_id)
        if not job:
            return

        job.progress = progress
        job.progress_message = message
        job.status = JobStatus.PROCESSING

        if not job.started_at:
            job.started_at = datetime.utcnow()

        self._save_job(job)

    def complete_job(self, job_id: str, result: dict):
        """Mark job as completed"""
        job = self.get_job(job_id)
        if not job:
            return

        job.status = JobStatus.SUCCESS
        job.progress = 1.0
        job.progress_message = "Video generation complete!"
        job.result = result
        job.completed_at = datetime.utcnow()

        self._save_job(job)

    def fail_job(self, job_id: str, error: str):
        """Mark job as failed"""
        job = self.get_job(job_id)
        if not job:
            return

        job.status = JobStatus.FAILURE
        job.error = error
        job.completed_at = datetime.utcnow()
        job.retry_count += 1

        self._save_job(job)

    def _save_job(self, job: VideoJob):
        """Save job to Redis"""
        self.redis.setex(
            f"jobs:{job.job_id}:metadata",
            self.job_ttl,
            job.model_dump_json()
        )
```

---

## Dependencies

### requirements.txt additions

```
# Background Job Queue
celery==5.3.4
redis==5.0.1  # Already present
flower==2.0.1  # Celery monitoring (optional)
```

---

## Docker Compose Integration

### docker-compose.yml

```yaml
services:
  # ... existing services ...

  # Celery Worker
  video-worker:
    build:
      context: ./services/video-processing-service
      dockerfile: Dockerfile
    command: celery -A app.celery_app worker --loglevel=info --concurrency=4
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://...
      - AZURE_SPEECH_KEY=${AZURE_SPEECH_KEY}
      - AZURE_SPEECH_REGION=${AZURE_SPEECH_REGION}
      - UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}
      - PEXELS_API_KEY=${PEXELS_API_KEY}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./services/video-processing-service:/app
      - video_cache:/tmp/scriptsensei
    networks:
      - scriptsensei-network

  # Flower (Celery Monitoring) - Optional
  flower:
    build:
      context: ./services/video-processing-service
      dockerfile: Dockerfile
    command: celery -A app.celery_app flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    networks:
      - scriptsensei-network

volumes:
  video_cache:
```

---

## Monitoring & Observability

### Celery Flower

Access at: `http://localhost:5555`

**Features**:
- Real-time worker monitoring
- Task progress tracking
- Task history
- Worker statistics
- Task rate graphs

### Redis Monitoring

```bash
# Monitor Redis commands
redis-cli monitor

# Check job count
redis-cli KEYS "jobs:*:metadata" | wc -l

# Get job details
redis-cli GET "jobs:{job_id}:metadata" | jq
```

### Logging

```python
# Configure logging
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# In tasks
logger.info(f"Starting video generation for job {job_id}")
logger.error(f"Video generation failed: {error}", exc_info=True)
```

---

## Scaling Strategy

### Horizontal Scaling

```bash
# Add more workers
docker-compose up --scale video-worker=5

# Or with different concurrency
celery -A app.celery_app worker --concurrency=8
```

### Queue Prioritization

```python
# High priority queue (fast videos)
@celery_app.task(queue='video_fast', priority=9)
def generate_short_video():
    pass

# Normal priority queue
@celery_app.task(queue='video_normal', priority=5)
def generate_normal_video():
    pass

# Low priority queue (bulk generation)
@celery_app.task(queue='video_bulk', priority=1)
def generate_bulk_video():
    pass
```

### Worker Specialization

```bash
# Worker for short videos (fast)
celery -A app.celery_app worker -Q video_fast --hostname=fast@%h

# Worker for normal videos
celery -A app.celery_app worker -Q video_normal --hostname=normal@%h

# Worker for bulk videos
celery -A app.celery_app worker -Q video_bulk --hostname=bulk@%h
```

---

## Performance Metrics

### Target Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **API Response Time** | <100ms | Job creation only |
| **Job Pickup Time** | <2s | Worker availability |
| **Video Generation** | 30-90s | Unchanged |
| **Job Status Query** | <50ms | Redis GET |
| **Worker Throughput** | 10-50 videos/hour | Per worker |
| **Queue Length** | <100 jobs | Healthy state |

### Monitoring Queries

```python
# Active jobs
active_jobs = celery_app.control.inspect().active()

# Reserved jobs
reserved_jobs = celery_app.control.inspect().reserved()

# Worker stats
stats = celery_app.control.inspect().stats()

# Queue length
queue_length = celery_app.control.inspect().queue_length()
```

---

## Error Handling & Retry Logic

### Automatic Retries

```python
@celery_app.task(
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 60},
    retry_backoff=True,  # Exponential backoff
    retry_backoff_max=300,  # Max 5 minutes
    retry_jitter=True  # Add randomness
)
def generate_video_task():
    pass
```

### Retry Schedule

- **Retry 1**: After 60 seconds
- **Retry 2**: After 120 seconds (2 min)
- **Retry 3**: After 240 seconds (4 min)
- **Max Retries**: 3
- **Total Time**: ~7 minutes before final failure

### Dead Letter Queue

```python
# Tasks that failed all retries
@celery_app.task
def handle_failed_job(job_id: str, error: str):
    """Handle jobs that failed all retries"""
    # Log to monitoring system
    # Notify administrators
    # Store in failure database for analysis
    pass
```

---

## Security Considerations

### Job Authorization

```python
def get_job(job_id: str, user_id: str) -> Optional[VideoJob]:
    """Get job with authorization check"""
    job = job_service.get_job(job_id)

    # Verify user owns this job
    if job and job.user_id != user_id:
        raise PermissionError("Access denied")

    return job
```

### Rate Limiting

```python
# Limit jobs per user
@rate_limit(key='user:{user_id}', rate='10/hour', block=True)
def create_video_job(user_id: str, ...):
    pass
```

---

## Next Steps After Implementation

1. **Cloud Storage Integration**
   - Upload videos to S3/CloudFlare R2
   - Update job result with CDN URLs

2. **WebSocket Progress Updates**
   - Real-time progress without polling
   - Socket.IO integration

3. **Job Scheduling**
   - Celery Beat for scheduled tasks
   - Cleanup old jobs
   - Generate analytics reports

4. **Advanced Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alert on queue backlog

---

## Summary

This background job queue system provides:

✅ **Async Processing**: API returns immediately
✅ **Scalability**: Horizontal worker scaling
✅ **Reliability**: Automatic retries and error handling
✅ **Monitoring**: Real-time job tracking
✅ **Performance**: No blocking API calls
✅ **Production-Ready**: Battle-tested Celery + Redis

**Status**: Ready for implementation
**Estimated Time**: 2-3 days
**Priority**: High (Week 4 Goal)
