"""
Platforms API Endpoints

Information about supported platforms and voices
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from typing import List, Dict, Any
import base64

router = APIRouter(prefix="/api/v1", tags=["platforms"])


@router.get("/platforms", response_model=dict)
async def get_supported_platforms():
    """
    Get list of supported platforms

    Returns:
        List of platforms with their configurations
    """
    platforms = [
        {
            "id": "tiktok",
            "name": "TikTok",
            "description": "Short-form viral videos",
            "aspect_ratio": "9:16",
            "max_duration": 180,
            "optimal_duration": 30,
            "resolution": "1080x1920",
            "features": ["trending_sounds", "effects", "duets"]
        },
        {
            "id": "youtube",
            "name": "YouTube",
            "description": "Long-form content",
            "aspect_ratio": "16:9",
            "max_duration": None,
            "optimal_duration": 600,
            "resolution": "1920x1080",
            "features": ["chapters", "end_screens", "cards"]
        },
        {
            "id": "youtube_shorts",
            "name": "YouTube Shorts",
            "description": "Short vertical videos",
            "aspect_ratio": "9:16",
            "max_duration": 60,
            "optimal_duration": 30,
            "resolution": "1080x1920",
            "features": ["shorts_shelf", "quick_creation"]
        },
        {
            "id": "instagram_reels",
            "name": "Instagram Reels",
            "description": "Short entertaining videos",
            "aspect_ratio": "9:16",
            "max_duration": 90,
            "optimal_duration": 30,
            "resolution": "1080x1920",
            "features": ["music", "effects", "explore"]
        },
        {
            "id": "instagram_stories",
            "name": "Instagram Stories",
            "description": "24-hour temporary content",
            "aspect_ratio": "9:16",
            "max_duration": 15,
            "optimal_duration": 15,
            "resolution": "1080x1920",
            "features": ["stickers", "polls", "questions"]
        },
        {
            "id": "facebook",
            "name": "Facebook",
            "description": "Social media videos",
            "aspect_ratio": "16:9",
            "max_duration": None,
            "optimal_duration": 120,
            "resolution": "1920x1080",
            "features": ["live", "watch", "stories"]
        }
    ]

    return {
        "success": True,
        "data": platforms
    }


@router.get("/voices", response_model=dict)
async def get_available_voices():
    """
    Get list of available TTS voices

    Returns:
        List of voices from different providers
    """
    voices = [
        # Azure Cognitive Services
        {
            "id": "en-US-JennyNeural",
            "name": "Jenny (US English)",
            "language": "en-US",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Clear American English voice"
        },
        {
            "id": "en-US-GuyNeural",
            "name": "Guy (US English)",
            "language": "en-US",
            "gender": "Male",
            "provider": "azure",
            "is_premium": False,
            "description": "Professional American English voice"
        },
        {
            "id": "en-GB-SoniaNeural",
            "name": "Sonia (UK English)",
            "language": "en-GB",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "British English voice"
        },
        {
            "id": "ja-JP-NanamiNeural",
            "name": "Nanami (Japanese)",
            "language": "ja-JP",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Natural Japanese voice"
        },
        {
            "id": "ne-NP-HemkalaNeural",
            "name": "Hemkala (Nepali)",
            "language": "ne-NP",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Nepali voice"
        },
        {
            "id": "hi-IN-SwaraNeural",
            "name": "Swara (Hindi)",
            "language": "hi-IN",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Hindi voice"
        },
        {
            "id": "id-ID-GadisNeural",
            "name": "Gadis (Indonesian)",
            "language": "id-ID",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Indonesian voice"
        },
        {
            "id": "th-TH-PremwadeeNeural",
            "name": "Premwadee (Thai)",
            "language": "th-TH",
            "gender": "Female",
            "provider": "azure",
            "is_premium": False,
            "description": "Thai voice"
        },
        # ElevenLabs (Premium)
        {
            "id": "elevenlabs-adam",
            "name": "Adam (Premium)",
            "language": "en-US",
            "gender": "Male",
            "provider": "elevenlabs",
            "is_premium": True,
            "description": "High-quality expressive voice"
        },
        {
            "id": "elevenlabs-bella",
            "name": "Bella (Premium)",
            "language": "en-US",
            "gender": "Female",
            "provider": "elevenlabs",
            "is_premium": True,
            "description": "Natural conversational voice"
        }
    ]

    return {
        "success": True,
        "data": voices
    }


@router.get("/visual-styles", response_model=dict)
async def get_visual_styles():
    """
    Get list of available visual styles

    Returns:
        List of visual style options
    """
    styles = [
        {
            "id": "stock",
            "name": "Stock Footage",
            "description": "Professional stock video clips",
            "is_premium": False
        },
        {
            "id": "ai_generated",
            "name": "AI Generated",
            "description": "AI-generated visuals and animations",
            "is_premium": True
        },
        {
            "id": "template",
            "name": "Template",
            "description": "Pre-designed video templates",
            "is_premium": False
        },
        {
            "id": "slideshow",
            "name": "Slideshow",
            "description": "Image slideshow with transitions",
            "is_premium": False
        },
        {
            "id": "text_animation",
            "name": "Text Animation",
            "description": "Animated text and typography",
            "is_premium": False
        }
    ]

    return {
        "success": True,
        "data": styles
    }


@router.post("/voices/preview", response_model=dict)
async def preview_voice(
    voice_id: str = Query(..., description="Voice ID to preview"),
    text: str = Query("Hello! This is a preview of this voice. How do you like it?", description="Text to synthesize")
):
    """
    Generate a preview audio sample for a voice

    Args:
        voice_id: Voice ID
        text: Text to synthesize (default: sample text)

    Returns:
        Base64-encoded audio data

    Raises:
        HTTPException: If voice not found or synthesis fails
    """
    # For MVP, we'll return a mock response
    # In production, this should integrate with actual TTS services

    # Validate voice exists
    voices_response = await get_available_voices()
    available_voices = voices_response["data"]
    voice = next((v for v in available_voices if v["id"] == voice_id), None)

    if not voice:
        raise HTTPException(
            status_code=404,
            detail=f"Voice {voice_id} not found"
        )

    # For MVP, return a success response with mock data
    # In production, integrate with Azure TTS, ElevenLabs, etc.
    return {
        "success": True,
        "message": "Voice preview generated successfully",
        "data": {
            "voice_id": voice_id,
            "voice_name": voice["name"],
            "text": text,
            "audio_url": None,  # Would contain actual audio URL in production
            "duration": 3.5,
            "format": "mp3",
            "note": "TTS preview will be implemented in the next phase with actual voice synthesis integration"
        }
    }
