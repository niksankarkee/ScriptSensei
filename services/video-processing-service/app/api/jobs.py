"""
Job API Endpoints

RESTful API for managing video generation jobs.
Supports async job creation, status polling, and job management.
"""

import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.video import VideoRequest
from app.models.job import VideoJob, JobStatus
from app.services.job_service import JobService, JobServiceError
from app.tasks.video_tasks import generate_video_async, cancel_job


# Initialize router
router = APIRouter(
    prefix="/api/v1/jobs",
    tags=["jobs"]
)

# Initialize job service
def get_job_service() -> JobService:
    """Get JobService instance"""
    return JobService(
        redis_host=os.getenv("REDIS_HOST", "localhost"),
        redis_port=int(os.getenv("REDIS_PORT", "6379")),
        redis_db=int(os.getenv("REDIS_DB", "0")),
        redis_password=os.getenv("REDIS_PASSWORD", None)
    )


# Request/Response models
class CreateJobRequest(BaseModel):
    """Request to create a new video generation job"""
    video_request: VideoRequest
    priority: int = Field(default=5, ge=1, le=10, description="Job priority (1=highest, 10=lowest)")


class CreateJobResponse(BaseModel):
    """Response after creating a job"""
    job_id: str
    status: str
    message: str
    estimated_duration: Optional[int] = None  # Estimated duration in seconds


class JobStatusResponse(BaseModel):
    """Job status response"""
    job_id: str
    status: str
    progress: float
    progress_message: str
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retry_count: int
    duration: Optional[int] = None


class JobListResponse(BaseModel):
    """List of jobs response"""
    jobs: List[JobStatusResponse]
    total: int
    page: int
    page_size: int


# API Endpoints

@router.post("/", response_model=CreateJobResponse, status_code=202)
async def create_video_job(request: CreateJobRequest):
    """
    Create a new video generation job (async)

    **Flow:**
    1. Creates job in Redis with PENDING status
    2. Queues Celery task for background processing
    3. Returns immediately with job_id
    4. Client polls GET /jobs/{job_id} for status

    **Priority Levels:**
    - 1-3: High priority queue (premium users)
    - 4-7: Default priority queue
    - 8-10: Low priority queue (free tier)

    Returns:
        202 Accepted with job_id for status polling
    """
    try:
        job_service = get_job_service()

        # Create job in Redis
        job = job_service.create_job(
            user_id=request.video_request.user_id,
            script_id=request.video_request.script_id,
            priority=request.priority
        )

        # Queue Celery task for async processing
        task = generate_video_async.apply_async(
            kwargs={
                "job_id": job.job_id,
                "video_request": request.video_request.model_dump()
            },
            priority=request.priority
        )

        # Estimate duration based on video length
        estimated_duration = request.video_request.duration * 2  # Rough estimate

        return CreateJobResponse(
            job_id=job.job_id,
            status=job.status.value if isinstance(job.status, JobStatus) else job.status,
            message="Video generation job queued successfully",
            estimated_duration=estimated_duration
        )

    except JobServiceError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get job status and progress

    **Status Flow:**
    - PENDING: Job queued, waiting for worker
    - STARTED: Worker picked up job
    - PROCESSING: Actively generating video
    - SUCCESS: Video ready (check result field)
    - FAILURE: Generation failed (check error field)
    - CANCELLED: Job cancelled by user

    **Polling Recommendation:**
    - Poll every 2-5 seconds while status is PENDING/STARTED/PROCESSING
    - Stop polling when status is SUCCESS/FAILURE/CANCELLED

    Returns:
        Current job status with progress and results
    """
    try:
        job_service = get_job_service()
        job = job_service.get_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        return JobStatusResponse(
            job_id=job.job_id,
            status=job.status.value if isinstance(job.status, JobStatus) else job.status,
            progress=job.progress,
            progress_message=job.progress_message,
            result=job.result,
            error=job.error,
            created_at=job.created_at.isoformat(),
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            retry_count=job.retry_count,
            duration=job.duration
        )

    except JobServiceError as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.delete("/{job_id}")
async def cancel_video_job(job_id: str):
    """
    Cancel a running job

    **Note:**
    - Can only cancel jobs in PENDING, STARTED, or PROCESSING status
    - Cannot cancel COMPLETED jobs
    - Cancellation is best-effort (may complete if already processing)

    Returns:
        Cancellation status
    """
    try:
        job_service = get_job_service()
        job = job_service.get_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        if job.is_complete:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel job in {job.status.value} status"
            )

        # Cancel the job
        cancelled = cancel_job.delay(job_id).get(timeout=5)

        if cancelled:
            return {
                "job_id": job_id,
                "status": "cancelled",
                "message": "Job cancelled successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to cancel job")

    except JobServiceError as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


@router.get("/", response_model=JobListResponse)
async def list_user_jobs(
    user_id: str = Query(..., description="User ID to filter jobs"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of jobs per page")
):
    """
    List all jobs for a user

    **Pagination:**
    - page: Page number (starts at 1)
    - page_size: Number of jobs per page (max 100)

    **Sorting:**
    - Jobs are sorted by creation time (newest first)

    Returns:
        Paginated list of user's jobs
    """
    try:
        job_service = get_job_service()

        # Calculate offset
        offset = (page - 1) * page_size

        # Get user's jobs
        jobs = job_service.get_user_jobs(
            user_id=user_id,
            limit=page_size,
            offset=offset
        )

        # Convert to response format
        job_responses = [
            JobStatusResponse(
                job_id=job.job_id,
                status=job.status.value if isinstance(job.status, JobStatus) else job.status,
                progress=job.progress,
                progress_message=job.progress_message,
                result=job.result,
                error=job.error,
                created_at=job.created_at.isoformat(),
                started_at=job.started_at.isoformat() if job.started_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
                retry_count=job.retry_count,
                duration=job.duration
            )
            for job in jobs
        ]

        return JobListResponse(
            jobs=job_responses,
            total=len(job_responses),
            page=page,
            page_size=page_size
        )

    except JobServiceError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.get("/stats/counts")
async def get_job_statistics():
    """
    Get job statistics

    Returns count of jobs by status

    Returns:
        Job counts by status
    """
    try:
        job_service = get_job_service()
        stats = job_service.get_job_count_by_status()

        return {
            "statistics": stats,
            "timestamp": stats.get("timestamp", "")
        }

    except JobServiceError as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/health")
async def job_service_health():
    """
    Check job service health (Redis connection)

    Returns:
        Health status
    """
    try:
        job_service = get_job_service()
        is_healthy = job_service.health_check()

        if is_healthy:
            return {
                "status": "healthy",
                "service": "job-service",
                "message": "Redis connection OK"
            }
        else:
            raise HTTPException(status_code=503, detail="Redis connection failed")

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
