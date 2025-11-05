"""
SQLAlchemy Database Models for Video Processing Service

Implements persistent storage for videos in PostgreSQL
"""

from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from app.database import Base
from app.models.video import VideoStatus


class Video(Base):
    """
    Video table - stores video generation jobs

    Maps to 'videos' table in PostgreSQL
    """
    __tablename__ = "videos"

    # Primary key
    id = Column(String(50), primary_key=True, index=True)

    # Foreign keys and relationships
    script_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(255), nullable=False, index=True)

    # Video metadata
    script_content = Column(Text, nullable=False)
    platform = Column(String(50), nullable=False)
    language = Column(String(10), nullable=False, default="en")
    status = Column(SQLEnum(VideoStatus), nullable=False, default=VideoStatus.PENDING, index=True)

    # Video files
    video_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)

    # Video properties
    duration = Column(Float, nullable=True)
    file_size = Column(Integer, nullable=True)

    # Processing metadata (stored as JSONB)
    video_metadata = Column("metadata", JSON, nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    scenes = relationship("VideoScene", back_populates="video", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Video(id='{self.id}', status='{self.status}', platform='{self.platform}')>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "script_id": self.script_id,
            "script_content": self.script_content,
            "user_id": self.user_id,
            "platform": self.platform,
            "language": self.language,
            "status": self.status.value if isinstance(self.status, VideoStatus) else self.status,
            "video_url": self.video_url,
            "thumbnail_url": self.thumbnail_url,
            "duration": self.duration,
            "file_size": self.file_size,
            "scenes": [scene.to_dict() for scene in self.scenes] if self.scenes else [],
            "metadata": self.video_metadata,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class VideoScene(Base):
    """
    VideoScene table - stores individual scenes for a video

    Maps to 'video_scenes' table in PostgreSQL
    """
    __tablename__ = "video_scenes"

    # Primary key
    id = Column(String(50), primary_key=True, default=lambda: f"scene-{uuid.uuid4()}")

    # Foreign key
    video_id = Column(String(50), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)

    # Scene properties
    scene_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    duration = Column(Float, nullable=False)
    start_time = Column(Float, nullable=False, default=0.0)
    end_time = Column(Float, nullable=False)
    is_expanded = Column(Integer, nullable=False, default=0)  # SQLite doesn't have boolean
    visual_asset = Column(String(500), nullable=True)
    transition = Column(String(20), nullable=False, default="fade")

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    video = relationship("Video", back_populates="scenes")
    layers = relationship("SceneLayer", back_populates="scene", cascade="all, delete-orphan", order_by="SceneLayer.order_index")

    def __repr__(self):
        return f"<VideoScene(id={self.id}, video_id='{self.video_id}', scene_number={self.scene_number})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "video_id": self.video_id,
            "scene_number": self.scene_number,
            "text": self.text,
            "duration": self.duration,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "is_expanded": bool(self.is_expanded),
            "visual_asset": self.visual_asset,
            "transition": self.transition,
            "layers": [layer.to_dict() for layer in self.layers] if self.layers else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class SceneLayer(Base):
    """
    SceneLayer table - stores layers for each scene (audio, voiceover, text, media, shape, avatar, effect)

    Maps to 'scene_layers' table in PostgreSQL
    """
    __tablename__ = "scene_layers"

    # Primary key
    id = Column(String(50), primary_key=True, default=lambda: f"layer-{uuid.uuid4()}")

    # Foreign key
    scene_id = Column(String(50), ForeignKey("video_scenes.id", ondelete="CASCADE"), nullable=False, index=True)

    # Layer properties
    type = Column(String(20), nullable=False)  # audio, voiceover, text, media, shape, avatar, effect
    name = Column(String(255), nullable=False)
    enabled = Column(Integer, nullable=False, default=1)  # SQLite doesn't have boolean
    duration = Column(Float, nullable=False)
    start_time = Column(Float, nullable=False, default=0.0)
    end_time = Column(Float, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    # Layer-specific properties (stored as JSON)
    properties = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scene = relationship("VideoScene", back_populates="layers")

    def __repr__(self):
        return f"<SceneLayer(id={self.id}, scene_id='{self.scene_id}', type='{self.type}')>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "scene_id": self.scene_id,
            "type": self.type,
            "name": self.name,
            "enabled": bool(self.enabled),
            "duration": self.duration,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "order_index": self.order_index,
            "properties": self.properties or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
