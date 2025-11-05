'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Image, Volume2, Type, Film } from 'lucide-react'
import type { Scene } from '@/app/dashboard/videos/[id]/edit/page'

interface SceneTimelineProps {
  scenes: Scene[]
  selectedSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onSceneAdd: () => void
  onSceneDelete: (sceneId: string) => void
  onSceneReorder: (draggedId: string, targetId: string) => void
  currentTime: number
}

export default function SceneTimeline({
  scenes,
  selectedSceneId,
  onSceneSelect,
  onSceneAdd,
  onSceneDelete,
  onSceneReorder,
  currentTime
}: SceneTimelineProps) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null)

  const handleDragStart = (sceneId: string) => {
    setDraggedSceneId(sceneId)
  }

  const handleDragOver = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault()
    if (!draggedSceneId || draggedSceneId === targetSceneId) return
    onSceneReorder(draggedSceneId, targetSceneId)
  }

  const handleDragEnd = () => {
    setDraggedSceneId(null)
  }

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0)
  }

  const getSceneStartTime = (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId)
    return scenes.slice(0, sceneIndex).reduce((total, scene) => total + scene.duration, 0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
          <button
            onClick={onSceneAdd}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded"
          >
            <Plus className="h-3 w-3 mr-1" />
            Scene
          </button>
        </div>
        <div className="text-xs text-gray-600">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''} • {formatTime(getTotalDuration())}
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Film className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No scenes yet</p>
            <button
              onClick={onSceneAdd}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Scene
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {scenes.map((scene) => {
              const isSelected = scene.id === selectedSceneId
              const isDragging = scene.id === draggedSceneId
              const startTime = getSceneStartTime(scene.id)
              const isCurrentScene = currentTime >= startTime && currentTime < startTime + scene.duration

              return (
                <div
                  key={scene.id}
                  draggable
                  onDragStart={() => handleDragStart(scene.id)}
                  onDragOver={(e) => handleDragOver(e, scene.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSceneSelect(scene.id)}
                  className={`
                    relative rounded-lg border-2 transition-all cursor-pointer group
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : isCurrentScene
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isDragging ? 'opacity-50' : ''}
                  `}
                >
                  <div className="p-3">
                    {/* Scene Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="cursor-move text-gray-400 hover:text-gray-600 flex-shrink-0">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {scene.scene_number}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {formatTime(startTime)} - {formatTime(startTime + scene.duration)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                            {scene.text || <span className="text-gray-400 italic">Empty scene</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSceneDelete(scene.id)
                        }}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all ml-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Scene Layers */}
                    <div className="space-y-1 pl-6">
                      {/* Visual Layer */}
                      {(scene.image_url || scene.video_url || scene.visual_asset) && (
                        <div className="flex items-center gap-2 text-xs">
                          <Image className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600 truncate">
                            {scene.image_url ? 'Image' : scene.video_url ? 'Video' : 'Visual'}
                          </span>
                        </div>
                      )}

                      {/* Audio Layer */}
                      {(scene.audio_url || scene.voice_over) && (
                        <div className="flex items-center gap-2 text-xs">
                          <Volume2 className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600 truncate">
                            {scene.voice_over ? 'Voice Over' : 'Audio'}
                          </span>
                        </div>
                      )}

                      {/* Text Overlay Layer */}
                      {scene.text_overlay?.enabled && (
                        <div className="flex items-center gap-2 text-xs">
                          <Type className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600 truncate">
                            Text: {scene.text_overlay.text || 'Empty'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Duration Bar */}
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isSelected ? 'bg-indigo-500' : isCurrentScene ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        style={{
                          width: `${Math.min(100, (scene.duration / 10) * 100)}%`
                        }}
                      />
                    </div>

                    {/* Playhead Indicator */}
                    {isCurrentScene && (
                      <div
                        className="absolute top-0 left-0 w-0.5 h-full bg-green-500"
                        style={{
                          left: `${((currentTime - startTime) / scene.duration) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Timeline Ruler (Bottom) */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Current: {formatTime(currentTime)}</span>
          <span>Total: {formatTime(getTotalDuration())}</span>
        </div>
        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{
              width: `${(currentTime / getTotalDuration()) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
