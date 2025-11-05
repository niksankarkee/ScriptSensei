"""
FFmpeg Video Compositor

Handles video composition using FFmpeg
Implemented to make tests pass (TDD - GREEN phase)
"""

import os
import subprocess
import shutil
import re
import random
from typing import List, Optional, Callable
from dataclasses import dataclass, field
from pathlib import Path


class CompositionError(Exception):
    """Exception raised when video composition fails"""
    pass


@dataclass
class VideoSegment:
    """
    Represents a single video segment to be composed

    Attributes:
        audio_file: Path to audio file
        image_file: Path to image/video file
        duration: Duration in seconds
        transition_type: Type of transition to next segment
    """
    audio_file: str
    image_file: str
    duration: float
    transition_type: str = "cut"

    VALID_TRANSITIONS = ["fade", "cut", "dissolve", "slide", "wipe", "zoom"]

    def __post_init__(self):
        """Validate segment parameters"""
        # Check if files exist
        if not os.path.exists(self.audio_file):
            raise FileNotFoundError(f"Audio file not found: {self.audio_file}")
        if not os.path.exists(self.image_file):
            raise FileNotFoundError(f"Image file not found: {self.image_file}")

        # Validate transition type
        if self.transition_type not in self.VALID_TRANSITIONS:
            raise ValueError(f"Unsupported transition: {self.transition_type}")

        # Validate duration
        if self.duration <= 0:
            raise ValueError("Duration must be positive")


@dataclass
class CompositionConfig:
    """
    Configuration for video composition

    Attributes:
        resolution: Video resolution (e.g., "1920x1080")
        fps: Frames per second
        codec: Video codec
        audio_codec: Audio codec
        bitrate: Video bitrate
        audio_bitrate: Audio bitrate
        aspect_ratio: Aspect ratio (e.g., "16:9", "9:16", "1:1")
    """
    resolution: str = "1920x1080"
    fps: int = 30
    codec: str = "libx264"
    audio_codec: str = "aac"
    bitrate: str = "2M"
    audio_bitrate: str = "192k"
    preset: str = "medium"
    crf: int = 23  # Constant Rate Factor (quality: 0-51, lower is better)
    aspect_ratio: str = "16:9"  # Default to landscape

    def __post_init__(self):
        """Validate configuration"""
        # Validate resolution format
        if not re.match(r'^\d+x\d+$', self.resolution):
            raise ValueError(f"Invalid resolution format: {self.resolution}. Expected format: WIDTHxHEIGHT")

        # Validate FPS
        if self.fps <= 0:
            raise ValueError("FPS must be positive")

        # Validate CRF
        if not 0 <= self.crf <= 51:
            raise ValueError("CRF must be between 0 and 51")


class FFmpegCompositor:
    """
    FFmpeg-based video compositor

    Handles composition of video segments into final videos
    with support for transitions, audio sync, and platform optimization
    """

    def __init__(self):
        """Initialize FFmpeg compositor"""
        self._check_ffmpeg()

    def _check_ffmpeg(self):
        """Check if FFmpeg is available"""
        if not self.ffmpeg_available():
            raise RuntimeError(
                "FFmpeg is not installed or not available in PATH. "
                "Please install FFmpeg: brew install ffmpeg"
            )

    def ffmpeg_available(self) -> bool:
        """
        Check if FFmpeg is installed and available

        Returns:
            True if FFmpeg is available, False otherwise
        """
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def compose_segment(
        self,
        segment: VideoSegment,
        output_path: str,
        config: CompositionConfig,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> str:
        """
        Compose a single video segment

        Args:
            segment: VideoSegment to compose
            output_path: Path for output video file
            config: CompositionConfig for rendering
            progress_callback: Optional callback for progress updates

        Returns:
            Path to composed video file

        Raises:
            CompositionError: If composition fails
        """
        # Build FFmpeg command
        command = self._build_segment_command(segment, output_path, config)

        # Execute FFmpeg
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode != 0:
                error_msg = result.stderr if result.stderr else "Unknown FFmpeg error"
                raise CompositionError(f"FFmpeg failed: {error_msg}")

            # Verify output file was created
            if not os.path.exists(output_path):
                raise CompositionError(f"Output file not created: {output_path}")

            # Call progress callback if provided
            if progress_callback:
                progress_callback(1.0)  # 100% complete

            return output_path

        except subprocess.TimeoutExpired:
            raise CompositionError("FFmpeg process timed out")
        except Exception as e:
            raise CompositionError(f"Composition failed: {str(e)}")

    def compose_video(
        self,
        segments: List[VideoSegment],
        output_path: str,
        config: CompositionConfig,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> str:
        """
        Compose multiple video segments into a single video

        Args:
            segments: List of VideoSegment objects
            output_path: Path for final output video
            config: CompositionConfig for rendering
            progress_callback: Optional callback for progress updates

        Returns:
            Path to composed video file

        Raises:
            CompositionError: If composition fails
            ValueError: If segments list is empty
        """
        if not segments:
            raise ValueError("segments cannot be empty")

        # If only one segment, compose it directly
        if len(segments) == 1:
            return self.compose_segment(segments[0], output_path, config, progress_callback)

        # Create temporary directory for intermediate files
        temp_dir = Path(output_path).parent / "temp_segments"
        temp_dir.mkdir(exist_ok=True)

        try:
            # Compose each segment individually
            segment_files = []
            for i, segment in enumerate(segments):
                temp_output = temp_dir / f"segment_{i:03d}.mp4"
                self.compose_segment(segment, str(temp_output), config)
                segment_files.append(str(temp_output))

                # Update progress
                if progress_callback:
                    progress = (i + 1) / (len(segments) + 1)  # Reserve last part for concatenation
                    progress_callback(progress)

            # Concatenate all segments with transitions
            self._concatenate_segments(segment_files, output_path, segments, config)

            # Final progress update
            if progress_callback:
                progress_callback(1.0)

            return output_path

        finally:
            # Cleanup temporary files
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

    def _get_ken_burns_filter(self, width: int, height: int, duration: float) -> str:
        """
        Generate Ken Burns effect (zoom + pan) filter for dynamic image animation

        Creates professional-looking motion on static images similar to TikTok/YouTube videos

        Args:
            width: Video width in pixels
            height: Video height in pixels
            duration: Duration in seconds

        Returns:
            FFmpeg zoompan filter string

        Motion Types:
        - zoom_in: Gradual zoom into the image (40% enlargement)
        - zoom_out: Start zoomed, zoom out to full image
        - pan_right: Smooth pan from left to right
        - pan_left: Smooth pan from right to left
        - zoom_pan: Combined zoom and pan for dynamic effect
        """
        # Choose random motion type for variety
        motion_types = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left', 'zoom_pan']
        motion = random.choice(motion_types)

        # Calculate frames (assuming 30fps)
        fps = 30
        total_frames = int(duration * fps)

        if motion == 'zoom_in':
            # Zoom in: scale from 1.0 to 1.4 (40% zoom)
            return f"zoompan=z='min(zoom+0.0015,1.4)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height}"

        elif motion == 'zoom_out':
            # Zoom out: scale from 1.4 to 1.0
            return f"zoompan=z='if(lte(zoom,1.0),1.0,max(1.0,zoom-0.0015))':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height}"

        elif motion == 'pan_right':
            # Pan from left to right
            return f"zoompan=z='1.3':d={total_frames}:x='iw*(on/{total_frames})':y='0':s={width}x{height}"

        elif motion == 'pan_left':
            # Pan from right to left
            return f"zoompan=z='1.3':d={total_frames}:x='iw-iw*(on/{total_frames})':y='0':s={width}x{height}"

        else:  # zoom_pan (combined)
            # Zoom in while panning diagonally
            return f"zoompan=z='min(zoom+0.0015,1.3)':d={total_frames}:x='iw/2-(iw/zoom/2)+sin(on/{total_frames}*2*PI)*100':y='ih/2-(ih/zoom/2)+cos(on/{total_frames}*2*PI)*100':s={width}x{height}"

    def _build_segment_command(
        self,
        segment: VideoSegment,
        output_path: str,
        config: CompositionConfig
    ) -> List[str]:
        """
        Build FFmpeg command for composing a single segment

        Args:
            segment: VideoSegment to compose
            output_path: Path for output file
            config: CompositionConfig

        Returns:
            List of command arguments for subprocess
        """
        print(f"\n[FFmpeg] ===== BUILDING SEGMENT COMMAND =====")
        print(f"[FFmpeg] Config resolution: {config.resolution}")
        print(f"[FFmpeg] Config aspect_ratio: {config.aspect_ratio}")

        # Parse resolution
        width, height = map(int, config.resolution.split('x'))
        print(f"[FFmpeg] Parsed width x height: {width} x {height}")

        # Generate Ken Burns effect for dynamic motion
        ken_burns_filter = self._get_ken_burns_filter(width, height, segment.duration)

        # Build FFmpeg command with Ken Burns effect
        # -loop 1: Loop the image (required for zoompan)
        # -i: Input image
        # -i: Input audio
        # -vf: Video filter with Ken Burns effect (zoom/pan)
        # -c:v: Video codec
        # -t: Duration
        # -pix_fmt: Pixel format (yuv420p for compatibility)
        # -shortest: End when shortest input ends
        command = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-loop', '1',  # Loop the image (required for zoompan)
            '-i', segment.image_file,  # Input image
            '-i', segment.audio_file,  # Input audio
            '-vf', ken_burns_filter,  # Ken Burns effect (zoom + pan)
            '-c:v', config.codec,  # Video codec
            '-t', str(segment.duration),  # Duration
            '-pix_fmt', 'yuv420p',  # Pixel format
            '-c:a', config.audio_codec,  # Audio codec
            '-b:a', config.audio_bitrate,  # Audio bitrate
            '-b:v', config.bitrate,  # Video bitrate
            '-preset', config.preset,  # Encoding preset
            '-crf', str(config.crf),  # Quality
            '-r', str(config.fps),  # Frame rate
            '-shortest',  # End when shortest input ends
            output_path
        ]

        return command

    def _concatenate_segments(
        self,
        segment_files: List[str],
        output_path: str,
        segments: List[VideoSegment],
        config: CompositionConfig
    ) -> None:
        """
        Concatenate multiple video segments with smooth crossfade transitions

        Args:
            segment_files: List of paths to segment video files
            output_path: Path for final output
            segments: Original segment objects (for transition info)
            config: CompositionConfig
        """
        # If only one segment, just copy it
        if len(segment_files) == 1:
            shutil.copy2(segment_files[0], output_path)
            return

        # Use xfade filter for smooth transitions between scenes
        # Transition duration: 0.5 seconds
        transition_duration = 0.5

        try:
            # Build complex filter chain with xfade transitions
            filter_parts = []
            offset = 0.0

            # Input all segments
            inputs = []
            for segment_file in segment_files:
                inputs.extend(['-i', segment_file])

            # Build xfade filter chain
            # For N segments, we need N-1 xfade filters
            current_stream = '[0:v]'
            current_audio = '[0:a]'

            for i in range(1, len(segment_files)):
                # Calculate offset (sum of previous durations minus transition)
                offset += segments[i-1].duration - transition_duration

                # Video crossfade
                next_stream = f'[v{i}]'
                filter_parts.append(
                    f'{current_stream}[{i}:v]xfade=transition=fade:duration={transition_duration}:offset={offset}{next_stream}'
                )
                current_stream = next_stream

                # Audio crossfade
                next_audio = f'[a{i}]'
                filter_parts.append(
                    f'{current_audio}[{i}:a]acrossfade=d={transition_duration}{next_audio}'
                )
                current_audio = next_audio

            # Final streams
            filter_parts.append(f'{current_stream}format=yuv420p[outv]')
            filter_parts.append(f'{current_audio}[outa]')

            # Combine filter parts
            filter_complex = ';'.join(filter_parts)

            # Build FFmpeg command with xfade transitions
            command = [
                'ffmpeg',
                '-y',
                *inputs,
                '-filter_complex', filter_complex,
                '-map', '[outv]',
                '-map', '[outa]',
                '-c:v', config.codec,
                '-c:a', config.audio_codec,
                '-preset', config.preset,
                '-crf', str(config.crf),
                output_path
            ]

            # Execute concatenation with transitions
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode != 0:
                print(f"Warning: xfade transition failed: {result.stderr}")
                print("Falling back to simple concatenation...")

                # Fallback to simple concatenation without transitions
                concat_file = Path(output_path).parent / "concat_list.txt"
                try:
                    with open(concat_file, 'w') as f:
                        for segment_file in segment_files:
                            f.write(f"file '{segment_file}'\n")

                    command = [
                        'ffmpeg',
                        '-y',
                        '-f', 'concat',
                        '-safe', '0',
                        '-i', str(concat_file),
                        '-c:v', config.codec,
                        '-c:a', config.audio_codec,
                        '-preset', config.preset,
                        output_path
                    ]

                    result = subprocess.run(
                        command,
                        capture_output=True,
                        text=True,
                        check=False
                    )

                    if result.returncode != 0:
                        raise CompositionError(f"Concatenation failed: {result.stderr}")
                finally:
                    if concat_file.exists():
                        concat_file.unlink()

        except Exception as e:
            raise CompositionError(f"Failed to concatenate segments: {str(e)}")
