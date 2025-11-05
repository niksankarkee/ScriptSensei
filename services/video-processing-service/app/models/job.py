"""
Video Job Model

Represents background video generation jobs for async processing via Celery.
Stores job state, progress, and results in Redis.
"""

from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class JobStatus(str, Enum):
    """Video job status states"""
    PENDING = "pending"      # Job created, waiting for worker
    STARTED = "started"      # Worker picked up job
    PROCESSING = "processing"  # Actively generating video
    SUCCESS = "success"      # Video generated successfully
    FAILURE = "failure"      # Generation failed
    CANCELLED = "cancelled"  # Job cancelled by user


class VideoJob(BaseModel):
    """Video generation job model"""

    job_id: str = Field(..., description="Unique job identifier (UUID)")
    user_id: str = Field(..., description="User who created the job")
    script_id: str = Field(..., description="Script being processed")
    status: JobStatus = Field(default=JobStatus.PENDING, description="Current job status")
    progress: float = Field(default=0.0, ge=0.0, le=1.0, description="Job progress (0.0 - 1.0)")
    progress_message: str = Field(default="Job queued", description="Human-readable progress message")

    # Results and errors
    result: Optional[Dict[str, Any]] = Field(default=None, description="Video metadata on success")
    error: Optional[str] = Field(default=None, description="Error message on failure")
    error_traceback: Optional[str] = Field(default=None, description="Full error traceback for debugging")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Job creation timestamp")
    started_at: Optional[datetime] = Field(default=None, description="Job start timestamp")
    completed_at: Optional[datetime] = Field(default=None, description="Job completion timestamp")

    # Retry logic
    retry_count: int = Field(default=0, ge=0, description="Number of retries attempted")
    max_retries: int = Field(default=3, ge=0, description="Maximum retry attempts")

    # Job metadata
    priority: int = Field(default=5, ge=1, le=10, description="Job priority (1=highest, 10=lowest)")
    estimated_duration: Optional[int] = Field(default=None, description="Estimated duration in seconds")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
        use_enum_values = True

    @field_validator('progress')
    @classmethod
    def validate_progress(cls, v: float) -> float:
        """Ensure progress is between 0 and 1"""
        if not 0.0 <= v <= 1.0:
            raise ValueError("Progress must be between 0.0 and 1.0")
        return v

    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary for Redis storage"""
        return self.model_dump(mode='json')

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VideoJob":
        """Create job from dictionary (Redis retrieval)"""
        # Convert ISO datetime strings back to datetime objects
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("started_at"), str):
            data["started_at"] = datetime.fromisoformat(data["started_at"])
        if isinstance(data.get("completed_at"), str):
            data["completed_at"] = datetime.fromisoformat(data["completed_at"])

        return cls(**data)

    def update_progress(self, progress: float, message: str) -> None:
        """Update job progress"""
        self.progress = progress
        self.progress_message = message
        if self.status == JobStatus.PENDING:
            self.status = JobStatus.PROCESSING

    def mark_started(self) -> None:
        """Mark job as started"""
        self.status = JobStatus.STARTED
        self.started_at = datetime.utcnow()

    def mark_success(self, result: Dict[str, Any]) -> None:
        """Mark job as successful"""
        self.status = JobStatus.SUCCESS
        self.result = result
        self.completed_at = datetime.utcnow()
        self.progress = 1.0
        self.progress_message = "Video generation completed"

    def mark_failure(self, error: str, traceback: Optional[str] = None) -> None:
        """Mark job as failed"""
        self.status = JobStatus.FAILURE
        self.error = error
        self.error_traceback = traceback
        self.completed_at = datetime.utcnow()
        self.progress_message = f"Failed: {error}"

    def mark_cancelled(self) -> None:
        """Mark job as cancelled"""
        self.status = JobStatus.CANCELLED
        self.completed_at = datetime.utcnow()
        self.progress_message = "Job cancelled by user"

    def can_retry(self) -> bool:
        """Check if job can be retried"""
        return (
            self.status == JobStatus.FAILURE and
            self.retry_count < self.max_retries
        )

    def increment_retry(self) -> None:
        """Increment retry counter"""
        self.retry_count += 1
        self.status = JobStatus.PENDING
        self.error = None
        self.error_traceback = None
        self.progress_message = f"Retrying (attempt {self.retry_count}/{self.max_retries})"

    @property
    def is_complete(self) -> bool:
        """Check if job is in terminal state"""
        return self.status in [JobStatus.SUCCESS, JobStatus.FAILURE, JobStatus.CANCELLED]

    @property
    def is_active(self) -> bool:
        """Check if job is actively processing"""
        return self.status in [JobStatus.STARTED, JobStatus.PROCESSING]

    @property
    def duration(self) -> Optional[int]:
        """Calculate job duration in seconds"""
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds())
        return None

    def __repr__(self) -> str:
        return (
            f"VideoJob(job_id={self.job_id}, user_id={self.user_id}, "
            f"status={self.status.value}, progress={self.progress:.2f})"
        )
