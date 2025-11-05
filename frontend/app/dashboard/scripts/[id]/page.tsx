'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Download, Edit, Trash2, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '@/hooks/use-toast'

interface Script {
  id: string
  topic: string
  platform: string
  tone: string
  duration: number
  language: string
  content: string
  provider_used: string
  created_at: string
  metadata?: {
    word_count?: number
    quality_score?: number
    hook_score?: number
    estimated_duration?: number
  }
}

export default function ScriptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        setEditedContent(data.data.content || '')
      }
    } catch (error) {
      console.error('Failed to fetch script:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (script) {
      navigator.clipboard.writeText(script.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadScript = () => {
    if (script) {
      const blob = new Blob([script.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = script.topic
        ? `${script.topic.replace(/\s+/g, '-').toLowerCase()}.txt`
        : `script-${script.id}.txt`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!script) return

    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:8011/api/v1/scripts/${script.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setScript({ ...script, content: editedContent })
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Script updated successfully!",
          variant: "success",
        })
      }
    } catch (error) {
      console.error('Failed to update script:', error)
      toast({
        title: "Error",
        description: "Failed to update script. Please try again.",
        variant: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedContent(script?.content || '')
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!script) return

    if (confirm('Are you sure you want to delete this script?')) {
      setIsDeleting(true)
      try {
        const response = await fetch(`http://localhost:8011/api/v1/scripts/${script.id}`, {
          method: 'DELETE',
        })

        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: "Script deleted successfully",
            variant: "success",
          })
          router.push('/dashboard/scripts')
        }
      } catch (error) {
        console.error('Failed to delete script:', error)
        toast({
          title: "Error",
          description: "Failed to delete script. Please try again.",
          variant: "error",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleCreateVideo = () => {
    if (script) {
      router.push(`/dashboard/videos/new?scriptId=${script.id}`)
    }
  }

  const handleDuplicate = async () => {
    if (!script) return

    try {
      const response = await fetch('http://localhost:8011/api/v1/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: script.topic + ' (Copy)',
          platform: script.platform,
          tone: script.tone,
          duration: script.duration,
          language: script.language,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Script duplicated successfully",
          variant: "success",
        })
        router.push(`/dashboard/scripts/${data.data.id}`)
      }
    } catch (error) {
      console.error('Failed to duplicate script:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate script. Please try again.",
        variant: "error",
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
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
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/scripts"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to scripts</span>
      </Link>

      {/* Script Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{script.topic}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                {script.platform.replace('_', ' ')}
              </span>
              <span>{script.tone} tone</span>
              <span>{script.duration}s duration</span>
              <span>{script.language.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              onClick={downloadScript}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Edit"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Metadata */}
        {script.metadata && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Word Count</div>
              <div className="text-lg font-semibold text-gray-900">
                {script.metadata.word_count || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Est. Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {script.metadata.estimated_duration || 0}s
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Quality Score</div>
              <div className="text-lg font-semibold text-indigo-600">
                {script.metadata.quality_score || 0}/100
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Hook Score</div>
              <div className="text-lg font-semibold text-indigo-600">
                {script.metadata.hook_score || 0}/100
              </div>
            </div>
          </div>
        )}

        {/* Script Content */}
        <div className="prose max-w-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Script Content</h3>
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-6 bg-gray-50 rounded-md font-mono text-sm text-gray-800 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={15}
            />
          ) : (
            <div className="p-6 bg-gray-50 rounded-md prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {script.content || 'No content available'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
          Generated by {script.provider_used} on{' '}
          {new Date(script.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={handleCreateVideo}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Video from Script
        </button>
        <Link
          href={`/dashboard/scripts/${script.id}/edit-scenes`}
          className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-center"
        >
          Edit as Scenes
        </Link>
        <button
          onClick={handleDuplicate}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Duplicate Script
        </button>
      </div>
    </div>
  )
}
