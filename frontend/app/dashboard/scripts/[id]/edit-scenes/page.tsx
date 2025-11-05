'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SceneEditor, { Scene } from '@/components/ScriptEditor/SceneEditor'
import { useToast } from '@/hooks/use-toast'

interface Script {
  id: string
  topic: string
  platform: string
  content: string
}

export default function EditScenesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [script, setScript] = useState<Script | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchScript(params.id as string)
    }
  }, [params.id])

  const fetchScript = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8011/api/v1/scripts/${id}`)
      const data = await response.json()

      if (data.success) {
        setScript(data.data)
        // Parse script content into scenes
        const parsedScenes = parseContentIntoScenes(data.data.content)
        setScenes(parsedScenes)
      }
    } catch (error) {
      console.error('Failed to fetch script:', error)
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to load script. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const parseContentIntoScenes = (content: string): Scene[] => {
    // Split content into paragraphs or sentences
    const paragraphs = content
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0)

    if (paragraphs.length === 0) {
      return [{
        id: `scene-1`,
        scene_number: 1,
        text: content,
        duration: 5,
        transition: 'fade'
      }]
    }

    return paragraphs.map((text, index) => ({
      id: `scene-${index + 1}`,
      scene_number: index + 1,
      text: text.trim(),
      duration: Math.max(3, Math.min(15, Math.ceil(text.split(' ').length / 3))), // Estimate ~3 words per second
      transition: 'fade' as const
    }))
  }

  const handleSaveScenes = async (updatedScenes: Scene[]) => {
    if (!script) return

    // Convert scenes back to content format
    const updatedContent = updatedScenes
      .map(scene => scene.text)
      .join('\n\n')

    try {
      const response = await fetch(`http://localhost:8011/api/v1/scripts/${script.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updatedContent,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setScript({ ...script, content: updatedContent })
        setScenes(updatedScenes)
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Script scenes updated successfully'
        })
      }
    } catch (error) {
      console.error('Failed to update script:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Script not found</h2>
        <Link
          href="/dashboard/scripts"
          className="text-indigo-600 hover:text-indigo-700"
        >
          Back to scripts
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Link
        href={`/dashboard/scripts/${script.id}`}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to script</span>
      </Link>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Scenes</h1>
        <p className="text-gray-600">
          Break down your script into individual scenes for better control over timing and visuals
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {script.platform.replace('_', ' ')}
          </span>
          <span className="ml-2 text-sm text-gray-600">{script.topic}</span>
        </div>
      </div>

      {/* Scene Editor Component */}
      <SceneEditor
        initialScenes={scenes}
        scriptId={script.id}
        onSave={handleSaveScenes}
      />

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Scene Editor Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Drag scenes to reorder them</li>
          <li>Adjust duration for each scene to control pacing</li>
          <li>Choose transition effects between scenes</li>
          <li>Click "Edit" to modify scene text</li>
          <li>Optimal scene duration: 3-10 seconds for short-form content</li>
        </ul>
      </div>
    </div>
  )
}
