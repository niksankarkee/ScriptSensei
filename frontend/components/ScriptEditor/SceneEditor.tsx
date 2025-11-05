'use client'

import { useState } from 'react'
import { Trash2, GripVertical, Plus, Play, Save, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export interface Scene {
  id: string
  scene_number: number
  text: string
  duration: number
  visual_asset?: string
  transition?: 'fade' | 'cut' | 'dissolve' | 'slide'
}

interface SceneEditorProps {
  initialScenes: Scene[]
  scriptId?: string
  onSave?: (scenes: Scene[]) => Promise<void>
  readOnly?: boolean
}

export default function SceneEditor({
  initialScenes,
  scriptId,
  onSave,
  readOnly = false
}: SceneEditorProps) {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      scene_number: scenes.length + 1,
      text: '',
      duration: 5,
      transition: 'fade'
    }
    setScenes([...scenes, newScene])
    setEditingSceneId(newScene.id)
  }

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ))
  }

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = scenes
      .filter(scene => scene.id !== sceneId)
      .map((scene, index) => ({ ...scene, scene_number: index + 1 }))
    setScenes(updatedScenes)
    toast({
      variant: 'success',
      title: 'Scene deleted',
      description: 'Scene has been removed from the script'
    })
  }

  const handleDragStart = (sceneId: string) => {
    setDraggedSceneId(sceneId)
  }

  const handleDragOver = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault()
    if (!draggedSceneId || draggedSceneId === targetSceneId) return

    const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId)
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId)

    const newScenes = [...scenes]
    const [draggedScene] = newScenes.splice(draggedIndex, 1)
    newScenes.splice(targetIndex, 0, draggedScene)

    // Renumber scenes
    const renumbered = newScenes.map((scene, index) => ({
      ...scene,
      scene_number: index + 1
    }))

    setScenes(renumbered)
  }

  const handleDragEnd = () => {
    setDraggedSceneId(null)
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(scenes)
      toast({
        variant: 'success',
        title: 'Script saved',
        description: 'Your changes have been saved successfully'
      })
    } catch (error) {
      console.error('Failed to save script:', error)
      toast({
        variant: 'error',
        title: 'Save failed',
        description: 'Failed to save your changes. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scene Editor</h3>
          <p className="text-sm text-gray-600">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''} • Total duration: {formatDuration(getTotalDuration())}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <button
                onClick={handleAddScene}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Scene
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-3">
        {scenes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No scenes yet</p>
            {!readOnly && (
              <button
                onClick={handleAddScene}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Scene
              </button>
            )}
          </div>
        ) : (
          scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isEditing={editingSceneId === scene.id}
              isDragging={draggedSceneId === scene.id}
              readOnly={readOnly}
              onEdit={() => setEditingSceneId(scene.id)}
              onStopEdit={() => setEditingSceneId(null)}
              onUpdate={(updates) => handleUpdateScene(scene.id, updates)}
              onDelete={() => handleDeleteScene(scene.id)}
              onDragStart={() => handleDragStart(scene.id)}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface SceneCardProps {
  scene: Scene
  isEditing: boolean
  isDragging: boolean
  readOnly: boolean
  onEdit: () => void
  onStopEdit: () => void
  onUpdate: (updates: Partial<Scene>) => void
  onDelete: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function SceneCard({
  scene,
  isEditing,
  isDragging,
  readOnly,
  onEdit,
  onStopEdit,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd
}: SceneCardProps) {
  return (
    <div
      draggable={!readOnly}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg border-2 transition-all ${
        isDragging
          ? 'border-indigo-400 opacity-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-4">
        {/* Scene Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {!readOnly && (
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Scene {scene.scene_number}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {scene.duration}s
              </span>
            </div>
          </div>
          {!readOnly && (
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <button
                  onClick={onEdit}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scene Content */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scene Text
              </label>
              <textarea
                value={scene.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Enter scene narration..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={scene.duration}
                  onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transition
                </label>
                <select
                  value={scene.transition}
                  onChange={(e) => onUpdate({ transition: e.target.value as Scene['transition'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="fade">Fade</option>
                  <option value="cut">Cut</option>
                  <option value="dissolve">Dissolve</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onStopEdit}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {scene.text || <span className="text-gray-400 italic">No text yet</span>}
            </p>
            {scene.transition && scene.transition !== 'fade' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  Transition: {scene.transition}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
