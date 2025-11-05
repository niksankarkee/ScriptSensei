"""
Video Repository

Handles all database operations for videos
Implements repository pattern for clean separation of concerns
"""

from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.db_models import Video, VideoScene
from app.models.video import VideoRequest, VideoResponse, VideoStatus, VideoScene as VideoScenePydantic


class VideoRepository:
    """
    Repository for video database operations

    Provides CRUD operations and queries for videos
    """

    def __init__(self, db: Session):
        """
        Initialize repository with database session

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def create(self, video_data: VideoResponse, scenes: List[VideoScenePydantic]) -> Video:
        """
        Create a new video in the database

        Args:
            video_data: VideoResponse with video details
            scenes: List of video scenes

        Returns:
            Created Video object
        """
        # Create video record
        db_video = Video(
            id=video_data.id,
            script_id=video_data.script_id,
            user_id=video_data.user_id,
            script_content=video_data.script_content,
            platform=video_data.platform,
            language=video_data.language,
            status=video_data.status,
            video_url=video_data.video_url,
            thumbnail_url=video_data.thumbnail_url,
            duration=video_data.duration,
            file_size=video_data.file_size,
            metadata=video_data.metadata,
            error_message=video_data.error_message,
            created_at=video_data.created_at,
            updated_at=video_data.updated_at,
            completed_at=video_data.completed_at
        )

        # Add to session
        self.db.add(db_video)
        self.db.flush()  # Flush to get the video ID

        # Create scene records with calculated start_time and end_time
        cumulative_time = 0.0
        for scene in scenes:
            start_time = cumulative_time
            end_time = start_time + scene.duration

            db_scene = VideoScene(
                video_id=db_video.id,
                scene_number=scene.scene_number,
                text=scene.text,
                duration=scene.duration,
                start_time=start_time,
                end_time=end_time,
                visual_asset=scene.visual_asset,
                transition=scene.transition
            )
            self.db.add(db_scene)

            cumulative_time = end_time

        # Commit transaction
        self.db.commit()
        self.db.refresh(db_video)

        return db_video

    def get_by_id(self, video_id: str) -> Optional[Video]:
        """
        Get video by ID

        Args:
            video_id: Video ID

        Returns:
            Video object or None if not found
        """
        return self.db.query(Video).filter(Video.id == video_id).first()

    def get_by_user_id(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Video], int]:
        """
        Get all videos for a user with pagination

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            limit: Items per page

        Returns:
            Tuple of (videos list, total count)
        """
        # Get total count
        total = self.db.query(Video).filter(Video.user_id == user_id).count()

        # Get paginated videos
        offset = (page - 1) * limit
        videos = (
            self.db.query(Video)
            .filter(Video.user_id == user_id)
            .order_by(desc(Video.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )

        return videos, total

    def update(self, video_id: str, **kwargs) -> Optional[Video]:
        """
        Update video fields

        Args:
            video_id: Video ID
            **kwargs: Fields to update

        Returns:
            Updated Video object or None if not found
        """
        video = self.get_by_id(video_id)
        if not video:
            return None

        # Update fields
        for key, value in kwargs.items():
            if hasattr(video, key):
                setattr(video, key, value)

        # Always update updated_at
        video.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(video)

        return video

    def update_status(
        self,
        video_id: str,
        status: VideoStatus,
        error_message: Optional[str] = None
    ) -> Optional[Video]:
        """
        Update video status

        Args:
            video_id: Video ID
            status: New status
            error_message: Error message if status is FAILED

        Returns:
            Updated Video object or None if not found
        """
        video = self.get_by_id(video_id)
        if not video:
            return None

        video.status = status
        video.updated_at = datetime.utcnow()

        if status == VideoStatus.FAILED and error_message:
            video.error_message = error_message

        if status == VideoStatus.COMPLETED:
            video.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(video)

        return video

    def delete(self, video_id: str) -> bool:
        """
        Delete a video

        Args:
            video_id: Video ID

        Returns:
            True if deleted, False if not found
        """
        video = self.get_by_id(video_id)
        if not video:
            return False

        # Scenes will be cascade deleted due to relationship configuration
        self.db.delete(video)
        self.db.commit()

        return True

    def update_metadata(self, video_id: str, metadata: dict) -> Optional[Video]:
        """
        Update video metadata

        Args:
            video_id: Video ID
            metadata: Metadata dictionary to update

        Returns:
            Updated Video object or None if not found
        """
        video = self.get_by_id(video_id)
        if not video:
            return None

        # Merge with existing metadata
        if video.video_metadata is None:
            video.video_metadata = {}

        video.video_metadata.update(metadata)
        video.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(video)

        return video

    def get_scenes_by_video_id(self, video_id: str) -> List[VideoScene]:
        """
        Get all scenes for a video

        Args:
            video_id: Video ID

        Returns:
            List of VideoScene objects
        """
        return (
            self.db.query(VideoScene)
            .filter(VideoScene.video_id == video_id)
            .order_by(VideoScene.scene_number)
            .all()
        )

    def get_videos_by_status(
        self,
        status: VideoStatus,
        limit: int = 100
    ) -> List[Video]:
        """
        Get videos by status (useful for background processing)

        Args:
            status: Video status to filter by
            limit: Maximum number of videos to return

        Returns:
            List of Video objects
        """
        return (
            self.db.query(Video)
            .filter(Video.status == status)
            .order_by(Video.created_at)
            .limit(limit)
            .all()
        )

    def count_by_user_and_timeframe(
        self,
        user_id: str,
        start_time: datetime
    ) -> int:
        """
        Count videos created by user after a certain time

        Useful for rate limiting

        Args:
            user_id: User ID
            start_time: Start datetime

        Returns:
            Count of videos
        """
        return (
            self.db.query(Video)
            .filter(
                Video.user_id == user_id,
                Video.created_at >= start_time
            )
            .count()
        )
