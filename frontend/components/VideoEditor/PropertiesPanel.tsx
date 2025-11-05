'use client'

import { useState } from 'react'
import { Type, Image as ImageIcon, Volume2, Sparkles, Settings } from 'lucide-react'
import type { Scene } from '@/app/dashboard/videos/[id]/edit/page'

interface PropertiesPanelProps {
  scene: Scene | null
  onSceneUpdate: (updates: Partial<Scene>) => void
}

type TabType = 'content' | 'visual' | 'audio' | 'effects'

export default function PropertiesPanel({
  scene,
  onSceneUpdate
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content')

  if (!scene) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select a scene to edit its properties</p>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'content', label: 'Content', icon: Type },
    { id: 'visual', label: 'Visual', icon: ImageIcon },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'effects', label: 'Effects', icon: Sparkles },
  ]

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
        <p className="text-xs text-gray-600 mt-0.5">Scene {scene.scene_number}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'content' && (
          <ContentTab scene={scene} onUpdate={onSceneUpdate} />
        )}
        {activeTab === 'visual' && (
          <VisualTab scene={scene} onUpdate={onSceneUpdate} />
        )}
        {activeTab === 'audio' && (
          <AudioTab scene={scene} onUpdate={onSceneUpdate} />
        )}
        {activeTab === 'effects' && (
          <EffectsTab scene={scene} onUpdate={onSceneUpdate} />
        )}
      </div>
    </div>
  )
}

// Content Tab
function ContentTab({
  scene,
  onUpdate
}: {
  scene: Scene
  onUpdate: (updates: Partial<Scene>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Scene Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Scene Narration
        </label>
        <textarea
          value={scene.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter narration text..."
        />
        <p className="mt-1 text-xs text-gray-500">
          {scene.text.split(' ').length} words • ~{Math.ceil(scene.text.split(' ').length / 3)}s estimated
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Duration (seconds)
        </label>
        <input
          type="number"
          min="1"
          max="60"
          value={scene.duration}
          onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 5 })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Text Overlay */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-700">
            Text Overlay
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={scene.text_overlay?.enabled || false}
              onChange={(e) =>
                onUpdate({
                  text_overlay: {
                    ...(scene.text_overlay || { text: '', position: 'center', style: 'default' }),
                    enabled: e.target.checked
                  }
                })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {scene.text_overlay?.enabled && scene.text_overlay && (
          <div className="space-y-3 pl-3 border-l-2 border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Text
              </label>
              <input
                type="text"
                value={scene.text_overlay.text}
                onChange={(e) =>
                  onUpdate({
                    text_overlay: {
                      enabled: scene.text_overlay!.enabled,
                      text: e.target.value,
                      position: scene.text_overlay!.position,
                      style: scene.text_overlay!.style
                    }
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Overlay text..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Position
              </label>
              <select
                value={scene.text_overlay.position}
                onChange={(e) =>
                  onUpdate({
                    text_overlay: {
                      enabled: scene.text_overlay!.enabled,
                      text: scene.text_overlay!.text,
                      position: e.target.value as 'top' | 'center' | 'bottom',
                      style: scene.text_overlay!.style
                    }
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Style
              </label>
              <select
                value={scene.text_overlay.style}
                onChange={(e) =>
                  onUpdate({
                    text_overlay: {
                      enabled: scene.text_overlay!.enabled,
                      text: scene.text_overlay!.text,
                      position: scene.text_overlay!.position,
                      style: e.target.value as 'default' | 'bold' | 'subtitle'
                    }
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="default">Default</option>
                <option value="bold">Bold</option>
                <option value="subtitle">Subtitle</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Visual Tab
function VisualTab({
  scene,
  onUpdate
}: {
  scene: Scene
  onUpdate: (updates: Partial<Scene>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Image URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Background Image URL
        </label>
        <input
          type="text"
          value={scene.image_url || ''}
          onChange={(e) => onUpdate({ image_url: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="https://..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Or upload from Media Library
        </p>
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Background Video URL
        </label>
        <input
          type="text"
          value={scene.video_url || ''}
          onChange={(e) => onUpdate({ video_url: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      {/* Animation */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Animation
        </label>
        <select
          value={scene.animation || 'none'}
          onChange={(e) =>
            onUpdate({
              animation: e.target.value as Scene['animation']
            })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="none">None</option>
          <option value="zoom-in">Zoom In</option>
          <option value="zoom-out">Zoom Out</option>
          <option value="pan-left">Pan Left</option>
          <option value="pan-right">Pan Right</option>
          <option value="ken-burns">Ken Burns Effect</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Adds motion to static images
        </p>
      </div>

      {/* Transition */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Transition to Next Scene
        </label>
        <select
          value={scene.transition || 'fade'}
          onChange={(e) =>
            onUpdate({
              transition: e.target.value as Scene['transition']
            })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="fade">Fade</option>
          <option value="cut">Cut</option>
          <option value="dissolve">Dissolve</option>
          <option value="slide">Slide</option>
          <option value="wipe">Wipe</option>
        </select>
      </div>

      {/* Preview */}
      {scene.image_url && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Preview
          </label>
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
            <img
              src={scene.image_url}
              alt="Scene preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50" y="50" text-anchor="middle" dy=".3em"%3ENo image%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Audio Tab
function AudioTab({
  scene,
  onUpdate
}: {
  scene: Scene
  onUpdate: (updates: Partial<Scene>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Voice Over */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Voice Over
        </label>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            Voice-over will be generated from scene narration text
          </p>
          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            Configure Voice Settings
          </button>
        </div>
      </div>

      {/* Background Audio */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Background Audio URL
        </label>
        <input
          type="text"
          value={scene.audio_url || ''}
          onChange={(e) => onUpdate({ audio_url: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      {/* Background Music */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Background Music
        </label>
        <select
          value={scene.background_music || ''}
          onChange={(e) => onUpdate({ background_music: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">No music</option>
          <option value="upbeat">Upbeat</option>
          <option value="calm">Calm</option>
          <option value="dramatic">Dramatic</option>
          <option value="corporate">Corporate</option>
          <option value="cinematic">Cinematic</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Or upload from Media Library
        </p>
      </div>

      {/* Volume Controls */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Voice-over Volume
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Music Volume
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="30"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>
    </div>
  )
}

// Effects Tab
function EffectsTab({
  scene,
  onUpdate
}: {
  scene: Scene
  onUpdate: (updates: Partial<Scene>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Visual Filter
        </label>
        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="">No filter</option>
          <option value="vintage">Vintage</option>
          <option value="bw">Black & White</option>
          <option value="sepia">Sepia</option>
          <option value="vibrant">Vibrant</option>
          <option value="cinematic">Cinematic</option>
        </select>
      </div>

      {/* Brightness */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Brightness
        </label>
        <input
          type="range"
          min="0"
          max="200"
          defaultValue="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Contrast */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Contrast
        </label>
        <input
          type="range"
          min="0"
          max="200"
          defaultValue="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Saturation */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Saturation
        </label>
        <input
          type="range"
          min="0"
          max="200"
          defaultValue="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Blur */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Blur
        </label>
        <input
          type="range"
          min="0"
          max="20"
          defaultValue="0"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Speed */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Playback Speed
        </label>
        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="0.5">0.5x (Slow)</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x (Normal)</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x (Fast)</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  )
}
