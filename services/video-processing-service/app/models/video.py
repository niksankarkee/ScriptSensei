from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from datetime import datetime


class VideoStatus(str, Enum):
    """Video processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoRequest(BaseModel):
    """Request model for video generation"""
    script_id: str = Field(..., description="Script ID from content service")
    script_content: str = Field(..., min_length=1, description="Script content to convert to video")
    platform: str = Field(..., description="Target platform (tiktok, youtube, instagram, etc.)")
    language: str = Field(default="en", description="Language code for audio generation")
    voice_id: Optional[str] = Field(None, description="Voice ID for TTS")
    voice_provider: str = Field(default="azure", description="Voice provider (azure, elevenlabs, google)")
    background_music: Optional[str] = Field(None, description="Background music track ID")
    visual_style: str = Field(default="stock", description="Visual style (stock, ai_generated, template)")
    aspect_ratio: str = Field(default="16:9", description="Video aspect ratio (9:16, 16:9, 1:1, 4:5)")
    resolution: str = Field(default="1080p", description="Video resolution (720p, 1080p, 4k)")
    user_id: Optional[str] = Field(None, description="User ID for tracking")
    title: Optional[str] = Field(None, description="Video title")
    duration: Optional[int] = Field(None, description="Target video duration in seconds")

    # Wizard additional fields
    template: Optional[str] = Field(None, description="Template ID")
    dialect: Optional[str] = Field(None, description="Language dialect")
    tone: Optional[str] = Field(None, description="Content tone (exciting, informative, relaxing, etc.)")
    purpose: Optional[str] = Field(None, description="Content purpose (promotion, education, vlog, etc.)")
    audience: Optional[str] = Field(None, description="Target audience (young adults, families, etc.)")
    script_style: Optional[str] = Field(None, description="Script writing style description")
    media_type: str = Field(default="stock", description="Media type (stock or ai)")
    use_avatar: bool = Field(default=False, description="Whether to use AI avatar")

    # Subtitle configuration
    enable_subtitles: bool = Field(default=True, description="Whether to add subtitles to video")
    subtitle_style: str = Field(default="standard", description="Subtitle style (standard, karaoke, word_highlight)")
    subtitle_words_per_line: int = Field(default=5, description="Number of words per subtitle line (1-10)")

    @validator('aspect_ratio')
    def validate_aspect_ratio(cls, v):
        """Validate aspect_ratio is one of the supported values"""
        valid_ratios = ['16:9', '9:16', '1:1', '4:5']
        if v not in valid_ratios:
            raise ValueError(f"aspect_ratio must be one of {valid_ratios}, got: {v}")
        return v


class VideoScene(BaseModel):
    """Individual scene in the video"""
    scene_number: int
    text: str
    duration: float
    visual_asset: Optional[str] = None
    transition: str = "fade"


class VideoResponse(BaseModel):
    """Response model for video generation"""
    id: str = Field(..., description="Video job ID")
    status: VideoStatus
    script_id: str
    script_content: str
    user_id: str
    platform: str
    language: str = "en"
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    file_size: Optional[int] = None
    scenes: Optional[List[VideoScene]] = None
    metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "vid_123abc",
                "status": "completed",
                "script_id": "script_456def",
                "user_id": "user_789ghi",
                "platform": "tiktok",
                "video_url": "https://cdn.example.com/videos/vid_123abc.mp4",
                "thumbnail_url": "https://cdn.example.com/thumbnails/vid_123abc.jpg",
                "duration": 30.5,
                "file_size": 5242880,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:05:00Z",
                "completed_at": "2024-01-01T00:05:00Z"
            }
        }


class VideoListResponse(BaseModel):
    """Response model for listing videos"""
    success: bool = True
    data: List[VideoResponse]
    pagination: Dict[str, int]
