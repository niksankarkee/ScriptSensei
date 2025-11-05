"""
WebSocket Manager for Real-time Progress Updates

Handles Socket.IO connections and emits video processing progress events
"""

import socketio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Create Socket.IO server instance
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        'http://localhost:4000',  # Frontend
        'http://localhost:3000',  # Alternative frontend port
        'http://localhost:8000',  # Kong API Gateway
    ],
    logger=True,
    engineio_logger=True
)


class SocketManager:
    """
    Manages WebSocket connections and events for video processing
    """

    def __init__(self, sio_instance: socketio.AsyncServer):
        self.sio = sio_instance
        self._setup_event_handlers()

    def _setup_event_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            logger.info(f"Client connected: {sid}")

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            logger.info(f"Client disconnected: {sid}")

        @self.sio.event
        async def subscribe_to_job(sid, data):
            """
            Subscribe client to job-specific room for progress updates

            Args:
                sid: Socket ID
                data: Dict with 'job_id' key
            """
            job_id = data.get('job_id')
            if not job_id:
                await self.sio.emit('error', {'message': 'job_id required'}, to=sid)
                return

            # Join room for this job
            await self.sio.enter_room(sid, f"job_{job_id}")
            logger.info(f"Client {sid} subscribed to job {job_id}")

            await self.sio.emit(
                'subscribed',
                {'job_id': job_id, 'message': 'Successfully subscribed to job updates'},
                to=sid
            )

        @self.sio.event
        async def unsubscribe_from_job(sid, data):
            """
            Unsubscribe client from job-specific room

            Args:
                sid: Socket ID
                data: Dict with 'job_id' key
            """
            job_id = data.get('job_id')
            if not job_id:
                return

            # Leave room for this job
            await self.sio.leave_room(sid, f"job_{job_id}")
            logger.info(f"Client {sid} unsubscribed from job {job_id}")

    async def emit_to_job(self, job_id: str, event: str, data: Dict[str, Any]):
        """
        Emit event to all clients subscribed to a job

        Args:
            job_id: Video job ID
            event: Event name
            data: Event data
        """
        room = f"job_{job_id}"
        await self.sio.emit(event, data, room=room)
        logger.debug(f"Emitted {event} to job {job_id}: {data}")


# Global socket manager instance
_socket_manager: Optional[SocketManager] = None


def get_socket_manager() -> SocketManager:
    """Get the global socket manager instance"""
    global _socket_manager
    if _socket_manager is None:
        _socket_manager = SocketManager(sio)
    return _socket_manager


# Convenience functions for emitting events

async def emit_processing_started(job_id: str, metadata: Optional[Dict[str, Any]] = None):
    """
    Emit processing started event

    Args:
        job_id: Video job ID
        metadata: Optional metadata about the job
    """
    manager = get_socket_manager()
    await manager.emit_to_job(
        job_id,
        'processing_started',
        {
            'job_id': job_id,
            'status': 'processing',
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }
    )


async def emit_progress_update(
    job_id: str,
    progress: int,
    message: str,
    current_step: Optional[str] = None
):
    """
    Emit progress update event

    Args:
        job_id: Video job ID
        progress: Progress percentage (0-100)
        message: Progress message
        current_step: Current processing step
    """
    manager = get_socket_manager()
    await manager.emit_to_job(
        job_id,
        'progress_update',
        {
            'job_id': job_id,
            'progress': progress,
            'message': message,
            'current_step': current_step,
            'timestamp': datetime.utcnow().isoformat()
        }
    )


async def emit_processing_completed(
    job_id: str,
    video_url: str,
    thumbnail_url: Optional[str] = None,
    duration: Optional[int] = None
):
    """
    Emit processing completed event

    Args:
        job_id: Video job ID
        video_url: URL of the completed video
        thumbnail_url: Optional thumbnail URL
        duration: Video duration in seconds
    """
    manager = get_socket_manager()
    await manager.emit_to_job(
        job_id,
        'processing_completed',
        {
            'job_id': job_id,
            'status': 'completed',
            'video_url': video_url,
            'thumbnail_url': thumbnail_url,
            'duration': duration,
            'timestamp': datetime.utcnow().isoformat()
        }
    )


async def emit_processing_failed(job_id: str, error_message: str):
    """
    Emit processing failed event

    Args:
        job_id: Video job ID
        error_message: Error message describing the failure
    """
    manager = get_socket_manager()
    await manager.emit_to_job(
        job_id,
        'processing_failed',
        {
            'job_id': job_id,
            'status': 'failed',
            'error': error_message,
            'timestamp': datetime.utcnow().isoformat()
        }
    )
