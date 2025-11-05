"""
Video Processor Service

Handles video generation from scripts
Implements TDD - Written to make tests pass
"""

import uuid
import os
import re
import asyncio
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.video import (
    VideoRequest,
    VideoResponse,
    VideoStatus,
    VideoScene
)
from app.services.voice_synthesizer import VoiceSynthesizer
from app.repository.video_repository import VideoRepository
from app.database import get_db_session
from app.queue import get_job_queue, JobPriority


class VideoProcessor:
    """
    Main video processing service
    Handles video generation, scene parsing, and job management
    """

    # Supported platforms with their configurations
    PLATFORM_SETTINGS = {
        "tiktok": {
            "aspect_ratio": "9:16",
            "max_duration": 180,
            "optimal_duration": 30,
            "resolution": "1080x1920"
        },
        "youtube": {
            "aspect_ratio": "16:9",
            "max_duration": None,
            "optimal_duration": 600,
            "resolution": "1920x1080"
        },
        "youtube_shorts": {
            "aspect_ratio": "9:16",
            "max_duration": 60,
            "optimal_duration": 30,
            "resolution": "1080x1920"
        },
        "instagram_reels": {
            "aspect_ratio": "9:16",
            "max_duration": 90,
            "optimal_duration": 30,
            "resolution": "1080x1920"
        },
        "instagram_stories": {
            "aspect_ratio": "9:16",
            "max_duration": 15,
            "optimal_duration": 15,
            "resolution": "1080x1920"
        },
        "facebook": {
            "aspect_ratio": "16:9",
            "max_duration": None,
            "optimal_duration": 120,
            "resolution": "1920x1080"
        }
    }

    # Valid transition types
    VALID_TRANSITIONS = ["fade", "cut", "dissolve", "slide", "wipe", "zoom"]

    # Rate limiting
    MAX_VIDEOS_PER_HOUR = 10
    WORDS_PER_MINUTE = 120  # Average speaking rate

    def __init__(self):
        """Initialize video processor"""
        # For backward compatibility and rate limiting
        self.user_video_counts: Dict[str, List[datetime]] = defaultdict(list)
        self.voice_synthesizer = VoiceSynthesizer()

        # Initialize video generation service
        from app.services.video_generation_service import VideoGenerationService
        self.video_generation_service = VideoGenerationService()

    def create_video_job(self, request: VideoRequest) -> VideoResponse:
        """
        Create a new video generation job

        Args:
            request: VideoRequest with script and parameters

        Returns:
            VideoResponse with job details

        Raises:
            ValueError: If request validation fails
        """
        # Validate request
        self._validate_request(request)

        # Check rate limit
        self._check_rate_limit(request.user_id)

        # Generate unique job ID
        job_id = f"vid_{uuid.uuid4().hex[:12]}"

        # Parse script into scenes
        scenes = self._parse_script_to_scenes(request.script_content)

        # Calculate estimated duration
        duration = self._calculate_duration(request.script_content)

        # Create video response
        video_response = VideoResponse(
            id=job_id,
            status=VideoStatus.PENDING,
            script_id=request.script_id,
            script_content=request.script_content,
            user_id=request.user_id,
            platform=request.platform,
            language=request.language,
            scenes=scenes,
            duration=duration,
            metadata={
                "voice_provider": request.voice_provider,
                "visual_style": request.visual_style,
                "aspect_ratio": request.aspect_ratio,
                "resolution": request.resolution
            }
        )

        # Store job in database
        with get_db_session() as db:
            repo = VideoRepository(db)
            repo.create(video_response, scenes)

        # Record video creation for rate limiting
        self._record_video_creation(request.user_id)

        # Add job to background queue for processing
        job_queue = get_job_queue()
        asyncio.create_task(
            job_queue.add_job(
                job_id=job_id,
                task_func=self._process_video_async,
                priority=JobPriority.NORMAL
            )
        )

        return video_response

    def get_job_status(self, job_id: str) -> Optional[VideoResponse]:
        """
        Get video job status

        Args:
            job_id: Video job ID

        Returns:
            VideoResponse or None if not found
        """
        with get_db_session() as db:
            repo = VideoRepository(db)
            video = repo.get_by_id(job_id)
            if video:
                return self._convert_db_to_response(video)
            return None

    def get_user_videos(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[VideoResponse], int]:
        """
        Get all videos for a user

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            limit: Items per page

        Returns:
            Tuple of (videos list, total count)
        """
        with get_db_session() as db:
            repo = VideoRepository(db)
            videos, total = repo.get_by_user_id(user_id, page, limit)

            # Convert to VideoResponse objects
            video_responses = [self._convert_db_to_response(v) for v in videos]

            return video_responses, total

    def delete_video_job(self, job_id: str) -> bool:
        """
        Delete a video job

        Args:
            job_id: Video job ID

        Returns:
            True if deleted, False if not found
        """
        with get_db_session() as db:
            repo = VideoRepository(db)
            return repo.delete(job_id)

    def retry_video_job(self, job_id: str) -> Optional[VideoResponse]:
        """
        Retry a failed video job

        Args:
            job_id: Video job ID

        Returns:
            Updated VideoResponse or None if not found
        """
        with get_db_session() as db:
            repo = VideoRepository(db)
            video = repo.get_by_id(job_id)
            if video and video.status == VideoStatus.FAILED:
                updated = repo.update(
                    job_id,
                    status=VideoStatus.PENDING,
                    error_message=None,
                    updated_at=datetime.utcnow()
                )
                if updated:
                    return self._convert_db_to_response(updated)
            return None

    def update_video_metadata(
        self,
        job_id: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Update video metadata

        Args:
            job_id: Video job ID
            metadata: Metadata to update

        Returns:
            True if updated, False if not found
        """
        with get_db_session() as db:
            repo = VideoRepository(db)
            updated = repo.update_metadata(job_id, metadata)
            return updated is not None

    def get_video_file_path(self, job_id: str) -> Optional[str]:
        """Get video/audio file path for download"""
        with get_db_session() as db:
            repo = VideoRepository(db)
            video = repo.get_by_id(job_id)
            if video and video.status == VideoStatus.COMPLETED and video.video_url:
                # If video_url is a file:// URL, extract the actual path
                if video.video_url.startswith("file://"):
                    return video.video_url.replace("file://", "")
                # Otherwise return the URL as-is (for remote files)
                return video.video_url
            return None

    def get_thumbnail_path(self, job_id: str) -> Optional[str]:
        """Get thumbnail file path"""
        with get_db_session() as db:
            repo = VideoRepository(db)
            video = repo.get_by_id(job_id)
            if video and video.thumbnail_url:
                return f"/tmp/thumbnails/{job_id}.jpg"
            return None

    def _validate_request(self, request: VideoRequest) -> None:
        """Validate video request"""
        if not request.script_content or len(request.script_content.strip()) == 0:
            raise ValueError("Script content cannot be empty")

        if request.platform not in self.PLATFORM_SETTINGS:
            raise ValueError(f"Unsupported platform: {request.platform}")

    def _parse_script_to_scenes(self, script_content: str) -> List[VideoScene]:
        """
        Parse script into individual scenes

        Args:
            script_content: Full script text

        Returns:
            List of VideoScene objects
        """
        # Split script into sentences/paragraphs
        # Each scene is approximately 5-7 seconds
        sentences = re.split(r'[.!?]+', script_content)
        sentences = [s.strip() for s in sentences if s.strip()]

        scenes = []
        for i, sentence in enumerate(sentences, start=1):
            # Estimate duration based on word count
            words = len(sentence.split())
            duration = (words / self.WORDS_PER_MINUTE) * 60

            scene = VideoScene(
                scene_number=i,
                text=sentence,
                duration=max(duration, 2.0),  # Minimum 2 seconds per scene
                transition="fade"
            )
            scenes.append(scene)

        return scenes

    def _calculate_duration(self, script_content: str) -> float:
        """
        Calculate estimated video duration

        Args:
            script_content: Script text

        Returns:
            Estimated duration in seconds
        """
        words = len(script_content.split())
        # Average speaking rate: 120 words per minute
        duration_seconds = (words / self.WORDS_PER_MINUTE) * 60
        return round(duration_seconds, 1)

    def _get_platform_settings(self, platform: str) -> Dict[str, Any]:
        """Get platform-specific settings"""
        return self.PLATFORM_SETTINGS.get(platform, self.PLATFORM_SETTINGS["youtube"])

    def _validate_transition(self, transition: str) -> bool:
        """Validate transition type"""
        return transition in self.VALID_TRANSITIONS

    def _estimate_file_size(self, duration: float, resolution: str) -> int:
        """
        Estimate video file size

        Args:
            duration: Video duration in seconds
            resolution: Video resolution (e.g., "1080p", "720p")

        Returns:
            Estimated file size in bytes
        """
        # Bitrate estimates (bits per second)
        bitrates = {
            "4k": 20_000_000,      # 20 Mbps
            "1080p": 8_000_000,    # 8 Mbps
            "720p": 5_000_000,     # 5 Mbps
            "480p": 2_500_000      # 2.5 Mbps
        }

        bitrate = bitrates.get(resolution, bitrates["1080p"])
        file_size_bits = bitrate * duration
        file_size_bytes = file_size_bits // 8

        return int(file_size_bytes)

    def _cleanup_temp_files(self, file_paths: List[str]) -> None:
        """
        Clean up temporary files

        Args:
            file_paths: List of file paths to delete
        """
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                # Log error but don't fail
                print(f"Failed to delete temp file {file_path}: {e}")

    def _check_rate_limit(self, user_id: str) -> None:
        """
        Check if user has exceeded rate limit

        Args:
            user_id: User ID

        Raises:
            Exception: If rate limit exceeded
        """
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)

        # Get user's video creation timestamps
        timestamps = self.user_video_counts[user_id]

        # Remove old timestamps
        timestamps = [ts for ts in timestamps if ts > one_hour_ago]
        self.user_video_counts[user_id] = timestamps

        # Check limit
        if len(timestamps) >= self.MAX_VIDEOS_PER_HOUR:
            raise Exception("Rate limit exceeded: Maximum 10 videos per hour")

    def _record_video_creation(self, user_id: str) -> None:
        """Record video creation timestamp for rate limiting"""
        self.user_video_counts[user_id].append(datetime.utcnow())

    def _update_job_status(self, job_id: str, status: VideoStatus) -> None:
        """Update job status"""
        job = self.jobs.get(job_id)
        if job:
            job.status = status
            job.updated_at = datetime.utcnow()
            if status == VideoStatus.COMPLETED:
                job.completed_at = datetime.utcnow()

    def _process_video(self, job_id: str) -> None:
        """
        Process video (placeholder for actual FFmpeg processing)

        Args:
            job_id: Video job ID

        Raises:
            Exception: If processing fails
        """
        job = self.jobs.get(job_id)
        if not job:
            raise Exception(f"Job {job_id} not found")

        # Update status to processing
        self._update_job_status(job_id, VideoStatus.PROCESSING)

        try:
            # TODO: Actual video processing with FFmpeg
            # 1. Generate voice audio using TTS
            # 2. Select/generate visual assets
            # 3. Composite video with FFmpeg
            # 4. Upload to storage
            # 5. Generate thumbnail

            # For now, simulate processing
            pass

        except Exception as e:
            # Mark as failed
            job.status = VideoStatus.FAILED
            job.error_message = str(e)
            job.updated_at = datetime.utcnow()
            raise

    async def _synthesize_voice(
        self,
        text: str,
        provider: str,
        voice_id: Optional[str] = None
    ) -> str:
        """
        Synthesize voice from text

        Args:
            text: Text to synthesize
            provider: Voice provider (azure, elevenlabs, google)
            voice_id: Specific voice ID

        Returns:
            Path to generated audio file
        """
        # TODO: Implement actual voice synthesis
        # This is a placeholder that will be implemented
        return f"/tmp/audio_{uuid.uuid4().hex}.mp3"

    def _process_video_with_generation_service(self, job_id: str, progress_callback=None) -> Dict[str, Any]:
        """
        Process video using the new VideoGenerationService
        Complete pipeline: script → scenes → audio → video → thumbnail

        Args:
            job_id: Video job ID
            progress_callback: Optional callback for progress updates

        Returns:
            Result dictionary with video_path, thumbnail_path, metadata
        """
        try:
            # Update to processing status
            with get_db_session() as db:
                repo = VideoRepository(db)
                repo.update_status(job_id, VideoStatus.PROCESSING)

            # Get video from database and extract needed data
            with get_db_session() as db:
                repo = VideoRepository(db)
                video = repo.get_by_id(job_id)
                if not video:
                    raise Exception(f"Video {job_id} not found in database")

                # Create VideoRequest from database video
                request = VideoRequest(
                    script_id=video.script_id,
                    script_content=video.script_content,
                    platform=video.platform,
                    language=video.language,
                    user_id=video.user_id,
                    title=f"Video {job_id}",
                    duration=int(video.duration) if video.duration else 30
                )

            print(f"🎬 Starting video generation for {job_id}...")

            # Generate video using VideoGenerationService
            result = self.video_generation_service.generate_video(request, progress_callback)

            print(f"✅ Video generation complete: {result['video_path']}")

            # Get file size
            video_size = os.path.getsize(result['video_path']) if os.path.exists(result['video_path']) else 0

            # Update database with results
            with get_db_session() as db:
                repo = VideoRepository(db)
                repo.update(
                    job_id,
                    status=VideoStatus.COMPLETED,
                    video_url=f"file://{result['video_path']}",
                    thumbnail_url=f"file://{result['thumbnail_path']}",
                    file_size=video_size,
                    video_metadata=result['metadata'],
                    completed_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

            print(f"✅ Video {job_id} completed successfully")

            return result

        except Exception as e:
            # Mark as failed
            print(f"❌ Video processing failed: {e}")
            import traceback
            traceback.print_exc()

            with get_db_session() as db:
                repo = VideoRepository(db)
                repo.update_status(job_id, VideoStatus.FAILED, error_message=str(e))

            raise

    def _convert_db_to_response(self, video: 'Video') -> VideoResponse:
        """
        Convert database Video model to VideoResponse

        Args:
            video: Database Video object

        Returns:
            VideoResponse object
        """
        # Convert scenes - handle case where scenes might not be loaded
        try:
            scenes = [
                VideoScene(
                    scene_number=scene.scene_number,
                    text=scene.text,
                    duration=scene.duration,
                    visual_asset=scene.visual_asset,
                    transition=scene.transition
                )
                for scene in video.scenes
            ] if video.scenes else []
        except Exception as e:
            # If scenes can't be accessed (detached from session), return empty list
            print(f"⚠️  Could not load scenes for video {video.id}: {e}")
            scenes = []

        return VideoResponse(
            id=video.id,
            status=video.status,
            script_id=video.script_id,
            script_content=video.script_content,
            user_id=video.user_id,
            platform=video.platform,
            language=video.language,
            video_url=video.video_url,
            thumbnail_url=video.thumbnail_url,
            duration=video.duration,
            file_size=video.file_size,
            scenes=scenes,
            metadata=video.video_metadata,
            error_message=video.error_message,
            created_at=video.created_at,
            updated_at=video.updated_at,
            completed_at=video.completed_at
        )

    async def _process_video_async(self, job_id: str) -> None:
        """
        Async video processing for background queue
        Uses VideoGenerationService with real-time progress updates via WebSocket

        Args:
            job_id: Video job ID
        """
        from app.websocket import emit_progress_update, emit_processing_completed, emit_processing_failed

        try:
            # Update progress: Starting
            await emit_progress_update(
                job_id,
                progress=0,
                message="Initializing video processing...",
                current_step="initialization"
            )

            # Create async progress callback for WebSocket updates
            async def async_progress_callback(progress: float, status: str):
                """Send progress updates via WebSocket"""
                # Determine current step based on progress
                if progress < 0.2:
                    step = "scene_parsing"
                elif progress < 0.4:
                    step = "audio_generation"
                elif progress < 0.7:
                    step = "video_composition"
                elif progress < 0.95:
                    step = "thumbnail_generation"
                else:
                    step = "finalization"

                await emit_progress_update(
                    job_id,
                    progress=int(progress * 100),
                    message=status,
                    current_step=step
                )

            # Run the video generation in a thread pool with progress callbacks
            loop = asyncio.get_event_loop()

            # Create a synchronous progress callback that queues async updates
            def sync_progress_callback(progress: float, status: str):
                """Synchronous wrapper for async progress callback"""
                # Schedule the async callback in the event loop
                asyncio.run_coroutine_threadsafe(
                    async_progress_callback(progress, status),
                    loop
                )

            # Run the video generation service
            video_result = await loop.run_in_executor(
                None,
                self._process_video_with_generation_service,
                job_id,
                sync_progress_callback
            )

            # Update progress: Complete (100%)
            await emit_progress_update(
                job_id,
                progress=100,
                message="Video processing complete!",
                current_step="completed"
            )

            # Get video details for completion event
            with get_db_session() as db:
                repo = VideoRepository(db)
                video = repo.get_by_id(job_id)
                if video:
                    await emit_processing_completed(
                        job_id=job_id,
                        video_url=video.video_url or "",
                        thumbnail_url=video.thumbnail_url,
                        duration=video.duration
                    )

        except Exception as e:
            # Emit failure event
            await emit_processing_failed(job_id, str(e))
            raise
