'use client'

import { useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react'
import type { Scene } from '@/app/dashboard/videos/[id]/edit/page'

interface VideoPreviewProps {
  scene: Scene | null
  aspectRatio: string
  isPlaying: boolean
  currentTime: number
  onPlayPause: () => void
  onTimeUpdate: (time: number) => void
}

export default function VideoPreview({
  scene,
  aspectRatio,
  isPlaying,
  currentTime,
  onPlayPause,
  onTimeUpdate
}: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Get aspect ratio dimensions
  const getAspectRatioDimensions = () => {
    switch (aspectRatio) {
      case '16:9':
        return { width: 16, height: 9 }
      case '9:16':
        return { width: 9, height: 16 }
      case '1:1':
        return { width: 1, height: 1 }
      case '4:5':
        return { width: 4, height: 5 }
      case '4:3':
        return { width: 4, height: 3 }
      default:
        return { width: 16, height: 9 }
    }
  }

  const dimensions = getAspectRatioDimensions()
  const paddingBottom = `${(dimensions.height / dimensions.width) * 100}%`

  // Render scene preview on canvas
  useEffect(() => {
    if (!scene || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas resolution
    canvas.width = 1920
    canvas.height = Math.floor((1920 * dimensions.height) / dimensions.width)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background color
    ctx.fillStyle = '#1f2937' // gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load and draw background image if available
    if (scene.image_url || scene.visual_asset) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = scene.image_url || scene.visual_asset || ''
      img.onload = () => {
        // Apply animation (Ken Burns effect, zoom, pan, etc.)
        const progress = scene.duration > 0 ? Math.min(currentTime / scene.duration, 1) : 0

        switch (scene.animation) {
          case 'zoom-in':
            const scale = 1 + progress * 0.2 // Zoom from 1x to 1.2x
            const offsetX = (canvas.width * scale - canvas.width) / 2
            const offsetY = (canvas.height * scale - canvas.height) / 2
            ctx.drawImage(img, -offsetX, -offsetY, canvas.width * scale, canvas.height * scale)
            break
          case 'zoom-out':
            const scaleOut = 1.2 - progress * 0.2 // Zoom from 1.2x to 1x
            const offsetXOut = (canvas.width * scaleOut - canvas.width) / 2
            const offsetYOut = (canvas.height * scaleOut - canvas.height) / 2
            ctx.drawImage(img, -offsetXOut, -offsetYOut, canvas.width * scaleOut, canvas.height * scaleOut)
            break
          case 'pan-left':
            const panX = -progress * (canvas.width * 0.2)
            ctx.drawImage(img, panX, 0, canvas.width * 1.2, canvas.height)
            break
          case 'pan-right':
            const panRightX = progress * (canvas.width * 0.2)
            ctx.drawImage(img, panRightX, 0, canvas.width * 1.2, canvas.height)
            break
          case 'ken-burns':
            // Ken Burns: Combined zoom and pan
            const kbScale = 1 + progress * 0.15
            const kbPan = progress * (canvas.width * 0.1)
            const kbOffsetX = (canvas.width * kbScale - canvas.width) / 2 - kbPan
            const kbOffsetY = (canvas.height * kbScale - canvas.height) / 2
            ctx.drawImage(img, -kbOffsetX, -kbOffsetY, canvas.width * kbScale, canvas.height * kbScale)
            break
          default:
            // No animation - just fit image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }

        // Draw text overlay if enabled
        if (scene.text_overlay?.enabled && scene.text_overlay.text) {
          drawTextOverlay(ctx, canvas, scene.text_overlay)
        }
      }
      img.onerror = () => {
        // Fallback: show placeholder with scene text
        drawPlaceholder(ctx, canvas, scene)
      }
    } else {
      // No image: show placeholder
      drawPlaceholder(ctx, canvas, scene)
    }
  }, [scene, currentTime, dimensions])

  const drawPlaceholder = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scene: Scene) => {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#4f46e5') // indigo-600
    gradient.addColorStop(1, '#7c3aed') // purple-600
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Scene number
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = 'bold 200px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Scene ${scene.scene_number}`, canvas.width / 2, canvas.height / 2)

    // Scene text preview
    if (scene.text) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const maxWidth = canvas.width * 0.8
      const lines = wrapText(ctx, scene.text, maxWidth)
      const lineHeight = 60
      const startY = (canvas.height / 2) + 150

      lines.slice(0, 3).forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight)
      })
    }

    // Draw text overlay if enabled
    if (scene.text_overlay?.enabled && scene.text_overlay.text) {
      drawTextOverlay(ctx, canvas, scene.text_overlay)
    }
  }

  const drawTextOverlay = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    overlay: NonNullable<Scene['text_overlay']>
  ) => {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'

    let y = 0
    const padding = 40
    const textHeight = 80

    switch (overlay.position) {
      case 'top':
        y = padding
        break
      case 'bottom':
        y = canvas.height - textHeight - padding
        break
      case 'center':
      default:
        y = (canvas.height - textHeight) / 2
    }

    ctx.fillRect(0, y, canvas.width, textHeight)

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    switch (overlay.style) {
      case 'bold':
        ctx.font = 'bold 60px Arial'
        break
      case 'subtitle':
        ctx.font = '50px Arial'
        break
      default:
        ctx.font = '54px Arial'
    }

    ctx.fillText(overlay.text, canvas.width / 2, y + textHeight / 2)
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const width = ctx.measureText(currentLine + ' ' + word).width
      if (width < maxWidth) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    lines.push(currentLine)
    return lines
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-800">
        <div className="w-full max-w-5xl">
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom }}>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!scene && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400 text-lg">No scene selected</p>
              </div>
            )}
          </div>

          {/* Scene Info Overlay */}
          {scene && (
            <div className="mt-4 bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Scene {scene.scene_number}</span>
                  <span>{scene.duration}s</span>
                  {scene.transition && scene.transition !== 'fade' && (
                    <span className="text-xs px-2 py-0.5 bg-gray-600 rounded">
                      Transition: {scene.transition}
                    </span>
                  )}
                  {scene.animation && scene.animation !== 'none' && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-600 rounded">
                      {scene.animation}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {scene.image_url && <span className="text-blue-400">Image</span>}
                  {scene.audio_url && <span className="text-purple-400">Audio</span>}
                  {scene.text_overlay?.enabled && <span className="text-green-400">Text Overlay</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button className="p-2 rounded hover:bg-gray-700 text-gray-300">
            <SkipBack className="h-4 w-4" />
          </button>

          <button className="p-2 rounded hover:bg-gray-700 text-gray-300">
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-gray-400 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer group">
              <div className="relative h-full">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: scene ? `${(currentTime / scene.duration) * 100}%` : '0%' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: scene ? `${(currentTime / scene.duration) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 w-12">
              {scene ? formatTime(scene.duration) : '0:00'}
            </span>
          </div>

          <button className="p-2 rounded hover:bg-gray-700 text-gray-300">
            <Volume2 className="h-4 w-4" />
          </button>

          <button className="p-2 rounded hover:bg-gray-700 text-gray-300">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hidden audio element for voice-over playback */}
      {scene?.audio_url && (
        <audio
          ref={audioRef}
          src={scene.audio_url}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        />
      )}
    </div>
  )
}
