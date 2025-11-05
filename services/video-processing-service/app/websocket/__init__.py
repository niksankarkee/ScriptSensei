"""
WebSocket package for real-time updates
"""

from app.websocket.manager import (
    sio,
    get_socket_manager,
    emit_progress_update,
    emit_processing_started,
    emit_processing_completed,
    emit_processing_failed,
)

__all__ = [
    "sio",
    "get_socket_manager",
    "emit_progress_update",
    "emit_processing_started",
    "emit_processing_completed",
    "emit_processing_failed",
]
