"""
Job Service

Manages video generation job lifecycle using Redis for persistence.
Provides CRUD operations, job state management, and progress tracking.
"""

import json
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import redis
from redis.exceptions import RedisError

from app.models.job import VideoJob, JobStatus


class JobServiceError(Exception):
    """Job service operation error"""
    pass


class JobService:
    """Service for managing video generation jobs in Redis"""

    def __init__(
        self,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        redis_db: int = 0,
        redis_password: Optional[str] = None,
        job_ttl: int = 86400  # 24 hours default TTL
    ):
        """
        Initialize job service with Redis connection

        Args:
            redis_host: Redis server host
            redis_port: Redis server port
            redis_db: Redis database number
            redis_password: Redis password (optional)
            job_ttl: Job time-to-live in seconds (default: 24 hours)
        """
        try:
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,  # Auto-decode responses to strings
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
        except RedisError as e:
            raise JobServiceError(f"Failed to connect to Redis: {e}") from e

        self.job_ttl = job_ttl

    def _get_job_key(self, job_id: str) -> str:
        """Get Redis key for job"""
        return f"job:{job_id}"

    def _get_user_jobs_key(self, user_id: str) -> str:
        """Get Redis key for user's job list"""
        return f"user:{user_id}:jobs"

    def _get_status_jobs_key(self, status) -> str:
        """Get Redis key for jobs with specific status"""
        # Handle both JobStatus enum and string values
        if isinstance(status, JobStatus):
            return f"jobs:status:{status.value}"
        else:
            return f"jobs:status:{status}"

    def create_job(
        self,
        user_id: str,
        script_id: str,
        priority: int = 5,
        max_retries: int = 3
    ) -> VideoJob:
        """
        Create a new video generation job

        Args:
            user_id: User creating the job
            script_id: Script to process
            priority: Job priority (1=highest, 10=lowest)
            max_retries: Maximum retry attempts

        Returns:
            Created VideoJob instance

        Raises:
            JobServiceError: If job creation fails
        """
        try:
            # Generate unique job ID
            job_id = str(uuid.uuid4())

            # Create job instance
            job = VideoJob(
                job_id=job_id,
                user_id=user_id,
                script_id=script_id,
                status=JobStatus.PENDING,
                priority=priority,
                max_retries=max_retries,
                created_at=datetime.utcnow()
            )

            # Store job in Redis
            job_key = self._get_job_key(job_id)
            self.redis_client.setex(
                job_key,
                self.job_ttl,
                json.dumps(job.to_dict())
            )

            # Add job to user's job list
            user_jobs_key = self._get_user_jobs_key(user_id)
            self.redis_client.zadd(
                user_jobs_key,
                {job_id: job.created_at.timestamp()}
            )
            self.redis_client.expire(user_jobs_key, self.job_ttl)

            # Add job to status-based index
            status_key = self._get_status_jobs_key(JobStatus.PENDING)
            self.redis_client.zadd(
                status_key,
                {job_id: job.created_at.timestamp()}
            )
            self.redis_client.expire(status_key, self.job_ttl)

            return job

        except RedisError as e:
            raise JobServiceError(f"Failed to create job: {e}") from e

    def get_job(self, job_id: str) -> Optional[VideoJob]:
        """
        Get job by ID

        Args:
            job_id: Job identifier

        Returns:
            VideoJob instance or None if not found
        """
        try:
            job_key = self._get_job_key(job_id)
            job_data = self.redis_client.get(job_key)

            if not job_data:
                return None

            job_dict = json.loads(job_data)
            return VideoJob.from_dict(job_dict)

        except (RedisError, json.JSONDecodeError) as e:
            raise JobServiceError(f"Failed to get job {job_id}: {e}") from e

    def update_job(self, job: VideoJob) -> None:
        """
        Update existing job

        Args:
            job: VideoJob instance to update

        Raises:
            JobServiceError: If update fails
        """
        try:
            job_key = self._get_job_key(job.job_id)

            # Update job data
            self.redis_client.setex(
                job_key,
                self.job_ttl,
                json.dumps(job.to_dict())
            )

            # Update status index if needed
            status_key = self._get_status_jobs_key(job.status)
            self.redis_client.zadd(
                status_key,
                {job.job_id: datetime.utcnow().timestamp()}
            )

        except RedisError as e:
            raise JobServiceError(f"Failed to update job {job.job_id}: {e}") from e

    def update_progress(
        self,
        job_id: str,
        progress: float,
        message: str
    ) -> Optional[VideoJob]:
        """
        Update job progress

        Args:
            job_id: Job identifier
            progress: Progress value (0.0 - 1.0)
            message: Progress message

        Returns:
            Updated VideoJob or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            return None

        job.update_progress(progress, message)
        self.update_job(job)
        return job

    def mark_started(self, job_id: str) -> Optional[VideoJob]:
        """
        Mark job as started

        Args:
            job_id: Job identifier

        Returns:
            Updated VideoJob or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            return None

        job.mark_started()
        self.update_job(job)
        return job

    def mark_success(
        self,
        job_id: str,
        result: Dict[str, Any]
    ) -> Optional[VideoJob]:
        """
        Mark job as successful

        Args:
            job_id: Job identifier
            result: Job result data (video metadata)

        Returns:
            Updated VideoJob or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            return None

        job.mark_success(result)
        self.update_job(job)
        return job

    def mark_failure(
        self,
        job_id: str,
        error: str,
        traceback: Optional[str] = None
    ) -> Optional[VideoJob]:
        """
        Mark job as failed

        Args:
            job_id: Job identifier
            error: Error message
            traceback: Full error traceback (optional)

        Returns:
            Updated VideoJob or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            return None

        job.mark_failure(error, traceback)
        self.update_job(job)
        return job

    def mark_cancelled(self, job_id: str) -> Optional[VideoJob]:
        """
        Mark job as cancelled

        Args:
            job_id: Job identifier

        Returns:
            Updated VideoJob or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            return None

        job.mark_cancelled()
        self.update_job(job)
        return job

    def delete_job(self, job_id: str) -> bool:
        """
        Delete job from Redis

        Args:
            job_id: Job identifier

        Returns:
            True if deleted, False if not found
        """
        try:
            job = self.get_job(job_id)
            if not job:
                return False

            # Remove from main storage
            job_key = self._get_job_key(job_id)
            self.redis_client.delete(job_key)

            # Remove from user's job list
            user_jobs_key = self._get_user_jobs_key(job.user_id)
            self.redis_client.zrem(user_jobs_key, job_id)

            # Remove from status index
            status_key = self._get_status_jobs_key(job.status)
            self.redis_client.zrem(status_key, job_id)

            return True

        except RedisError as e:
            raise JobServiceError(f"Failed to delete job {job_id}: {e}") from e

    def get_user_jobs(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[VideoJob]:
        """
        Get all jobs for a user

        Args:
            user_id: User identifier
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip

        Returns:
            List of VideoJob instances
        """
        try:
            user_jobs_key = self._get_user_jobs_key(user_id)

            # Get job IDs (newest first)
            job_ids = self.redis_client.zrevrange(
                user_jobs_key,
                offset,
                offset + limit - 1
            )

            # Fetch job data
            jobs = []
            for job_id in job_ids:
                job = self.get_job(job_id)
                if job:
                    jobs.append(job)

            return jobs

        except RedisError as e:
            raise JobServiceError(f"Failed to get jobs for user {user_id}: {e}") from e

    def get_jobs_by_status(
        self,
        status: JobStatus,
        limit: int = 100
    ) -> List[VideoJob]:
        """
        Get all jobs with specific status

        Args:
            status: Job status to filter by
            limit: Maximum number of jobs to return

        Returns:
            List of VideoJob instances
        """
        try:
            status_key = self._get_status_jobs_key(status)

            # Get job IDs (oldest first for PENDING to process in order)
            job_ids = self.redis_client.zrange(status_key, 0, limit - 1)

            # Fetch job data
            jobs = []
            for job_id in job_ids:
                job = self.get_job(job_id)
                if job:
                    jobs.append(job)

            return jobs

        except RedisError as e:
            raise JobServiceError(
                f"Failed to get jobs with status {status}: {e}"
            ) from e

    def cleanup_old_jobs(self, age_hours: int = 24) -> int:
        """
        Clean up jobs older than specified age

        Args:
            age_hours: Age in hours (jobs older than this will be deleted)

        Returns:
            Number of jobs deleted
        """
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=age_hours)
            deleted_count = 0

            # Scan all job keys
            for key in self.redis_client.scan_iter(match="job:*"):
                job_data = self.redis_client.get(key)
                if not job_data:
                    continue

                job_dict = json.loads(job_data)
                created_at = datetime.fromisoformat(job_dict["created_at"])

                # Delete old completed jobs
                if (
                    job_dict["status"] in ["success", "failure", "cancelled"] and
                    created_at < cutoff_time
                ):
                    job_id = job_dict["job_id"]
                    if self.delete_job(job_id):
                        deleted_count += 1

            return deleted_count

        except (RedisError, json.JSONDecodeError) as e:
            raise JobServiceError(f"Failed to cleanup old jobs: {e}") from e

    def get_job_count_by_status(self) -> Dict[str, int]:
        """
        Get count of jobs by status

        Returns:
            Dictionary with status counts
        """
        try:
            counts = {}
            for status in JobStatus:
                status_key = self._get_status_jobs_key(status)
                count = self.redis_client.zcard(status_key)
                counts[status.value] = count

            return counts

        except RedisError as e:
            raise JobServiceError(f"Failed to get job counts: {e}") from e

    def health_check(self) -> bool:
        """
        Check Redis connection health

        Returns:
            True if healthy, False otherwise
        """
        try:
            return self.redis_client.ping()
        except RedisError:
            return False
