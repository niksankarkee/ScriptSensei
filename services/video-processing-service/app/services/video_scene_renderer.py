"""
Video Scene Renderer

Converts scripts into visual scenes with appropriate images, timing,
and composition instructions for video generation.

Implemented to make tests pass (TDD - GREEN phase)
"""

import os
import re
import hashlib
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from pathlib import Path


class SceneGenerationError(Exception):
    """Exception raised when scene generation fails"""
    pass


@dataclass
class Scene:
    """
    Represents a single scene in the video

    Attributes:
        text: The text/narration for this scene
        duration: Duration in seconds
        image_path: Path to the image file for this scene
        transition_type: Transition effect to next scene
        start_time: Start time in the video (optional)
        end_time: End time in the video (optional)
        text_overlay: Text overlay configuration (optional)
        word_count: Number of words in the text (optional)
    """
    text: str
    duration: float = 0.0
    image_path: Optional[str] = None
    transition_type: str = "cut"
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    text_overlay: Optional[Dict[str, Any]] = None
    word_count: Optional[int] = None

    def __post_init__(self):
        """Calculate word count if not provided"""
        if self.word_count is None and self.text:
            self.word_count = len(self.text.split())


@dataclass
class SceneRenderConfig:
    """
    Configuration for scene rendering

    Attributes:
        min_scene_duration: Minimum duration for a scene (seconds)
        max_scene_duration: Maximum duration for a scene (seconds)
        default_transition: Default transition type
        image_style: Style for image selection (e.g., 'modern', 'classic')
        platform: Target platform (e.g., 'tiktok', 'youtube')
        aspect_ratio: Video aspect ratio (e.g., '16:9', '9:16')
        max_total_duration: Maximum total video duration (seconds)
        words_per_second: Average speaking rate for timing calculations
    """
    min_scene_duration: float = 2.0
    max_scene_duration: float = 10.0
    default_transition: str = "fade"
    image_style: str = "modern"
    platform: Optional[str] = None
    aspect_ratio: str = "16:9"
    max_total_duration: Optional[float] = None
    words_per_second: float = 2.5  # Average speaking rate

    def __post_init__(self):
        """Validate configuration"""
        if self.min_scene_duration <= 0:
            raise ValueError("min_scene_duration must be positive")
        if self.max_scene_duration < self.min_scene_duration:
            raise ValueError("max_scene_duration must be >= min_scene_duration")


class VideoSceneRenderer:
    """
    Video Scene Renderer

    Converts scripts into visual scenes with appropriate images, timing,
    and composition instructions.
    """

    # Default placeholder image path
    DEFAULT_PLACEHOLDER = "/tmp/placeholder.jpg"

    # Sentence splitting patterns for different languages
    SENTENCE_PATTERNS = {
        'en': r'[.!?]+\s+',  # English: period, exclamation, question mark
        'ja': r'[。！？]+',  # Japanese: Japanese punctuation
        'ne': r'[।॥?!]+\s*',  # Nepali: Devanagari punctuation
        'default': r'[.!?。！？।॥]+\s*'
    }

    def __init__(self, config: Optional[SceneRenderConfig] = None):
        """
        Initialize Video Scene Renderer

        Args:
            config: Optional SceneRenderConfig
        """
        self.config = config or SceneRenderConfig()
        self._scene_cache: Dict[str, List[Scene]] = {}

    def _clean_script_content(self, content: str) -> str:
        """
        Clean script content by removing markdown headers for video narration.

        The LLM generates scripts with:
        - Title (# or at top)
        - Section headings (##)
        - Narration text under each section

        For video generation, we only want the narration text (not the headers).
        Headers are kept in database for display, but stripped for TTS/video.

        Args:
            content: Raw script content with markdown headers

        Returns:
            Clean narration text without markdown headers
        """
        print(f"\n[ScriptCleaner] ===== SCRIPT CONTENT =====")
        print(f"[ScriptCleaner] Content length: {len(content)} chars")
        print(f"[ScriptCleaner] First 500 chars:\n{content[:500]}\n")

        # Remove markdown headers (# title and ## section)
        # Keep only the narration text
        lines = content.split('\n')
        cleaned_lines = []

        for line in lines:
            stripped = line.strip()
            # Skip markdown headers (lines starting with # or ##)
            if stripped.startswith('#'):
                continue
            # Keep all other non-empty lines (narration text)
            if stripped:
                cleaned_lines.append(stripped)

        cleaned_content = ' '.join(cleaned_lines)

        print(f"[ScriptCleaner] Cleaned length: {len(cleaned_content)} chars")
        print(f"[ScriptCleaner] First 300 chars after cleaning:\n{cleaned_content[:300]}\n")

        return cleaned_content.strip()

    def parse_script(self, script: Dict[str, Any]) -> List[Scene]:
        """
        Parse script text into individual scenes

        Args:
            script: Script dictionary with 'content', 'title', 'language', etc.

        Returns:
            List of Scene objects (without timing or images yet)

        Raises:
            ValueError: If script format is invalid
        """
        # Validate script format
        if not isinstance(script, dict):
            raise ValueError("Invalid script format: must be a dictionary")

        if 'content' not in script:
            raise ValueError("Invalid script format: missing 'content' field")

        content = script.get('content', '').strip()
        if not content:
            raise ValueError("Script content cannot be empty")

        # Clean the script content to remove production directions
        content = self._clean_script_content(content)

        if not content:
            raise ValueError("Script content is empty after cleaning production directions")

        language = script.get('language', 'en')

        # Split content into sentences/scenes
        pattern = self.SENTENCE_PATTERNS.get(language, self.SENTENCE_PATTERNS['default'])
        sentences = re.split(pattern, content)

        # Filter out empty sentences and create Scene objects
        scenes = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                scene = Scene(text=sentence)
                scenes.append(scene)

        return scenes

    def calculate_scene_timings(
        self,
        scenes: List[Scene],
        total_duration: float,
        config: Optional[SceneRenderConfig] = None
    ) -> List[Scene]:
        """
        Calculate appropriate duration for each scene

        Args:
            scenes: List of Scene objects
            total_duration: Target total duration in seconds
            config: Optional config override

        Returns:
            Scenes with durations assigned
        """
        cfg = config or self.config

        # Calculate total word count
        total_words = sum(scene.word_count or 0 for scene in scenes)

        if total_words == 0:
            # If no words, distribute evenly
            duration_per_scene = total_duration / len(scenes)
            for scene in scenes:
                scene.duration = max(cfg.min_scene_duration,
                                    min(cfg.max_scene_duration, duration_per_scene))
            return scenes

        # Allocate duration proportional to word count
        for scene in scenes:
            # Calculate duration based on word count and speaking rate
            word_ratio = (scene.word_count or 0) / total_words
            scene.duration = total_duration * word_ratio

        # First clamp to min/max bounds for each scene
        for scene in scenes:
            scene.duration = max(cfg.min_scene_duration,
                                min(cfg.max_scene_duration, scene.duration))

        # Adjust to match exact total duration (only if it doesn't violate constraints)
        current_total = sum(scene.duration for scene in scenes)
        if current_total != total_duration and abs(current_total - total_duration) > 0.1:
            # Scale proportionally, but re-clamp if needed
            scale_factor = total_duration / current_total
            for scene in scenes:
                scene.duration = scene.duration * scale_factor
                # Re-clamp after scaling
                scene.duration = max(cfg.min_scene_duration,
                                    min(cfg.max_scene_duration, scene.duration))

        # Calculate start and end times
        current_time = 0.0
        for scene in scenes:
            scene.start_time = current_time
            scene.end_time = current_time + scene.duration
            current_time = scene.end_time

        return scenes

    def assign_images_to_scenes(
        self,
        scenes: List[Scene],
        custom_images: Optional[List[str]] = None
    ) -> List[Scene]:
        """
        Assign images to each scene

        Args:
            scenes: List of Scene objects
            custom_images: Optional list of custom image paths

        Returns:
            Scenes with images assigned

        Raises:
            TimeoutError: If image fetching times out
        """
        if custom_images:
            # Use custom images provided by user
            for i, scene in enumerate(scenes):
                if i < len(custom_images):
                    scene.image_path = custom_images[i]
                else:
                    # Reuse images if not enough provided
                    scene.image_path = custom_images[i % len(custom_images)]
        else:
            # Use image provider to fetch images
            try:
                from app.services.image_provider import ImageProvider
                provider = ImageProvider()

                for scene in scenes:
                    try:
                        # Get image based on scene text
                        image_path = provider.get_image(scene.text)
                        scene.image_path = image_path
                    except TimeoutError:
                        # Re-raise timeout errors
                        raise
                    except Exception:
                        # Fallback to placeholder if provider fails
                        scene.image_path = self._get_placeholder_image()

            except ImportError:
                # If image provider doesn't exist, use placeholder
                for scene in scenes:
                    scene.image_path = self._get_placeholder_image()

        return scenes

    def _get_placeholder_image(self) -> str:
        """
        Get placeholder image path
        Creates a solid color placeholder image (no text)

        Returns:
            Path to placeholder image
        """
        from PIL import Image

        # Create placeholder if it doesn't exist
        placeholder_path = Path(self.DEFAULT_PLACEHOLDER)

        if not placeholder_path.exists():
            placeholder_path.parent.mkdir(parents=True, exist_ok=True)

            # Create a simple gradient background image (1920x1080)
            # Using solid colors without text to avoid "Placeholder Image" appearing in videos
            img = Image.new('RGB', (1920, 1080), color=(45, 55, 72))  # Dark blue-gray
            img.save(placeholder_path, 'JPEG', quality=95)

        return str(placeholder_path)

    def assign_transitions(
        self,
        scenes: List[Scene],
        transition_pattern: Optional[List[str]] = None
    ) -> List[Scene]:
        """
        Assign transition effects to scenes

        Args:
            scenes: List of Scene objects
            transition_pattern: Optional list of transition types to use

        Returns:
            Scenes with transitions assigned
        """
        valid_transitions = ["fade", "cut", "dissolve", "slide", "wipe", "zoom"]

        if transition_pattern:
            # Use provided pattern
            for i, scene in enumerate(scenes):
                scene.transition_type = transition_pattern[i % len(transition_pattern)]
        else:
            # Use default or alternate between fade and dissolve
            transitions = ["fade", "dissolve"]
            for i, scene in enumerate(scenes):
                scene.transition_type = transitions[i % len(transitions)]

        return scenes

    def add_text_overlays(
        self,
        scenes: List[Scene],
        font: str = "Arial",
        font_size: int = 48,
        color: str = "white",
        position: str = "bottom"
    ) -> List[Scene]:
        """
        Add text overlay configuration to scenes

        Args:
            scenes: List of Scene objects
            font: Font family
            font_size: Font size in points
            color: Text color
            position: Text position (e.g., 'top', 'center', 'bottom')

        Returns:
            Scenes with text overlay configuration
        """
        for scene in scenes:
            scene.text_overlay = {
                'text': scene.text,
                'font': font,
                'font_size': font_size,
                'color': color,
                'position': position
            }

        return scenes

    def validate_scenes(self, scenes: List[Scene]) -> bool:
        """
        Validate scene data before rendering

        Args:
            scenes: List of Scene objects

        Returns:
            True if valid

        Raises:
            SceneGenerationError: If validation fails
        """
        for i, scene in enumerate(scenes):
            # Check duration
            if scene.duration <= 0:
                raise SceneGenerationError(
                    f"Invalid scene duration at index {i}: {scene.duration}"
                )

            # Check image exists
            if scene.image_path and not os.path.exists(scene.image_path):
                raise SceneGenerationError(
                    f"Image file not found for scene {i}: {scene.image_path}"
                )

            # Check text
            if not scene.text:
                raise SceneGenerationError(f"Scene {i} has no text")

        return True

    def generate_scenes(
        self,
        script: Dict[str, Any],
        config: Optional[SceneRenderConfig] = None,
        timeout: Optional[float] = None
    ) -> List[Scene]:
        """
        Generate complete scenes from script (full pipeline)

        Args:
            script: Script dictionary
            config: Optional configuration override
            timeout: Optional timeout in seconds

        Returns:
            List of fully configured Scene objects

        Raises:
            SceneGenerationError: If generation fails
        """
        cfg = config or self.config

        # Check cache
        cache_key = self._get_cache_key(script)
        if cache_key in self._scene_cache:
            return self._scene_cache[cache_key]

        try:
            # 1. Parse script into scenes
            scenes = self.parse_script(script)

            # 2. Calculate timing
            target_duration = script.get('duration', 30.0)
            if cfg.max_total_duration:
                target_duration = min(target_duration, cfg.max_total_duration)

            scenes = self.calculate_scene_timings(scenes, target_duration, cfg)

            # 3. Optimize for platform if specified
            if cfg.platform:
                scenes = self._optimize_for_platform(scenes, cfg)

            # 4. Assign images
            try:
                scenes = self.assign_images_to_scenes(scenes)
            except TimeoutError as e:
                raise SceneGenerationError(f"Image assignment timeout: {str(e)}")

            # 5. Assign transitions
            scenes = self.assign_transitions(scenes)

            # Cache result
            self._scene_cache[cache_key] = scenes

            return scenes

        except TimeoutError as e:
            raise SceneGenerationError(f"Scene generation timeout: {str(e)}")
        except Exception as e:
            raise SceneGenerationError(f"Scene generation failed: {str(e)}")

    def _optimize_for_platform(
        self,
        scenes: List[Scene],
        config: SceneRenderConfig
    ) -> List[Scene]:
        """
        Optimize scenes for specific platform

        Args:
            scenes: List of Scene objects
            config: Configuration with platform settings

        Returns:
            Optimized scenes
        """
        platform = config.platform.lower()

        if platform == 'tiktok':
            # TikTok: shorter scenes, faster pacing
            for scene in scenes:
                scene.duration = min(scene.duration, 10.0)

        elif platform == 'youtube':
            # YouTube: can have longer scenes
            pass  # No special optimization needed

        return scenes

    def export_for_compositor(self, scenes: List[Scene]) -> List[Any]:
        """
        Export scenes in format suitable for FFmpeg compositor

        Args:
            scenes: List of Scene objects

        Returns:
            List of VideoSegment objects compatible with FFmpegCompositor
        """
        from app.services.ffmpeg_compositor import VideoSegment

        segments = []
        for scene in scenes:
            # Note: audio_file would need to be generated from text using TTS
            # For now, we'll use a placeholder
            segment = VideoSegment(
                audio_file=scene.image_path,  # Placeholder - should be TTS output
                image_file=scene.image_path,
                duration=scene.duration,
                transition_type=scene.transition_type
            )
            segments.append(segment)

        return segments

    def get_scene_statistics(self, scenes: List[Scene]) -> Dict[str, Any]:
        """
        Calculate statistics about generated scenes

        Args:
            scenes: List of Scene objects

        Returns:
            Dictionary with statistics
        """
        total_duration = sum(scene.duration for scene in scenes)
        avg_duration = total_duration / len(scenes) if scenes else 0

        # Count transition types
        transition_counts = {}
        for scene in scenes:
            transition = scene.transition_type
            transition_counts[transition] = transition_counts.get(transition, 0) + 1

        return {
            'total_scenes': len(scenes),
            'total_duration': total_duration,
            'average_scene_duration': avg_duration,
            'min_scene_duration': min(scene.duration for scene in scenes) if scenes else 0,
            'max_scene_duration': max(scene.duration for scene in scenes) if scenes else 0,
            'transition_types': transition_counts,
            'total_words': sum(scene.word_count or 0 for scene in scenes)
        }

    def _get_cache_key(self, script: Dict[str, Any]) -> str:
        """
        Generate cache key for script

        Args:
            script: Script dictionary

        Returns:
            Cache key string
        """
        # Create hash from script content and key parameters
        content = f"{script.get('content', '')}{script.get('duration', 30)}"
        return hashlib.md5(content.encode()).hexdigest()
