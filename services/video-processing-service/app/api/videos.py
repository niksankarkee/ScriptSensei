"""
Video Processing API Endpoints

FastAPI router for video operations
"""

from fastapi import APIRouter, HTTPException, Query, Path
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime

from app.models.video import (
    VideoRequest,
    VideoResponse,
    VideoListResponse,
    VideoStatus
)
from app.services.video_processor import VideoProcessor

router = APIRouter(prefix="/api/v1/videos", tags=["videos"])

# Initialize video processor (in production, use dependency injection)
video_processor = VideoProcessor()


@router.post("/generate", response_model=dict, status_code=201)
async def create_video_job(request: VideoRequest):
    """
    Generate a new video from script

    Args:
        request: VideoRequest with script and parameters

    Returns:
        Video job details with job ID

    Raises:
        HTTPException: If validation fails
    """
    try:
        video_response = video_processor.create_video_job(request)

        return {
            "success": True,
            "data": video_response.model_dump()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "Rate limit exceeded" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create video job: {str(e)}")


@router.get("/{video_id}", response_model=dict)
async def get_video_job(
    video_id: str = Path(..., description="Video job ID")
):
    """
    Get video job status and details

    Args:
        video_id: Video job ID

    Returns:
        Video job details

    Raises:
        HTTPException: If video not found
    """
    video = video_processor.get_job_status(video_id)

    if video is None:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Video {video_id} not found"}
        )

    return {
        "success": True,
        "data": video.model_dump()
    }


@router.get("", response_model=VideoListResponse)
async def list_user_videos(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    List all videos for a user

    Args:
        user_id: User ID
        page: Page number (1-indexed)
        limit: Items per page

    Returns:
        Paginated list of videos
    """
    videos, total = video_processor.get_user_videos(user_id, page, limit)

    return VideoListResponse(
        success=True,
        data=videos,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )


@router.delete("/{video_id}", response_model=dict)
async def delete_video_job(
    video_id: str = Path(..., description="Video job ID")
):
    """
    Delete a video job

    Args:
        video_id: Video job ID

    Returns:
        Success message

    Raises:
        HTTPException: If video not found
    """
    deleted = video_processor.delete_video_job(video_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Video {video_id} not found"}
        )

    return {
        "success": True,
        "message": f"Video {video_id} deleted successfully"
    }


@router.post("/{video_id}/retry", response_model=dict)
async def retry_video_job(
    video_id: str = Path(..., description="Video job ID")
):
    """
    Retry a failed video job

    Args:
        video_id: Video job ID

    Returns:
        Updated video job details

    Raises:
        HTTPException: If video not found or not in failed state
    """
    video = video_processor.retry_video_job(video_id)

    if video is None:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Video {video_id} not found or cannot be retried"}
        )

    return {
        "success": True,
        "data": video.model_dump()
    }


@router.patch("/{video_id}", response_model=dict)
async def update_video_metadata(
    video_id: str = Path(..., description="Video job ID"),
    metadata: dict = ...
):
    """
    Update video metadata

    Args:
        video_id: Video job ID
        metadata: Metadata to update

    Returns:
        Success message

    Raises:
        HTTPException: If video not found
    """
    updated = video_processor.update_video_metadata(video_id, metadata)

    if not updated:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Video {video_id} not found"}
        )

    return {
        "success": True,
        "message": "Video metadata updated successfully"
    }


@router.get("/{video_id}/download")
async def download_video(
    video_id: str = Path(..., description="Video job ID")
):
    """
    Download video file

    Args:
        video_id: Video job ID

    Returns:
        Video file for download

    Raises:
        HTTPException: If video not found or not completed
    """
    file_path = video_processor.get_video_file_path(video_id)

    if file_path is None:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Video {video_id} not found or not ready for download"}
        )

    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=f"{video_id}.mp4"
    )


@router.get("/{video_id}/thumbnail")
async def get_video_thumbnail(
    video_id: str = Path(..., description="Video job ID")
):
    """
    Get video thumbnail

    Args:
        video_id: Video job ID

    Returns:
        Thumbnail image

    Raises:
        HTTPException: If thumbnail not found
    """
    thumbnail_path = video_processor.get_thumbnail_path(video_id)

    if thumbnail_path is None:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Thumbnail for video {video_id} not found"}
        )

    return FileResponse(
        path=thumbnail_path,
        media_type="image/jpeg",
        filename=f"{video_id}_thumbnail.jpg"
    )
