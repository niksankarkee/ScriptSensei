"""
Library APIs for Audio, Voice, Avatar, and Media

Provides catalog endpoints for the interactive scene editor
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum

router = APIRouter(prefix="/api/v1", tags=["libraries"])


# Enums
class AudioCategory(str, Enum):
    MUSIC = "music"
    SOUND_EFFECT = "sound_effect"


class VoiceGender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class VoiceStyle(str, Enum):
    CONVERSATIONAL = "conversational"
    NARRATION = "narration"
    CHEERFUL = "cheerful"
    SERIOUS = "serious"
    CALM = "calm"


class AvatarGender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


# Response Models
class AudioItem(BaseModel):
    id: str
    title: str
    category: AudioCategory
    duration: float
    url: str
    thumbnail: str
    artist: Optional[str] = None
    tags: List[str] = []


class VoiceItem(BaseModel):
    id: str
    name: str
    language: str
    language_code: str
    gender: VoiceGender
    style: VoiceStyle
    sample_url: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class AvatarItem(BaseModel):
    id: str
    name: str
    gender: AvatarGender
    thumbnail: str
    video_url: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []


class MediaItem(BaseModel):
    id: str
    title: str
    type: MediaType
    url: str
    thumbnail: str
    width: int
    height: int
    duration: Optional[float] = None
    source: str  # stock, ai, uploaded
    tags: List[str] = []


# Mock Data Storage (In production, this would be in database)
AUDIO_LIBRARY = [
    {
        "id": "audio-001",
        "title": "Upbeat Corporate",
        "category": "music",
        "duration": 180.0,
        "url": "https://cdn.example.com/audio/upbeat-corporate.mp3",
        "thumbnail": "https://cdn.example.com/thumbnails/audio-001.jpg",
        "artist": "AudioHub",
        "tags": ["corporate", "upbeat", "motivational"]
    },
    {
        "id": "audio-002",
        "title": "Chill Lofi Beat",
        "category": "music",
        "duration": 240.0,
        "url": "https://cdn.example.com/audio/chill-lofi.mp3",
        "thumbnail": "https://cdn.example.com/thumbnails/audio-002.jpg",
        "artist": "LofiBeats",
        "tags": ["lofi", "chill", "relaxing"]
    },
    {
        "id": "audio-003",
        "title": "Epic Cinematic",
        "category": "music",
        "duration": 200.0,
        "url": "https://cdn.example.com/audio/epic-cinematic.mp3",
        "thumbnail": "https://cdn.example.com/thumbnails/audio-003.jpg",
        "artist": "CinematicSounds",
        "tags": ["epic", "cinematic", "dramatic"]
    },
    {
        "id": "audio-004",
        "title": "Success Notification",
        "category": "sound_effect",
        "duration": 2.5,
        "url": "https://cdn.example.com/audio/success-notification.mp3",
        "thumbnail": "https://cdn.example.com/thumbnails/audio-004.jpg",
        "tags": ["notification", "success", "ding"]
    },
    {
        "id": "audio-005",
        "title": "Whoosh Transition",
        "category": "sound_effect",
        "duration": 1.2,
        "url": "https://cdn.example.com/audio/whoosh.mp3",
        "thumbnail": "https://cdn.example.com/thumbnails/audio-005.jpg",
        "tags": ["transition", "whoosh", "swipe"]
    },
]

VOICE_LIBRARY = [
    {
        "id": "en-US-Neural2-A",
        "name": "Rose",
        "language": "English (US)",
        "language_code": "en-US",
        "gender": "female",
        "style": "conversational",
        "sample_url": "https://cdn.example.com/voices/rose-sample.mp3",
        "description": "Warm and friendly female voice",
        "avatar_url": "https://cdn.example.com/avatars/rose.jpg"
    },
    {
        "id": "en-US-Neural2-D",
        "name": "John",
        "language": "English (US)",
        "language_code": "en-US",
        "gender": "male",
        "style": "narration",
        "sample_url": "https://cdn.example.com/voices/john-sample.mp3",
        "description": "Deep and authoritative male voice",
        "avatar_url": "https://cdn.example.com/avatars/john.jpg"
    },
    {
        "id": "en-US-Neural2-F",
        "name": "Emma",
        "language": "English (US)",
        "language_code": "en-US",
        "gender": "female",
        "style": "cheerful",
        "sample_url": "https://cdn.example.com/voices/emma-sample.mp3",
        "description": "Bright and energetic female voice",
        "avatar_url": "https://cdn.example.com/avatars/emma.jpg"
    },
    {
        "id": "ja-JP-Neural2-B",
        "name": "Nanami",
        "language": "Japanese",
        "language_code": "ja-JP",
        "gender": "female",
        "style": "conversational",
        "sample_url": "https://cdn.example.com/voices/nanami-sample.mp3",
        "description": "Natural Japanese female voice",
        "avatar_url": "https://cdn.example.com/avatars/nanami.jpg"
    },
    {
        "id": "ja-JP-Neural2-C",
        "name": "Keita",
        "language": "Japanese",
        "language_code": "ja-JP",
        "gender": "male",
        "style": "narration",
        "sample_url": "https://cdn.example.com/voices/keita-sample.mp3",
        "description": "Professional Japanese male voice",
        "avatar_url": "https://cdn.example.com/avatars/keita.jpg"
    },
]

AVATAR_LIBRARY = [
    {
        "id": "avatar-amy",
        "name": "Amy",
        "gender": "female",
        "thumbnail": "https://cdn.example.com/avatars/amy-thumb.jpg",
        "video_url": "https://cdn.example.com/avatars/amy-preview.mp4",
        "description": "Professional business woman",
        "tags": ["business", "professional", "corporate"]
    },
    {
        "id": "avatar-alyssa",
        "name": "Alyssa",
        "gender": "female",
        "thumbnail": "https://cdn.example.com/avatars/alyssa-thumb.jpg",
        "video_url": "https://cdn.example.com/avatars/alyssa-preview.mp4",
        "description": "Friendly and approachable",
        "tags": ["casual", "friendly", "young"]
    },
    {
        "id": "avatar-anita",
        "name": "Anita",
        "gender": "female",
        "thumbnail": "https://cdn.example.com/avatars/anita-thumb.jpg",
        "video_url": "https://cdn.example.com/avatars/anita-preview.mp4",
        "description": "Mature and confident",
        "tags": ["mature", "confident", "executive"]
    },
    {
        "id": "avatar-alex",
        "name": "Alex",
        "gender": "male",
        "thumbnail": "https://cdn.example.com/avatars/alex-thumb.jpg",
        "video_url": "https://cdn.example.com/avatars/alex-preview.mp4",
        "description": "Tech-savvy presenter",
        "tags": ["tech", "casual", "young"]
    },
    {
        "id": "avatar-daniel",
        "name": "Daniel",
        "gender": "male",
        "thumbnail": "https://cdn.example.com/avatars/daniel-thumb.jpg",
        "video_url": "https://cdn.example.com/avatars/daniel-preview.mp4",
        "description": "Professional executive",
        "tags": ["business", "executive", "mature"]
    },
]

MEDIA_LIBRARY = [
    {
        "id": "media-001",
        "title": "Mountain Landscape",
        "type": "image",
        "url": "https://cdn.example.com/media/mountain.jpg",
        "thumbnail": "https://cdn.example.com/media/mountain-thumb.jpg",
        "width": 1920,
        "height": 1080,
        "source": "stock",
        "tags": ["nature", "mountain", "landscape"]
    },
    {
        "id": "media-002",
        "title": "City Skyline",
        "type": "image",
        "url": "https://cdn.example.com/media/city.jpg",
        "thumbnail": "https://cdn.example.com/media/city-thumb.jpg",
        "width": 1920,
        "height": 1080,
        "source": "stock",
        "tags": ["city", "urban", "skyline"]
    },
    {
        "id": "media-003",
        "title": "Ocean Waves",
        "type": "video",
        "url": "https://cdn.example.com/media/ocean.mp4",
        "thumbnail": "https://cdn.example.com/media/ocean-thumb.jpg",
        "width": 1920,
        "height": 1080,
        "duration": 15.0,
        "source": "stock",
        "tags": ["ocean", "water", "nature"]
    },
    {
        "id": "media-004",
        "title": "Tech Background",
        "type": "image",
        "url": "https://cdn.example.com/media/tech-bg.jpg",
        "thumbnail": "https://cdn.example.com/media/tech-bg-thumb.jpg",
        "width": 1920,
        "height": 1080,
        "source": "ai",
        "tags": ["technology", "abstract", "background"]
    },
    {
        "id": "media-005",
        "title": "Time Lapse City",
        "type": "video",
        "url": "https://cdn.example.com/media/timelapse-city.mp4",
        "thumbnail": "https://cdn.example.com/media/timelapse-thumb.jpg",
        "width": 1920,
        "height": 1080,
        "duration": 20.0,
        "source": "stock",
        "tags": ["timelapse", "city", "night"]
    },
]


# Audio Library Endpoints

@router.get("/audio/library")
async def get_audio_library(
    category: Optional[AudioCategory] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title or tags"),
    limit: int = Query(50, ge=1, le=100, description="Number of results")
):
    """
    Get audio library catalog

    Args:
        category: Filter by music or sound_effect
        search: Search term for title/tags
        limit: Maximum number of results

    Returns:
        List of audio items
    """
    results = AUDIO_LIBRARY.copy()

    # Filter by category
    if category:
        results = [item for item in results if item["category"] == category.value]

    # Filter by search term
    if search:
        search_lower = search.lower()
        results = [
            item for item in results
            if search_lower in item["title"].lower() or
            any(search_lower in tag.lower() for tag in item.get("tags", []))
        ]

    # Limit results
    results = results[:limit]

    return {
        "success": True,
        "data": results,
        "total": len(results)
    }


@router.get("/audio/{audio_id}")
async def get_audio_item(audio_id: str):
    """
    Get specific audio item by ID

    Args:
        audio_id: Audio item ID

    Returns:
        Audio item details
    """
    audio = next((item for item in AUDIO_LIBRARY if item["id"] == audio_id), None)

    if not audio:
        raise HTTPException(status_code=404, detail=f"Audio {audio_id} not found")

    return {
        "success": True,
        "data": audio
    }


# Voice Library Endpoints

@router.get("/voices/library")
async def get_voice_library(
    language: Optional[str] = Query(None, description="Filter by language code (e.g., en-US)"),
    gender: Optional[VoiceGender] = Query(None, description="Filter by gender"),
    style: Optional[VoiceStyle] = Query(None, description="Filter by voice style"),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(50, ge=1, le=100, description="Number of results")
):
    """
    Get voice library catalog

    Args:
        language: Filter by language code
        gender: Filter by gender
        style: Filter by voice style
        search: Search by voice name
        limit: Maximum number of results

    Returns:
        List of voice items
    """
    results = VOICE_LIBRARY.copy()

    # Filter by language
    if language:
        results = [item for item in results if item["language_code"] == language]

    # Filter by gender
    if gender:
        results = [item for item in results if item["gender"] == gender.value]

    # Filter by style
    if style:
        results = [item for item in results if item["style"] == style.value]

    # Filter by search term
    if search:
        search_lower = search.lower()
        results = [
            item for item in results
            if search_lower in item["name"].lower() or
            search_lower in item["language"].lower()
        ]

    # Limit results
    results = results[:limit]

    return {
        "success": True,
        "data": results,
        "total": len(results)
    }


@router.get("/voices/{voice_id}")
async def get_voice_item(voice_id: str):
    """
    Get specific voice by ID

    Args:
        voice_id: Voice ID

    Returns:
        Voice details
    """
    voice = next((item for item in VOICE_LIBRARY if item["id"] == voice_id), None)

    if not voice:
        raise HTTPException(status_code=404, detail=f"Voice {voice_id} not found")

    return {
        "success": True,
        "data": voice
    }


# Avatar Library Endpoints

@router.get("/avatars/library")
async def get_avatar_library(
    gender: Optional[AvatarGender] = Query(None, description="Filter by gender"),
    search: Optional[str] = Query(None, description="Search by name or tags"),
    limit: int = Query(50, ge=1, le=100, description="Number of results")
):
    """
    Get avatar library catalog

    Args:
        gender: Filter by gender
        search: Search term for name/tags
        limit: Maximum number of results

    Returns:
        List of avatar items
    """
    results = AVATAR_LIBRARY.copy()

    # Filter by gender
    if gender:
        results = [item for item in results if item["gender"] == gender.value]

    # Filter by search term
    if search:
        search_lower = search.lower()
        results = [
            item for item in results
            if search_lower in item["name"].lower() or
            any(search_lower in tag.lower() for tag in item.get("tags", []))
        ]

    # Limit results
    results = results[:limit]

    return {
        "success": True,
        "data": results,
        "total": len(results)
    }


@router.get("/avatars/{avatar_id}")
async def get_avatar_item(avatar_id: str):
    """
    Get specific avatar by ID

    Args:
        avatar_id: Avatar ID

    Returns:
        Avatar details
    """
    avatar = next((item for item in AVATAR_LIBRARY if item["id"] == avatar_id), None)

    if not avatar:
        raise HTTPException(status_code=404, detail=f"Avatar {avatar_id} not found")

    return {
        "success": True,
        "data": avatar
    }


# Media Library Endpoints

@router.get("/media/library")
async def get_media_library(
    type: Optional[MediaType] = Query(None, description="Filter by type (image/video)"),
    source: Optional[str] = Query(None, description="Filter by source (stock/ai/uploaded)"),
    search: Optional[str] = Query(None, description="Search by title or tags"),
    limit: int = Query(50, ge=1, le=100, description="Number of results")
):
    """
    Get media library catalog

    Args:
        type: Filter by image or video
        source: Filter by source (stock/ai/uploaded)
        search: Search term for title/tags
        limit: Maximum number of results

    Returns:
        List of media items
    """
    results = MEDIA_LIBRARY.copy()

    # Filter by type
    if type:
        results = [item for item in results if item["type"] == type.value]

    # Filter by source
    if source:
        results = [item for item in results if item["source"] == source]

    # Filter by search term
    if search:
        search_lower = search.lower()
        results = [
            item for item in results
            if search_lower in item["title"].lower() or
            any(search_lower in tag.lower() for tag in item.get("tags", []))
        ]

    # Limit results
    results = results[:limit]

    return {
        "success": True,
        "data": results,
        "total": len(results)
    }


@router.get("/media/{media_id}")
async def get_media_item(media_id: str):
    """
    Get specific media item by ID

    Args:
        media_id: Media item ID

    Returns:
        Media item details
    """
    media = next((item for item in MEDIA_LIBRARY if item["id"] == media_id), None)

    if not media:
        raise HTTPException(status_code=404, detail=f"Media {media_id} not found")

    return {
        "success": True,
        "data": media
    }


# Helper endpoint to get all available options

@router.get("/libraries/options")
async def get_library_options():
    """
    Get all available filter options for libraries

    Returns:
        Available options for filtering
    """
    return {
        "success": True,
        "data": {
            "audio": {
                "categories": [cat.value for cat in AudioCategory],
                "total_items": len(AUDIO_LIBRARY)
            },
            "voices": {
                "languages": list(set(item["language_code"] for item in VOICE_LIBRARY)),
                "genders": [gender.value for gender in VoiceGender],
                "styles": [style.value for style in VoiceStyle],
                "total_items": len(VOICE_LIBRARY)
            },
            "avatars": {
                "genders": [gender.value for gender in AvatarGender],
                "total_items": len(AVATAR_LIBRARY)
            },
            "media": {
                "types": [type.value for type in MediaType],
                "sources": ["stock", "ai", "uploaded"],
                "total_items": len(MEDIA_LIBRARY)
            }
        }
    }
