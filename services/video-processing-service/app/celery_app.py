"""
Celery Application Configuration

Configures Celery for distributed video processing tasks.
Uses Redis as both message broker and result backend.
"""

import os
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure
from kombu import Queue, Exchange

# Redis connection settings
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Build Redis URL
if REDIS_PASSWORD:
    REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
else:
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Celery configuration
celery_app = Celery(
    "video_processing",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.video_tasks"]
)

# Celery configuration settings
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Result backend settings
    result_expires=86400,  # Results expire after 24 hours
    result_backend_transport_options={
        "master_name": "mymaster",
        "visibility_timeout": 3600,
    },

    # Task execution settings
    task_acks_late=True,  # Acknowledge task after completion
    task_reject_on_worker_lost=True,  # Reject task if worker dies
    task_track_started=True,  # Track when task starts
    task_time_limit=1800,  # 30 minutes hard limit
    task_soft_time_limit=1500,  # 25 minutes soft limit (allows cleanup)

    # Retry settings
    task_default_retry_delay=60,  # 1 minute delay between retries
    task_max_retries=3,  # Maximum 3 retries

    # Worker settings
    worker_prefetch_multiplier=1,  # Worker takes 1 task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks
    worker_disable_rate_limits=False,

    # Queue settings
    task_default_queue="videos",
    task_default_exchange="videos",
    task_default_routing_key="videos.default",

    # Beat schedule (for periodic tasks if needed)
    beat_schedule={
        # Example: Clean up old jobs every hour
        "cleanup-old-jobs": {
            "task": "app.tasks.video_tasks.cleanup_old_jobs",
            "schedule": 3600.0,  # Every hour
        },
    },

    # Monitoring
    task_send_sent_event=True,  # Send task-sent events
    worker_send_task_events=True,  # Worker sends task events

    # Security
    task_always_eager=False,  # Never execute tasks synchronously (except in tests)
    task_eager_propagates=False,
)

# Define task queues with priorities
celery_app.conf.task_queues = (
    # High priority queue for premium users
    Queue(
        "videos.high",
        Exchange("videos", type="topic"),
        routing_key="videos.high",
        queue_arguments={"x-max-priority": 10}
    ),

    # Default priority queue
    Queue(
        "videos.default",
        Exchange("videos", type="topic"),
        routing_key="videos.default",
        queue_arguments={"x-max-priority": 5}
    ),

    # Low priority queue for free tier users
    Queue(
        "videos.low",
        Exchange("videos", type="topic"),
        routing_key="videos.low",
        queue_arguments={"x-max-priority": 1}
    ),
)

# Task routing
celery_app.conf.task_routes = {
    "app.tasks.video_tasks.generate_video_async": {
        "queue": "videos.default",
        "routing_key": "videos.default",
    },
    "app.tasks.video_tasks.cleanup_old_jobs": {
        "queue": "videos.low",
        "routing_key": "videos.low",
    },
}


# Signal handlers for logging and monitoring
@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    """Called before task execution"""
    print(f"[TASK START] {task.name} - Task ID: {task_id}")


@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    """Called after task execution"""
    print(f"[TASK COMPLETE] {task.name} - Task ID: {task_id}")


@task_failure.connect
def task_failure_handler(task_id, exception, *args, **kwargs):
    """Called on task failure"""
    print(f"[TASK FAILED] Task ID: {task_id} - Error: {exception}")


def get_celery_app() -> Celery:
    """Get configured Celery app instance"""
    return celery_app


if __name__ == "__main__":
    # Start Celery worker
    # Usage: python -m app.celery_app worker --loglevel=info
    celery_app.start()
