"""
Video Processing Celery Tasks

Async tasks for video generation and processing.
Handles job state management, progress tracking, and error handling.
"""

import os
import traceback
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from celery import Task
from celery.exceptions import SoftTimeLimitExceeded

from app.celery_app import celery_app
from app.models.video import VideoRequest
from app.models.job import JobStatus
from app.services.job_service import JobService, JobServiceError
from app.services.video_generation_service import (
    VideoGenerationService,
    VideoGenerationError
)


# Initialize services
def get_job_service() -> JobService:
    """Get JobService instance with Redis connection"""
    return JobService(
        redis_host=os.getenv("REDIS_HOST", "localhost"),
        redis_port=int(os.getenv("REDIS_PORT", "6379")),
        redis_db=int(os.getenv("REDIS_DB", "0")),
        redis_password=os.getenv("REDIS_PASSWORD", None)
    )


class VideoGenerationTask(Task):
    """
    Custom Celery task for video generation with state management
    """

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Error handler called when task fails

        Args:
            exc: Exception that was raised
            task_id: Unique task identifier
            args: Task positional arguments
            kwargs: Task keyword arguments
            einfo: Exception info (traceback)
        """
        job_id = kwargs.get("job_id")
        if not job_id:
            return

        try:
            job_service = get_job_service()
            error_msg = str(exc)
            error_trace = str(einfo)

            # Check if job can be retried
            job = job_service.get_job(job_id)
            if job and job.can_retry():
                job.increment_retry()
                job_service.update_job(job)
                print(f"[JOB {job_id}] Retry scheduled (attempt {job.retry_count}/{job.max_retries})")
                # Retry the task
                raise self.retry(exc=exc, countdown=60)
            else:
                # Mark job as failed
                job_service.mark_failure(job_id, error_msg, error_trace)
                print(f"[JOB {job_id}] Failed: {error_msg}")

        except Exception as e:
            print(f"[JOB {job_id}] Error handling failure: {e}")

    def on_success(self, retval, task_id, args, kwargs):
        """
        Success handler called when task completes successfully

        Args:
            retval: Return value from task
            task_id: Unique task identifier
            args: Task positional arguments
            kwargs: Task keyword arguments
        """
        job_id = kwargs.get("job_id")
        if job_id:
            print(f"[JOB {job_id}] Completed successfully")


@celery_app.task(
    bind=True,
    base=VideoGenerationTask,
    name="app.tasks.video_tasks.generate_video_async",
    max_retries=3,
    default_retry_delay=60,
    soft_time_limit=1500,  # 25 minutes soft limit
    time_limit=1800  # 30 minutes hard limit
)
def generate_video_async(
    self,
    job_id: str,
    video_request: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Async task to generate video

    Args:
        self: Task instance (injected by bind=True)
        job_id: Job identifier for tracking
        video_request: Video request parameters (dict form of VideoRequest)

    Returns:
        Video generation result (paths, metadata)

    Raises:
        VideoGenerationError: If video generation fails
        SoftTimeLimitExceeded: If task exceeds time limit
    """
    job_service = None
    video_service = None

    try:
        # Initialize services
        job_service = get_job_service()
        video_service = VideoGenerationService()

        # Mark job as started
        job_service.mark_started(job_id)
        print(f"[JOB {job_id}] Started video generation")

        # Create VideoRequest from dict
        request = VideoRequest(**video_request)

        # Progress callback to update job status
        def progress_callback(progress: float, message: str):
            """Update job progress in Redis"""
            try:
                job_service.update_progress(job_id, progress, message)
                print(f"[JOB {job_id}] Progress: {int(progress*100)}% - {message}")
            except JobServiceError as e:
                print(f"[JOB {job_id}] Failed to update progress: {e}")

        # Generate video
        print(f"[JOB {job_id}] Generating video for script: {request.script_id}")
        result = video_service.generate_video(request, progress_callback)

        # Mark job as successful
        job_service.mark_success(job_id, result)
        print(f"[JOB {job_id}] Video generation completed: {result.get('video_path')}")

        return result

    except SoftTimeLimitExceeded:
        error_msg = "Video generation exceeded time limit (25 minutes)"
        print(f"[JOB {job_id}] {error_msg}")

        if job_service:
            job_service.mark_failure(job_id, error_msg)

        raise VideoGenerationError(error_msg)

    except VideoGenerationError as e:
        error_msg = f"Video generation failed: {str(e)}"
        error_trace = traceback.format_exc()
        print(f"[JOB {job_id}] {error_msg}")

        if job_service:
            job_service.mark_failure(job_id, error_msg, error_trace)

        raise

    except Exception as e:
        error_msg = f"Unexpected error during video generation: {str(e)}"
        error_trace = traceback.format_exc()
        print(f"[JOB {job_id}] {error_msg}")
        print(error_trace)

        if job_service:
            job_service.mark_failure(job_id, error_msg, error_trace)

        raise VideoGenerationError(error_msg) from e


@celery_app.task(name="app.tasks.video_tasks.cleanup_old_jobs")
def cleanup_old_jobs(age_hours: int = 24) -> Dict[str, Any]:
    """
    Periodic task to clean up old completed jobs

    Args:
        age_hours: Age in hours (jobs older than this will be deleted)

    Returns:
        Cleanup statistics
    """
    try:
        job_service = get_job_service()

        print(f"[CLEANUP] Starting cleanup of jobs older than {age_hours} hours")

        deleted_count = job_service.cleanup_old_jobs(age_hours)

        print(f"[CLEANUP] Deleted {deleted_count} old jobs")

        return {
            "deleted_count": deleted_count,
            "age_hours": age_hours,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        error_msg = f"Failed to cleanup old jobs: {str(e)}"
        print(f"[CLEANUP] {error_msg}")
        return {
            "error": error_msg,
            "deleted_count": 0,
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(name="app.tasks.video_tasks.get_job_stats")
def get_job_stats() -> Dict[str, Any]:
    """
    Get current job statistics

    Returns:
        Job statistics by status
    """
    try:
        job_service = get_job_service()

        stats = job_service.get_job_count_by_status()
        stats["timestamp"] = datetime.utcnow().isoformat()

        return stats

    except Exception as e:
        error_msg = f"Failed to get job stats: {str(e)}"
        print(f"[STATS] {error_msg}")
        return {
            "error": error_msg,
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(name="app.tasks.video_tasks.cancel_job")
def cancel_job(job_id: str) -> bool:
    """
    Cancel a running job

    Args:
        job_id: Job identifier

    Returns:
        True if cancelled, False otherwise
    """
    try:
        job_service = get_job_service()

        job = job_service.get_job(job_id)
        if not job:
            print(f"[CANCEL] Job {job_id} not found")
            return False

        if job.is_complete:
            print(f"[CANCEL] Job {job_id} already complete (status: {job.status})")
            return False

        # Mark job as cancelled
        job_service.mark_cancelled(job_id)
        print(f"[CANCEL] Job {job_id} cancelled")

        return True

    except Exception as e:
        print(f"[CANCEL] Failed to cancel job {job_id}: {e}")
        return False


# Task routing configuration
def get_queue_for_priority(priority: int) -> str:
    """
    Determine queue based on priority

    Args:
        priority: Job priority (1=highest, 10=lowest)

    Returns:
        Queue name
    """
    if priority <= 3:
        return "videos.high"
    elif priority <= 7:
        return "videos.default"
    else:
        return "videos.low"
