"""
Scene and Layer Management API Endpoints

FastAPI router for interactive scene editor operations
"""

from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.db_models import VideoScene, SceneLayer, Video

router = APIRouter(prefix="/api/v1", tags=["scenes"])


# Pydantic models for request/response
class LayerCreate(BaseModel):
    type: str
    name: str
    enabled: bool = True
    duration: float
    start_time: float = 0.0
    end_time: float
    order_index: int = 0
    properties: Optional[Dict[str, Any]] = None


class LayerUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    duration: Optional[float] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    order_index: Optional[int] = None
    properties: Optional[Dict[str, Any]] = None


class SceneCreate(BaseModel):
    scene_number: int
    text: str
    duration: float
    start_time: float = 0.0
    end_time: float
    is_expanded: bool = False


class SceneUpdate(BaseModel):
    text: Optional[str] = None
    duration: Optional[float] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    is_expanded: Optional[bool] = None
    scene_number: Optional[int] = None


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Scene Management APIs

@router.get("/videos/{video_id}/scenes")
async def get_video_scenes(
    video_id: str = Path(..., description="Video ID")
):
    """
    Get all scenes for a video with their layers

    Returns:
        List of scenes with nested layers
    """
    db = SessionLocal()
    try:
        # Check if video exists
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail=f"Video {video_id} not found")

        # Get scenes with layers
        scenes = db.query(VideoScene).filter(
            VideoScene.video_id == video_id
        ).order_by(VideoScene.scene_number).all()

        return {
            "success": True,
            "data": {
                "scenes": [scene.to_dict() for scene in scenes]
            }
        }
    finally:
        db.close()


@router.post("/videos/{video_id}/scenes")
async def create_scene(
    video_id: str = Path(..., description="Video ID"),
    scene_data: SceneCreate = Body(...)
):
    """
    Create a new scene for a video

    Args:
        video_id: Video ID
        scene_data: Scene creation data

    Returns:
        Created scene object
    """
    db = SessionLocal()
    try:
        # Check if video exists
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail=f"Video {video_id} not found")

        # Create new scene
        new_scene = VideoScene(
            video_id=video_id,
            scene_number=scene_data.scene_number,
            text=scene_data.text,
            duration=scene_data.duration,
            start_time=scene_data.start_time,
            end_time=scene_data.end_time,
            is_expanded=1 if scene_data.is_expanded else 0
        )

        db.add(new_scene)
        db.commit()
        db.refresh(new_scene)

        return {
            "success": True,
            "message": "Scene created successfully",
            "data": {
                "scene": new_scene.to_dict()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create scene: {str(e)}")
    finally:
        db.close()


@router.put("/videos/{video_id}/scenes/{scene_id}")
async def update_scene(
    video_id: str = Path(..., description="Video ID"),
    scene_id: str = Path(..., description="Scene ID"),
    scene_data: SceneUpdate = Body(...)
):
    """
    Update a scene's properties

    Args:
        video_id: Video ID
        scene_id: Scene ID
        scene_data: Scene update data

    Returns:
        Updated scene object
    """
    db = SessionLocal()
    try:
        # Get scene
        scene = db.query(VideoScene).filter(
            VideoScene.id == scene_id,
            VideoScene.video_id == video_id
        ).first()

        if not scene:
            raise HTTPException(status_code=404, detail=f"Scene {scene_id} not found")

        # Update fields
        if scene_data.text is not None:
            scene.text = scene_data.text
        if scene_data.duration is not None:
            scene.duration = scene_data.duration
            # Also update end_time if duration changes
            scene.end_time = scene.start_time + scene_data.duration
        if scene_data.start_time is not None:
            scene.start_time = scene_data.start_time
        if scene_data.end_time is not None:
            scene.end_time = scene_data.end_time
        if scene_data.is_expanded is not None:
            scene.is_expanded = 1 if scene_data.is_expanded else 0
        if scene_data.scene_number is not None:
            scene.scene_number = scene_data.scene_number

        db.commit()
        db.refresh(scene)

        return {
            "success": True,
            "message": "Scene updated successfully",
            "data": {
                "scene": scene.to_dict()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update scene: {str(e)}")
    finally:
        db.close()


@router.delete("/videos/{video_id}/scenes/{scene_id}")
async def delete_scene(
    video_id: str = Path(..., description="Video ID"),
    scene_id: str = Path(..., description="Scene ID")
):
    """
    Delete a scene from a video

    Args:
        video_id: Video ID
        scene_id: Scene ID

    Returns:
        Success message
    """
    db = SessionLocal()
    try:
        # Get scene
        scene = db.query(VideoScene).filter(
            VideoScene.id == scene_id,
            VideoScene.video_id == video_id
        ).first()

        if not scene:
            raise HTTPException(status_code=404, detail=f"Scene {scene_id} not found")

        # Check if it's the last scene
        scene_count = db.query(VideoScene).filter(VideoScene.video_id == video_id).count()
        if scene_count == 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last scene. At least one scene is required."
            )

        db.delete(scene)
        db.commit()

        return {
            "success": True,
            "message": f"Scene {scene_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete scene: {str(e)}")
    finally:
        db.close()


# Layer Management APIs

@router.post("/scenes/{scene_id}/layers")
async def create_layer(
    scene_id: str = Path(..., description="Scene ID"),
    layer_data: LayerCreate = Body(...)
):
    """
    Add a new layer to a scene

    Args:
        scene_id: Scene ID
        layer_data: Layer creation data

    Returns:
        Created layer object
    """
    db = SessionLocal()
    try:
        # Check if scene exists
        scene = db.query(VideoScene).filter(VideoScene.id == scene_id).first()
        if not scene:
            raise HTTPException(status_code=404, detail=f"Scene {scene_id} not found")

        # Create new layer
        new_layer = SceneLayer(
            scene_id=scene_id,
            type=layer_data.type,
            name=layer_data.name,
            enabled=1 if layer_data.enabled else 0,
            duration=layer_data.duration,
            start_time=layer_data.start_time,
            end_time=layer_data.end_time,
            order_index=layer_data.order_index,
            properties=layer_data.properties or {}
        )

        db.add(new_layer)
        db.commit()
        db.refresh(new_layer)

        return {
            "success": True,
            "message": "Layer added successfully",
            "data": {
                "layer": new_layer.to_dict()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create layer: {str(e)}")
    finally:
        db.close()


@router.put("/layers/{layer_id}")
async def update_layer(
    layer_id: str = Path(..., description="Layer ID"),
    layer_data: LayerUpdate = Body(...)
):
    """
    Update a layer's properties

    Args:
        layer_id: Layer ID
        layer_data: Layer update data

    Returns:
        Updated layer object
    """
    db = SessionLocal()
    try:
        # Get layer
        layer = db.query(SceneLayer).filter(SceneLayer.id == layer_id).first()

        if not layer:
            raise HTTPException(status_code=404, detail=f"Layer {layer_id} not found")

        # Update fields
        if layer_data.name is not None:
            layer.name = layer_data.name
        if layer_data.enabled is not None:
            layer.enabled = 1 if layer_data.enabled else 0
        if layer_data.duration is not None:
            layer.duration = layer_data.duration
        if layer_data.start_time is not None:
            layer.start_time = layer_data.start_time
        if layer_data.end_time is not None:
            layer.end_time = layer_data.end_time
        if layer_data.order_index is not None:
            layer.order_index = layer_data.order_index
        if layer_data.properties is not None:
            # Merge properties
            current_props = layer.properties or {}
            current_props.update(layer_data.properties)
            layer.properties = current_props

        db.commit()
        db.refresh(layer)

        return {
            "success": True,
            "message": "Layer updated successfully",
            "data": {
                "layer": layer.to_dict()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update layer: {str(e)}")
    finally:
        db.close()


@router.delete("/layers/{layer_id}")
async def delete_layer(
    layer_id: str = Path(..., description="Layer ID")
):
    """
    Delete a layer from a scene

    Args:
        layer_id: Layer ID

    Returns:
        Success message
    """
    db = SessionLocal()
    try:
        # Get layer
        layer = db.query(SceneLayer).filter(SceneLayer.id == layer_id).first()

        if not layer:
            raise HTTPException(status_code=404, detail=f"Layer {layer_id} not found")

        db.delete(layer)
        db.commit()

        return {
            "success": True,
            "message": "Layer deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete layer: {str(e)}")
    finally:
        db.close()


@router.put("/layers/{layer_id}/toggle-visibility")
async def toggle_layer_visibility(
    layer_id: str = Path(..., description="Layer ID"),
    data: Dict[str, bool] = Body(...)
):
    """
    Toggle layer visibility (enabled/disabled)

    Args:
        layer_id: Layer ID
        data: Dictionary with 'enabled' key

    Returns:
        Updated layer object
    """
    db = SessionLocal()
    try:
        # Get layer
        layer = db.query(SceneLayer).filter(SceneLayer.id == layer_id).first()

        if not layer:
            raise HTTPException(status_code=404, detail=f"Layer {layer_id} not found")

        # Update enabled status
        layer.enabled = 1 if data.get("enabled", True) else 0

        db.commit()
        db.refresh(layer)

        return {
            "success": True,
            "message": "Layer visibility updated",
            "data": {
                "layer": layer.to_dict()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to toggle layer visibility: {str(e)}")
    finally:
        db.close()


@router.put("/layers/reorder")
async def reorder_layers(
    data: Dict[str, Any] = Body(...)
):
    """
    Reorder layers within a scene

    Args:
        data: Dictionary with scene_id and layer_orders array

    Returns:
        Success message
    """
    db = SessionLocal()
    try:
        scene_id = data.get("scene_id")
        layer_orders = data.get("layer_orders", [])

        if not scene_id:
            raise HTTPException(status_code=400, detail="scene_id is required")

        # Update each layer's order_index
        for order_data in layer_orders:
            layer_id = order_data.get("layer_id")
            order_index = order_data.get("order_index")

            if layer_id and order_index is not None:
                layer = db.query(SceneLayer).filter(SceneLayer.id == layer_id).first()
                if layer:
                    layer.order_index = order_index

        db.commit()

        return {
            "success": True,
            "message": "Layers reordered successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reorder layers: {str(e)}")
    finally:
        db.close()
