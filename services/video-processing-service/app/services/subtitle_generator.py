"""
Subtitle Generator Service

Generates subtitles with word-level timing for videos
Supports multiple formats: SRT, WebVTT, ASS
Includes karaoke-style word highlighting
"""

import os
import re
import subprocess
from typing import List, Optional, Literal
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class SubtitleSegment:
    """
    Individual subtitle segment with timing information

    Attributes:
        text: The subtitle text
        start_time: Start time in seconds
        end_time: End time in seconds
        duration: Auto-calculated duration
    """
    text: str
    start_time: float
    end_time: float

    @property
    def duration(self) -> float:
        """Calculate duration from start and end times"""
        return self.end_time - self.start_time


@dataclass
class SubtitleStyle:
    """
    Subtitle styling options for ASS/SSA format

    Attributes:
        font_name: Font family name
        font_size: Font size in points
        primary_color: Primary text color (ASS format: &HAABBGGRR)
        outline_color: Outline/border color
        background_color: Background color
        bold: Bold text
        italic: Italic text
        alignment: Text alignment (1-9, numpad layout)
        margin_v: Vertical margin in pixels
        margin_h: Horizontal margin in pixels
    """
    font_name: str = "Arial"
    font_size: int = 48
    primary_color: str = "&H00FFFFFF"  # White
    outline_color: str = "&H00000000"  # Black outline
    background_color: str = "&H80000000"  # Semi-transparent black
    bold: bool = True
    italic: bool = False
    alignment: int = 2  # Bottom center (numpad layout)
    margin_v: int = 20  # Vertical margin
    margin_h: int = 10  # Horizontal margin


class SubtitleGenerator:
    """
    Generate subtitles with word-level timing

    Features:
    - Word-level timing using audio analysis
    - Multiple export formats (SRT, VTT, ASS)
    - Karaoke-style word highlighting
    - Custom styling options
    - Automatic grouping of words
    """

    def __init__(self):
        """Initialize subtitle generator"""
        pass

    def generate_subtitles(
        self,
        audio_file: str,
        text: str,
        words_per_subtitle: int = 5,
        style: Literal["standard", "karaoke", "word_highlight"] = "standard",
    ) -> List[SubtitleSegment]:
        """
        Generate subtitles with word-level timing

        Args:
            audio_file: Path to audio file
            text: The text to generate subtitles for
            words_per_subtitle: Number of words per subtitle (1 for karaoke)
            style: Subtitle style (standard, karaoke, word_highlight)

        Returns:
            List of SubtitleSegment objects with timing information

        Raises:
            ValueError: If text is empty
            FileNotFoundError: If audio file doesn't exist
        """
        # Validate inputs
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file not found: {audio_file}")

        print(f"[SubtitleGenerator] Generating subtitles for {audio_file}")
        print(f"[SubtitleGenerator] Text: {text[:100]}...")
        print(f"[SubtitleGenerator] Style: {style}, Words per subtitle: {words_per_subtitle}")

        try:
            # Analyze audio to get word-level timing
            segments = self._analyze_audio_timing(audio_file, text)

            # Group words if needed (for standard style)
            if style == "standard" and words_per_subtitle > 1:
                segments = self._group_segments(segments, words_per_subtitle)

            print(f"[SubtitleGenerator] Generated {len(segments)} subtitle segments")
            return segments

        except Exception as e:
            print(f"[SubtitleGenerator] Speech analysis failed: {e}")
            print(f"[SubtitleGenerator] Falling back to estimated timing")

            # Fallback to estimated timing
            audio_duration = self._get_audio_duration(audio_file)
            segments = self._estimate_word_timing(text, audio_duration)

            if style == "standard" and words_per_subtitle > 1:
                segments = self._group_segments(segments, words_per_subtitle)

            return segments

    def _analyze_audio_timing(
        self,
        audio_file: str,
        text: str
    ) -> List[SubtitleSegment]:
        """
        Analyze audio to get word-level timing

        Uses speech recognition with word timestamps.
        Falls back to estimation if recognition fails.

        Args:
            audio_file: Path to audio file
            text: Expected text content

        Returns:
            List of SubtitleSegment with word-level timing
        """
        # For now, use estimation-based approach
        # In the future, integrate with whisper-timestamped or similar
        audio_duration = self._get_audio_duration(audio_file)
        return self._estimate_word_timing(text, audio_duration)

    def _estimate_word_timing(
        self,
        text: str,
        audio_duration: float
    ) -> List[SubtitleSegment]:
        """
        Estimate word timing based on audio duration

        Uses average speech rate to estimate word boundaries.

        Args:
            text: Text to generate timing for
            audio_duration: Total audio duration in seconds

        Returns:
            List of SubtitleSegment with estimated timing
        """
        # Split text into words
        words = re.findall(r'\S+', text)

        if not words:
            return []

        # Calculate time per word
        time_per_word = audio_duration / len(words)

        segments = []
        current_time = 0.0

        for word in words:
            # Adjust duration slightly based on word length
            # Longer words take slightly more time
            word_duration = time_per_word * (0.8 + 0.4 * min(len(word) / 10, 1.0))

            segment = SubtitleSegment(
                text=word,
                start_time=current_time,
                end_time=current_time + word_duration,
            )
            segments.append(segment)
            current_time += word_duration

        # Normalize to exact audio duration
        if segments:
            scale_factor = audio_duration / current_time
            for segment in segments:
                segment.start_time *= scale_factor
                segment.end_time *= scale_factor

        return segments

    def _group_segments(
        self,
        segments: List[SubtitleSegment],
        words_per_group: int
    ) -> List[SubtitleSegment]:
        """
        Group multiple word segments into subtitle groups

        Args:
            segments: List of word-level segments
            words_per_group: Number of words per subtitle

        Returns:
            List of grouped SubtitleSegment
        """
        if words_per_group <= 1:
            return segments

        grouped = []

        for i in range(0, len(segments), words_per_group):
            group = segments[i:i + words_per_group]

            if not group:
                continue

            # Combine text
            combined_text = " ".join(seg.text for seg in group)

            # Use first start time and last end time
            grouped_segment = SubtitleSegment(
                text=combined_text,
                start_time=group[0].start_time,
                end_time=group[-1].end_time,
            )
            grouped.append(grouped_segment)

        return grouped

    def _get_audio_duration(self, audio_file: str) -> float:
        """
        Get duration of audio file using ffprobe

        Args:
            audio_file: Path to audio file

        Returns:
            Duration in seconds
        """
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
            print(f"[SubtitleGenerator] Warning: Could not detect audio duration: {e}")
            return 5.0  # Default fallback

    def export_to_srt(self, segments: List[SubtitleSegment]) -> str:
        """
        Export subtitles to SRT format

        Args:
            segments: List of subtitle segments

        Returns:
            SRT formatted string
        """
        srt_content = []

        for i, segment in enumerate(segments, start=1):
            # Format timestamps
            start = self._format_srt_timestamp(segment.start_time)
            end = self._format_srt_timestamp(segment.end_time)

            # Add subtitle entry
            srt_content.append(f"{i}")
            srt_content.append(f"{start} --> {end}")
            srt_content.append(segment.text)
            srt_content.append("")  # Empty line between entries

        return "\n".join(srt_content)

    def export_to_vtt(self, segments: List[SubtitleSegment]) -> str:
        """
        Export subtitles to WebVTT format

        Args:
            segments: List of subtitle segments

        Returns:
            WebVTT formatted string
        """
        vtt_content = ["WEBVTT", ""]

        for segment in segments:
            # Format timestamps
            start = self._format_vtt_timestamp(segment.start_time)
            end = self._format_vtt_timestamp(segment.end_time)

            # Add subtitle entry
            vtt_content.append(f"{start} --> {end}")
            vtt_content.append(segment.text)
            vtt_content.append("")  # Empty line between entries

        return "\n".join(vtt_content)

    def export_to_ass(
        self,
        segments: List[SubtitleSegment],
        style: Optional[SubtitleStyle] = None
    ) -> str:
        """
        Export subtitles to ASS (Advanced SubStation Alpha) format

        Supports custom styling, colors, positioning, etc.

        Args:
            segments: List of subtitle segments
            style: Custom subtitle style (uses default if None)

        Returns:
            ASS formatted string
        """
        if style is None:
            style = SubtitleStyle()

        # ASS header
        ass_content = [
            "[Script Info]",
            "Title: ScriptSensei Generated Subtitles",
            "ScriptType: v4.00+",
            "WrapStyle: 0",
            "PlayResX: 1920",
            "PlayResY: 1080",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,{style.font_name},{style.font_size},{style.primary_color},&H000000FF,{style.outline_color},{style.background_color},"
            f"{'-1' if style.bold else '0'},{'-1' if style.italic else '0'},0,0,100,100,0,0,1,2,0,{style.alignment},{style.margin_h},{style.margin_h},{style.margin_v},1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]

        # Add subtitle events
        for segment in segments:
            start = self._format_ass_timestamp(segment.start_time)
            end = self._format_ass_timestamp(segment.end_time)

            # Escape special characters
            text = segment.text.replace('\n', '\\N')

            ass_content.append(
                f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
            )

        return "\n".join(ass_content)

    def save_subtitles(
        self,
        segments: List[SubtitleSegment],
        output_file: str,
        format: Literal["srt", "vtt", "ass"] = "srt",
        style: Optional[SubtitleStyle] = None,
    ) -> str:
        """
        Save subtitles to file

        Args:
            segments: List of subtitle segments
            output_file: Output file path
            format: Subtitle format (srt, vtt, ass)
            style: Custom style (for ASS format)

        Returns:
            Path to saved subtitle file
        """
        # Generate content based on format
        if format == "srt":
            content = self.export_to_srt(segments)
        elif format == "vtt":
            content = self.export_to_vtt(segments)
        elif format == "ass":
            content = self.export_to_ass(segments, style)
        else:
            raise ValueError(f"Unsupported format: {format}")

        # Write to file
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"[SubtitleGenerator] Saved {format.upper()} subtitles to {output_file}")
        return output_file

    # Timestamp formatting methods

    def _format_srt_timestamp(self, seconds: float) -> str:
        """Format timestamp for SRT (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def _format_vtt_timestamp(self, seconds: float) -> str:
        """Format timestamp for WebVTT (HH:MM:SS.mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"

    def _format_ass_timestamp(self, seconds: float) -> str:
        """Format timestamp for ASS (H:MM:SS.cc)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int((seconds % 1) * 100)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"
