"""
Video Generation Service

End-to-end video generation orchestrator that integrates:
- Scene Renderer: Parses scripts and generates scenes
- FFmpeg Compositor: Renders video from scenes
- Voice Synthesizer: Generates audio for each scene

This is the main service for creating videos from scripts.
"""

import os
import uuid
import shutil
from typing import List, Optional, Dict, Any, Callable
from pathlib import Path
from datetime import datetime

from app.services.video_scene_renderer import (
    VideoSceneRenderer,
    Scene,
    SceneRenderConfig,
    SceneGenerationError
)
from app.services.ffmpeg_compositor import (
    FFmpegCompositor,
    VideoSegment,
    CompositionConfig,
    CompositionError
)
from app.services.voice_synthesizer import VoiceSynthesizer
from app.services.subtitle_generator import (
    SubtitleGenerator,
    SubtitleStyle,
    SubtitleSegment
)
from app.models.video import VideoRequest, VideoStatus


class VideoGenerationError(Exception):
    """Exception raised when video generation fails"""
    pass


class VideoGenerationService:
    """
    End-to-end video generation service

    Orchestrates the complete pipeline:
    1. Parse script into scenes
    2. Generate audio for each scene (TTS)
    3. Assign images to scenes
    4. Render video segments
    5. Concatenate into final video
    """

    # Output directories
    OUTPUT_BASE_DIR = os.getenv("VIDEO_OUTPUT_DIR", "/tmp/scriptsensei/videos")
    TEMP_DIR = os.getenv("VIDEO_TEMP_DIR", "/tmp/scriptsensei/temp")

    def __init__(self):
        """Initialize video generation service"""
        self.scene_renderer = VideoSceneRenderer()
        self.compositor = FFmpegCompositor()
        self.voice_synthesizer = VoiceSynthesizer()
        self.subtitle_generator = SubtitleGenerator()

        # Ensure output directories exist
        Path(self.OUTPUT_BASE_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.TEMP_DIR).mkdir(parents=True, exist_ok=True)

    def generate_video(
        self,
        request: VideoRequest,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Generate complete video from script

        Args:
            request: VideoRequest with script and configuration
            progress_callback: Optional callback(progress: float, status: str)

        Returns:
            Dictionary with video_path, thumbnail_path, metadata

        Raises:
            VideoGenerationError: If generation fails
        """
        video_id = str(uuid.uuid4())

        print(f"\n[VideoGen] ===== VIDEO GENERATION REQUEST =====")
        print(f"[VideoGen] Video ID: {video_id}")
        print(f"[VideoGen] Platform: {request.platform}")
        print(f"[VideoGen] Language: {request.language}")
        print(f"[VideoGen] Aspect Ratio from request: {request.aspect_ratio}")
        print(f"[VideoGen] Duration: {request.duration}")
        print(f"[VideoGen] Voice Provider: {request.voice_provider}")

        try:
            # Create working directory for this video
            work_dir = Path(self.TEMP_DIR) / video_id
            work_dir.mkdir(parents=True, exist_ok=True)

            self._update_progress(progress_callback, 0.05, "Initializing video generation...")

            # Step 1: Generate scenes from script
            self._update_progress(progress_callback, 0.10, "Parsing script into scenes...")
            scenes = self._generate_scenes(request, work_dir)

            # Step 2: Generate audio for each scene
            self._update_progress(progress_callback, 0.30, f"Generating audio for {len(scenes)} scenes...")
            scenes_with_audio = self._generate_audio_for_scenes(scenes, request, work_dir, progress_callback)

            # Step 3: Render video segments
            self._update_progress(progress_callback, 0.60, "Rendering video segments...")
            video_segments = self._create_video_segments(scenes_with_audio, work_dir)

            # Step 4: Compose final video
            self._update_progress(progress_callback, 0.75, "Composing final video...")
            final_video_path = self._compose_final_video(
                video_segments,
                video_id,
                request,
                progress_callback
            )

            # Step 4.5: Add subtitles (if enabled)
            if getattr(request, 'enable_subtitles', True):  # Default: enabled
                self._update_progress(progress_callback, 0.85, "Adding subtitles...")
                final_video_path = self._add_subtitles_to_video(
                    final_video_path,
                    request,
                    scenes_with_audio,
                    video_id
                )

            # Step 5: Generate thumbnail
            self._update_progress(progress_callback, 0.95, "Generating thumbnail...")
            thumbnail_path = self._generate_thumbnail(final_video_path, video_id)

            # Step 6: Get video metadata
            metadata = self._get_video_metadata(final_video_path, request)

            self._update_progress(progress_callback, 1.0, "Video generation complete!")

            # Cleanup temp directory
            shutil.rmtree(work_dir, ignore_errors=True)

            return {
                "video_id": video_id,
                "video_path": final_video_path,
                "thumbnail_path": thumbnail_path,
                "metadata": metadata,
                "status": VideoStatus.COMPLETED
            }

        except Exception as e:
            # Cleanup on failure
            work_dir = Path(self.TEMP_DIR) / video_id
            if work_dir.exists():
                shutil.rmtree(work_dir, ignore_errors=True)

            error_msg = f"Video generation failed: {str(e)}"
            self._update_progress(progress_callback, -1, error_msg)
            raise VideoGenerationError(error_msg) from e

    def _generate_scenes(
        self,
        request: VideoRequest,
        work_dir: Path
    ) -> List[Scene]:
        """
        Generate scenes from script

        Args:
            request: VideoRequest
            work_dir: Working directory

        Returns:
            List of Scene objects
        """
        # Prepare script for scene renderer
        script_data = {
            "title": request.title or "Untitled",
            "content": request.script_content,
            "language": request.language or "en",
            "duration": request.duration or 30
        }

        # Configure scene renderer for platform
        # Use user's selected aspect_ratio if provided, otherwise derive from platform
        aspect_ratio = request.aspect_ratio or self._get_aspect_ratio(request.platform)
        print(f"[VideoGen] Scene rendering aspect ratio: {aspect_ratio}")
        config = SceneRenderConfig(
            platform=request.platform,
            aspect_ratio=aspect_ratio,
            max_total_duration=request.duration
        )

        # Generate scenes
        try:
            scenes = self.scene_renderer.generate_scenes(script_data, config)

            if not scenes:
                raise SceneGenerationError("No scenes generated from script")

            return scenes

        except Exception as e:
            raise VideoGenerationError(f"Scene generation failed: {str(e)}") from e

    def _get_audio_duration(self, audio_file: str) -> float:
        """
        Get the duration of an audio file using ffprobe

        Args:
            audio_file: Path to audio file

        Returns:
            Duration in seconds
        """
        import subprocess
        try:
            result = subprocess.run(
                [
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    audio_file
                ],
                capture_output=True,
                text=True,
                timeout=5
            )
            duration = float(result.stdout.strip())
            return duration
        except Exception as e:
            print(f"[VideoGen] Warning: Could not detect audio duration for {audio_file}: {e}")
            # Return a default duration as fallback
            return 5.0

    def _generate_audio_for_scenes(
        self,
        scenes: List[Scene],
        request: VideoRequest,
        work_dir: Path,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> List[Scene]:
        """
        Generate audio (TTS) for each scene using Azure TTS

        Args:
            scenes: List of scenes
            request: VideoRequest
            work_dir: Working directory
            progress_callback: Progress callback

        Returns:
            Scenes with audio_file paths assigned and durations updated to match audio
        """
        audio_dir = work_dir / "audio"
        audio_dir.mkdir(exist_ok=True)

        total_scenes = len(scenes)

        for i, scene in enumerate(scenes):
            try:
                # Generate audio using Azure TTS
                audio_path = self.voice_synthesizer.synthesize(
                    text=scene.text,
                    provider=request.voice_provider or "azure",
                    language=request.language or "en-US",
                    voice_name=request.voice_id,
                    output_format="mp3"
                )

                # Update scene with audio path
                scene.audio_file = audio_path

                # CRITICAL FIX: Update scene duration to match actual audio file duration
                actual_duration = self._get_audio_duration(audio_path)
                original_duration = scene.duration
                scene.duration = actual_duration

                print(f"[VideoGen] Scene {i + 1} duration: estimated={original_duration:.2f}s, actual={actual_duration:.2f}s")

                # Update progress
                scene_progress = 0.30 + (0.30 * (i + 1) / total_scenes)
                self._update_progress(
                    progress_callback,
                    scene_progress,
                    f"Generated audio for scene {i + 1}/{total_scenes}"
                )

            except Exception as e:
                raise VideoGenerationError(
                    f"Audio generation failed for scene {i}: {str(e)}"
                ) from e

        # Log total video duration
        total_duration = sum(scene.duration for scene in scenes)
        print(f"[VideoGen] Total video duration after audio generation: {total_duration:.2f}s")

        return scenes

    def _create_video_segments(
        self,
        scenes: List[Scene],
        work_dir: Path
    ) -> List[VideoSegment]:
        """
        Convert scenes to video segments for compositor

        Args:
            scenes: List of scenes with audio
            work_dir: Working directory

        Returns:
            List of VideoSegment objects
        """
        segments = []

        for scene in scenes:
            # Validate scene has required data
            if not scene.audio_file:
                raise VideoGenerationError(f"Scene missing audio file: {scene.text[:50]}")
            if not scene.image_path:
                raise VideoGenerationError(f"Scene missing image path: {scene.text[:50]}")

            # Create video segment
            segment = VideoSegment(
                audio_file=scene.audio_file,
                image_file=scene.image_path,
                duration=scene.duration,
                transition_type=scene.transition_type
            )
            segments.append(segment)

        return segments

    def _compose_final_video(
        self,
        segments: List[VideoSegment],
        video_id: str,
        request: VideoRequest,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> str:
        """
        Compose final video from segments

        Args:
            segments: List of video segments
            video_id: Unique video ID
            request: VideoRequest
            progress_callback: Progress callback

        Returns:
            Path to final video file
        """
        # Create output directory
        output_dir = Path(self.OUTPUT_BASE_DIR) / video_id
        output_dir.mkdir(parents=True, exist_ok=True)

        output_path = output_dir / f"{video_id}.mp4"

        # Configure compositor with user's selected aspect ratio
        # Use user's selected aspect_ratio if provided, otherwise derive from platform
        aspect_ratio = request.aspect_ratio or self._get_aspect_ratio(request.platform)
        resolution = self._get_resolution_for_aspect_ratio(aspect_ratio)

        print(f"\n[VideoGen] ===== VIDEO COMPOSITION CONFIG =====")
        print(f"[VideoGen] Aspect ratio for composition: {aspect_ratio}")
        print(f"[VideoGen] Calculated resolution: {resolution}")

        config = CompositionConfig(
            resolution=resolution,
            fps=30,
            codec="libx264",
            audio_codec="aac",
            preset="medium",
            aspect_ratio=aspect_ratio
        )

        print(f"[VideoGen] CompositionConfig created: resolution={config.resolution}, aspect_ratio={config.aspect_ratio}")

        # Compose video
        try:
            def compositor_progress(progress: float):
                # Map compositor progress (0.8 to 0.95)
                overall_progress = 0.80 + (progress * 0.15)
                self._update_progress(progress_callback, overall_progress, "Rendering video...")

            result_path = self.compositor.compose_video(
                segments,
                str(output_path),
                config,
                progress_callback=compositor_progress
            )

            return result_path

        except CompositionError as e:
            raise VideoGenerationError(f"Video composition failed: {str(e)}") from e

    def _generate_thumbnail(self, video_path: str, video_id: str) -> str:
        """
        Generate thumbnail from video

        Args:
            video_path: Path to video file
            video_id: Video ID

        Returns:
            Path to thumbnail image
        """
        output_dir = Path(video_path).parent
        thumbnail_path = output_dir / f"{video_id}_thumbnail.jpg"

        # Use FFmpeg to extract frame at 1 second
        try:
            import subprocess
            cmd = [
                'ffmpeg',
                '-i', video_path,
                '-ss', '1',  # Seek to 1 second
                '-vframes', '1',  # Extract 1 frame
                '-vf', 'scale=640:360',  # Scale to thumbnail size
                str(thumbnail_path)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0 or not thumbnail_path.exists():
                # Create placeholder thumbnail if extraction fails
                self._create_placeholder_thumbnail(str(thumbnail_path))

            return str(thumbnail_path)

        except Exception:
            # Create placeholder on any error
            self._create_placeholder_thumbnail(str(thumbnail_path))
            return str(thumbnail_path)

    def _get_video_metadata(
        self,
        video_path: str,
        request: VideoRequest
    ) -> Dict[str, Any]:
        """
        Get video metadata

        Args:
            video_path: Path to video file
            request: Original request

        Returns:
            Metadata dictionary
        """
        import subprocess

        # Get file size
        file_size = Path(video_path).stat().st_size

        # Try to get duration from FFmpeg
        try:
            cmd = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            duration = float(result.stdout.strip()) if result.returncode == 0 else request.duration
        except Exception:
            duration = request.duration or 30

        # Get resolution based on user's selected aspect ratio
        aspect_ratio = request.aspect_ratio or self._get_aspect_ratio(request.platform)
        resolution = self._get_resolution_for_aspect_ratio(aspect_ratio)

        return {
            "file_size": file_size,
            "duration": duration,
            "format": "mp4",
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "platform": request.platform,
            "created_at": datetime.utcnow().isoformat()
        }

    def _get_aspect_ratio(self, platform: str) -> str:
        """Get aspect ratio for platform"""
        platform_configs = {
            "tiktok": "9:16",
            "youtube": "16:9",
            "youtube_shorts": "9:16",
            "instagram_reels": "9:16",
            "instagram_stories": "9:16",
            "facebook": "16:9"
        }
        return platform_configs.get(platform, "16:9")

    def _get_resolution(self, platform: str) -> str:
        """Get resolution for platform (deprecated - use _get_resolution_for_aspect_ratio)"""
        platform_configs = {
            "tiktok": "1080x1920",
            "youtube": "1920x1080",
            "youtube_shorts": "1080x1920",
            "instagram_reels": "1080x1920",
            "instagram_stories": "1080x1920",
            "facebook": "1920x1080"
        }
        return platform_configs.get(platform, "1920x1080")

    def _get_resolution_for_aspect_ratio(self, aspect_ratio: str) -> str:
        """
        Get resolution based on aspect ratio

        Args:
            aspect_ratio: Aspect ratio string (e.g., "16:9", "9:16", "1:1")

        Returns:
            Resolution string (e.g., "1920x1080", "1080x1920", "1080x1080")
        """
        resolution_map = {
            "16:9": "1920x1080",  # Landscape (YouTube, Facebook)
            "9:16": "1080x1920",  # Vertical/Portrait (TikTok, Instagram Reels)
            "1:1": "1080x1080",   # Square (Instagram Feed)
            "4:5": "1080x1350",   # Instagram Portrait
            "4:3": "1440x1080",   # Classic
            "21:9": "2560x1080"   # Ultrawide
        }
        return resolution_map.get(aspect_ratio, "1920x1080")

    def _update_progress(
        self,
        callback: Optional[Callable[[float, str], None]],
        progress: float,
        status: str
    ):
        """Update progress via callback"""
        if callback:
            callback(progress, status)


    def _create_placeholder_thumbnail(self, output_path: str):
        """
        Create placeholder thumbnail image

        Args:
            output_path: Output thumbnail path
        """
        from PIL import Image, ImageDraw, ImageFont

        # Create a simple thumbnail
        img = Image.new('RGB', (640, 360), color=(73, 109, 137))
        draw = ImageDraw.Draw(img)

        # Add text
        text = "ScriptSensei\nVideo"
        draw.text((320, 180), text, fill=(255, 255, 255), anchor="mm")

        img.save(output_path, 'JPEG')

    def _add_subtitles_to_video(
        self,
        video_path: str,
        request: VideoRequest,
        scenes: List[Scene],
        video_id: str
    ) -> str:
        """
        Add subtitles to the final video

        Args:
            video_path: Path to video without subtitles
            request: VideoRequest with subtitle configuration
            scenes: List of scenes with timing information
            video_id: Video ID

        Returns:
            Path to video with subtitles
        """
        try:
            print(f"\n[VideoGen] ===== ADDING SUBTITLES =====")
            print(f"[VideoGen] Video: {video_path}")
            print(f"[VideoGen] Number of scenes: {len(scenes)}")

            # Extract full script text from all scenes
            full_script = " ".join(scene.text for scene in scenes)
            print(f"[VideoGen] Full script length: {len(full_script)} characters")

            # Calculate total video duration
            total_duration = sum(scene.duration for scene in scenes)
            print(f"[VideoGen] Total video duration: {total_duration:.2f}s")

            # Generate subtitle segments for each scene with proper timing offset
            all_segments = []
            current_time = 0.0

            for i, scene in enumerate(scenes):
                # Generate subtitles for this scene
                scene_segments = self.subtitle_generator.generate_subtitles(
                    audio_file=scene.audio_file,
                    text=scene.text,
                    words_per_subtitle=getattr(request, 'subtitle_words_per_line', 5),
                    style=getattr(request, 'subtitle_style', 'standard')
                )

                # Adjust timing with offset for this scene
                for segment in scene_segments:
                    segment.start_time += current_time
                    segment.end_time += current_time
                    all_segments.append(segment)

                current_time += scene.duration
                print(f"[VideoGen] Scene {i+1}: {len(scene_segments)} subtitle segments, offset: {current_time:.2f}s")

            print(f"[VideoGen] Total subtitle segments: {len(all_segments)}")

            # Create output directory for subtitles
            subtitle_dir = Path(video_path).parent / "subtitles"
            subtitle_dir.mkdir(exist_ok=True)

            # Determine subtitle style based on platform
            subtitle_style = self._get_subtitle_style(request.platform)

            # Save subtitles to ASS file (best quality with styling)
            subtitle_file = subtitle_dir / f"{video_id}.ass"
            self.subtitle_generator.save_subtitles(
                segments=all_segments,
                output_file=str(subtitle_file),
                format="ass",
                style=subtitle_style
            )
            print(f"[VideoGen] Subtitle file saved: {subtitle_file}")

            # Create output path for video with subtitles
            output_dir = Path(video_path).parent
            video_with_subs = output_dir / f"{video_id}_with_subtitles.mp4"

            # Add subtitles to video
            self.compositor.add_subtitles(
                video_path=video_path,
                subtitle_file=str(subtitle_file),
                output_path=str(video_with_subs),
                style="bottom"
            )

            # Replace original video with subtitled version
            shutil.move(str(video_with_subs), video_path)
            print(f"[VideoGen] Subtitles added successfully")

            return video_path

        except Exception as e:
            print(f"[VideoGen] Warning: Subtitle generation failed: {e}")
            print(f"[VideoGen] Continuing without subtitles...")
            # Return original video path if subtitle generation fails
            return video_path

    def _get_subtitle_style(self, platform: str) -> SubtitleStyle:
        """
        Get subtitle style configuration for platform

        Args:
            platform: Target platform (tiktok, youtube, instagram, etc.)

        Returns:
            SubtitleStyle configuration
        """
        # Platform-specific subtitle styles
        platform_styles = {
            "tiktok": SubtitleStyle(
                font_name="Arial Black",
                font_size=72,
                primary_color="&H00FFFFFF",  # White
                outline_color="&H00000000",  # Black outline
                background_color="&H00000000",  # No background
                bold=True,
                alignment=8  # Top center (TikTok style)
            ),
            "youtube": SubtitleStyle(
                font_name="Arial",
                font_size=48,
                primary_color="&H00FFFFFF",  # White
                outline_color="&H00000000",  # Black outline
                background_color="&H80000000",  # Semi-transparent black
                bold=True,
                alignment=2  # Bottom center (YouTube style)
            ),
            "instagram": SubtitleStyle(
                font_name="Arial Black",
                font_size=56,
                primary_color="&H00FFFFFF",  # White
                outline_color="&H00000000",  # Black outline
                background_color="&H00000000",  # No background
                bold=True,
                alignment=2  # Bottom center
            ),
        }

        # Return platform-specific style or default YouTube style
        return platform_styles.get(platform, platform_styles["youtube"])
