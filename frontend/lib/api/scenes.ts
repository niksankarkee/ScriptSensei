/**
 * Scenes API Client
 *
 * Client for interacting with the scene and layer management APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'

export interface SceneLayer {
  id: string
  scene_id: string
  type: 'audio' | 'voiceover' | 'text' | 'media' | 'shape' | 'avatar' | 'effect'
  name: string
  enabled: boolean
  duration: number
  start_time: number
  end_time: number
  order_index: number
  properties: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface Scene {
  id: string
  video_id: string
  scene_number: number
  text: string
  duration: number
  start_time: number
  end_time: number
  is_expanded: boolean
  visual_asset?: string
  transition?: string
  layers: SceneLayer[]
  created_at?: string
  updated_at?: string
}

export interface ScenesResponse {
  success: boolean
  data: {
    scenes: Scene[]
  }
}

export interface SceneResponse {
  success: boolean
  message: string
  data: {
    scene: Scene
  }
}

export interface LayerResponse {
  success: boolean
  message: string
  data: {
    layer: SceneLayer
  }
}

// Scene Management APIs

/**
 * Get all scenes for a video
 */
export async function getVideoScenes(videoId: string): Promise<Scene[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/scenes`)
    const data: ScenesResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch scenes')
    }

    return data.data.scenes
  } catch (error) {
    console.error('Error fetching scenes:', error)
    throw error
  }
}

/**
 * Create a new scene
 */
export async function createScene(
  videoId: string,
  sceneData: {
    scene_number: number
    text: string
    duration: number
    start_time?: number
    end_time: number
    is_expanded?: boolean
  }
): Promise<Scene> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sceneData),
    })

    const data: SceneResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create scene')
    }

    return data.data.scene
  } catch (error) {
    console.error('Error creating scene:', error)
    throw error
  }
}

/**
 * Update a scene
 */
export async function updateScene(
  videoId: string,
  sceneId: string,
  updates: {
    text?: string
    duration?: number
    start_time?: number
    end_time?: number
    is_expanded?: boolean
    scene_number?: number
  }
): Promise<Scene> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/scenes/${sceneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data: SceneResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update scene')
    }

    return data.data.scene
  } catch (error) {
    console.error('Error updating scene:', error)
    throw error
  }
}

/**
 * Delete a scene
 */
export async function deleteScene(videoId: string, sceneId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/scenes/${sceneId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.detail || data.message || 'Failed to delete scene')
    }
  } catch (error) {
    console.error('Error deleting scene:', error)
    throw error
  }
}

// Layer Management APIs

/**
 * Create a new layer
 */
export async function createLayer(
  sceneId: string,
  layerData: {
    type: string
    name: string
    enabled?: boolean
    duration: number
    start_time?: number
    end_time: number
    order_index?: number
    properties?: Record<string, any>
  }
): Promise<SceneLayer> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/layers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(layerData),
    })

    const data: LayerResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create layer')
    }

    return data.data.layer
  } catch (error) {
    console.error('Error creating layer:', error)
    throw error
  }
}

/**
 * Update a layer
 */
export async function updateLayer(
  layerId: string,
  updates: {
    name?: string
    enabled?: boolean
    duration?: number
    start_time?: number
    end_time?: number
    order_index?: number
    properties?: Record<string, any>
  }
): Promise<SceneLayer> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/layers/${layerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data: LayerResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update layer')
    }

    return data.data.layer
  } catch (error) {
    console.error('Error updating layer:', error)
    throw error
  }
}

/**
 * Delete a layer
 */
export async function deleteLayer(layerId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/layers/${layerId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete layer')
    }
  } catch (error) {
    console.error('Error deleting layer:', error)
    throw error
  }
}

/**
 * Toggle layer visibility
 */
export async function toggleLayerVisibility(layerId: string, enabled: boolean): Promise<SceneLayer> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/layers/${layerId}/toggle-visibility`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    })

    const data: LayerResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to toggle layer visibility')
    }

    return data.data.layer
  } catch (error) {
    console.error('Error toggling layer visibility:', error)
    throw error
  }
}

/**
 * Reorder layers
 */
export async function reorderLayers(
  sceneId: string,
  layerOrders: Array<{ layer_id: string; order_index: number }>
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/layers/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scene_id: sceneId,
        layer_orders: layerOrders,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to reorder layers')
    }
  } catch (error) {
    console.error('Error reordering layers:', error)
    throw error
  }
}
