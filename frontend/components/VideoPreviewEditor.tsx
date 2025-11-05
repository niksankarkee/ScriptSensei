'use client'

/**
 * Video Preview Editor Component
 *
 * Scene-by-scene video preview and editing interface matching Fliki
 * Features:
 * - Scene thumbnails sidebar
 * - Video player with timeline
 * - Scene text editing
 * - Media replacement per scene
 * - Voice-over controls per scene
 * - Scene duration adjustment
 * - "Generate all avatar video" option
 */

import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Edit2,
  Image as ImageIcon,
  Clock,
  Trash2,
  Plus,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Scene {
  id: string
  sceneNumber: number
  text: string
  duration: number
  thumbnailUrl?: string
  mediaUrl?: string
  mediaType: 'image' | 'video' | 'ai_generated'
  voiceId?: string
  startTime: number
  endTime: number
}

interface VideoPreviewEditorProps {
  videoId: string
  scenes: Scene[]
  totalDuration: number
  videoUrl?: string
  onSceneUpdate?: (sceneId: string, updates: Partial<Scene>) => void
  onSceneDelete?: (sceneId: string) => void
  onSceneAdd?: (afterSceneId: string) => void
  onGenerateVideo?: () => void
  onClose?: () => void
}

export default function VideoPreviewEditor({
  videoId,
  scenes: initialScenes,
  totalDuration,
  videoUrl,
  onSceneUpdate,
  onSceneDelete,
  onSceneAdd,
  onGenerateVideo,
  onClose
}: VideoPreviewEditorProps) {
  const [scenes, setScenes] = useState(initialScenes)
  const [selectedSceneId, setSelectedSceneId] = useState(scenes[0]?.id)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [editedText, setEditedText] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const selectedScene = scenes.find(s => s.id === selectedSceneId)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Auto-select scene based on current time
      const currentScene = scenes.find(
        scene => video.currentTime >= scene.startTime && video.currentTime < scene.endTime
      )
      if (currentScene && currentScene.id !== selectedSceneId) {
        setSelectedSceneId(currentScene.id)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [scenes, selectedSceneId])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const progressBar = progressBarRef.current
    if (!video || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * totalDuration
  }

  const jumpToScene = (scene: Scene) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = scene.startTime
    setSelectedSceneId(scene.id)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startEditingScene = (scene: Scene) => {
    setEditingSceneId(scene.id)
    setEditedText(scene.text)
  }

  const saveSceneEdit = () => {
    if (editingSceneId && onSceneUpdate) {
      onSceneUpdate(editingSceneId, { text: editedText })
      setScenes(scenes.map(s =>
        s.id === editingSceneId ? { ...s, text: editedText } : s
      ))
    }
    setEditingSceneId(null)
    setEditedText('')
  }

  const cancelSceneEdit = () => {
    setEditingSceneId(null)
    setEditedText('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex">
      {/* Scenes Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Scenes ({scenes.length})</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={onGenerateVideo}
            className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm font-medium"
          >
            Generate all avatar video
          </button>
        </div>

        {/* Scenes List */}
        <div className="flex-1 overflow-y-auto">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => jumpToScene(scene)}
              className={`w-full p-3 border-b border-gray-700 text-left transition-colors ${
                selectedSceneId === scene.id
                  ? 'bg-pink-600/20 border-l-4 border-l-pink-600'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {scene.thumbnailUrl ? (
                    <img
                      src={scene.thumbnailUrl}
                      alt={`Scene ${scene.sceneNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Scene Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Scene {scene.sceneNumber}</span>
                    <span className="text-xs text-gray-400">{scene.duration}s</span>
                  </div>
                  <p className="text-sm text-white line-clamp-2">{scene.text}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Add Scene Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => selectedSceneId && onSceneAdd?.(selectedSceneId)}
            className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Scene
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div ref={containerRef} className="flex-1 bg-black flex items-center justify-center">
          {videoUrl ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onClick={togglePlayPause}
              />

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div
                  ref={progressBarRef}
                  onClick={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4 group"
                >
                  <div
                    className="h-full bg-pink-600 rounded-full relative"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlayPause}
                      className="text-white hover:text-pink-500 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-pink-500 transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-pink-600"
                      />
                    </div>

                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="text-white hover:text-pink-500 transition-colors"
                    >
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Video preview will appear here</p>
            </div>
          )}
        </div>

        {/* Scene Editor Panel */}
        {selectedScene && (
          <div className="h-64 bg-gray-800 border-t border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Scene {selectedScene.sceneNumber} - {selectedScene.duration}s
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditingScene(selectedScene)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Edit scene text"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSceneDelete?.(selectedScene.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete scene"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scene Text Editor */}
              {editingSceneId === selectedScene.id ? (
                <div className="mb-4">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-24 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-pink-600 focus:border-transparent resize-none"
                    placeholder="Enter scene text..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={saveSceneEdit}
                      className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelSceneEdit}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedScene.text}</p>
                </div>
              )}

              {/* Scene Settings */}
              <div className="grid grid-cols-3 gap-4">
                <button className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white font-medium">Media</span>
                  </div>
                  <p className="text-xs text-gray-400">Change image/video</p>
                </button>

                <button className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white font-medium">Voice</span>
                  </div>
                  <p className="text-xs text-gray-400">Change voice-over</p>
                </button>

                <button className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white font-medium">Duration</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedScene.duration}s</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">Total: {formatTime(totalDuration)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onGenerateVideo}
                className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Generate Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
