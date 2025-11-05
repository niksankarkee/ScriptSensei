"""
Job Queue for Video Processing
Manages background video processing tasks with priority queue
"""

import asyncio
from typing import Dict, Optional, Callable
from datetime import datetime
import logging
from enum import IntEnum

logger = logging.getLogger(__name__)

# Import WebSocket functions (lazy import to avoid circular dependency)
_ws_manager = None


def get_ws_manager():
    """Lazy load WebSocket manager to avoid circular imports"""
    global _ws_manager
    if _ws_manager is None:
        from app.websocket import (
            emit_processing_started,
            emit_progress_update,
            emit_processing_completed,
            emit_processing_failed
        )
        _ws_manager = {
            'started': emit_processing_started,
            'progress': emit_progress_update,
            'completed': emit_processing_completed,
            'failed': emit_processing_failed
        }
    return _ws_manager


class JobPriority(IntEnum):
    """Job priority levels (lower number = higher priority)"""
    HIGH = 1
    NORMAL = 2
    LOW = 3


class Job:
    """Represents a video processing job"""

    def __init__(
        self,
        job_id: str,
        task_func: Callable,
        priority: JobPriority = JobPriority.NORMAL,
        **kwargs
    ):
        self.job_id = job_id
        self.task_func = task_func
        self.priority = priority
        self.kwargs = kwargs
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error: Optional[str] = None

    def __lt__(self, other):
        """Compare jobs by priority for queue ordering"""
        return self.priority < other.priority


class JobQueue:
    """
    Async job queue for video processing
    Manages concurrent workers and job execution
    """

    def __init__(self, max_workers: int = 3):
        self.max_workers = max_workers
        self.queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.active_jobs: Dict[str, Job] = {}
        self.completed_jobs: Dict[str, Job] = {}
        self.workers: list = []
        self.running = False

    async def add_job(
        self,
        job_id: str,
        task_func: Callable,
        priority: JobPriority = JobPriority.NORMAL,
        **kwargs
    ) -> Job:
        """Add a new job to the queue"""
        job = Job(job_id, task_func, priority, **kwargs)
        await self.queue.put(job)
        logger.info(f"Job {job_id} added to queue with priority {priority}")
        return job

    async def worker(self, worker_id: int):
        """Worker coroutine that processes jobs from the queue"""
        logger.info(f"Worker {worker_id} started")

        while self.running:
            try:
                # Get job from queue with timeout
                try:
                    job = await asyncio.wait_for(
                        self.queue.get(),
                        timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue

                # Mark job as active
                self.active_jobs[job.job_id] = job
                job.started_at = datetime.utcnow()

                logger.info(f"Worker {worker_id} processing job {job.job_id}")

                # Get WebSocket manager
                ws = get_ws_manager()

                try:
                    # Emit processing started event
                    await ws['started'](job.job_id, metadata={'worker_id': worker_id})

                    # Execute the job
                    await job.task_func(job.job_id, **job.kwargs)
                    job.completed_at = datetime.utcnow()
                    logger.info(f"Job {job.job_id} completed successfully")

                    # Note: completion event is emitted by the job itself with video details

                except Exception as e:
                    job.error = str(e)
                    job.completed_at = datetime.utcnow()
                    logger.error(f"Job {job.job_id} failed: {e}")

                    # Emit processing failed event
                    await ws['failed'](job.job_id, str(e))

                finally:
                    # Move job from active to completed
                    self.active_jobs.pop(job.job_id, None)
                    self.completed_jobs[job.job_id] = job
                    self.queue.task_done()

            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")

        logger.info(f"Worker {worker_id} stopped")

    async def start(self):
        """Start the job queue workers"""
        if self.running:
            logger.warning("Job queue already running")
            return

        self.running = True
        logger.info(f"Starting job queue with {self.max_workers} workers")

        # Start worker coroutines
        self.workers = [
            asyncio.create_task(self.worker(i))
            for i in range(self.max_workers)
        ]

    async def stop(self):
        """Stop the job queue workers"""
        if not self.running:
            return

        logger.info("Stopping job queue")
        self.running = False

        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers = []

        logger.info("Job queue stopped")

    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get status of a job"""
        # Check active jobs
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            return {
                "job_id": job_id,
                "status": "processing",
                "priority": job.priority,
                "created_at": job.created_at.isoformat(),
                "started_at": job.started_at.isoformat() if job.started_at else None,
            }

        # Check completed jobs
        if job_id in self.completed_jobs:
            job = self.completed_jobs[job_id]
            return {
                "job_id": job_id,
                "status": "failed" if job.error else "completed",
                "priority": job.priority,
                "created_at": job.created_at.isoformat(),
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "error": job.error,
            }

        # Job not found (might be in queue)
        return {
            "job_id": job_id,
            "status": "pending",
        }

    def get_queue_stats(self) -> Dict:
        """Get queue statistics"""
        return {
            "pending": self.queue.qsize(),
            "active": len(self.active_jobs),
            "completed": len(self.completed_jobs),
            "workers": self.max_workers,
            "running": self.running,
        }


# Global job queue instance
_job_queue: Optional[JobQueue] = None


def get_job_queue() -> JobQueue:
    """Get the global job queue instance"""
    global _job_queue
    if _job_queue is None:
        _job_queue = JobQueue(max_workers=3)
    return _job_queue


async def initialize_job_queue():
    """Initialize and start the job queue"""
    queue = get_job_queue()
    await queue.start()
    logger.info("Job queue initialized")


async def shutdown_job_queue():
    """Shutdown the job queue"""
    global _job_queue
    if _job_queue:
        await _job_queue.stop()
        _job_queue = None
    logger.info("Job queue shut down")
