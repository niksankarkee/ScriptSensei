'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, Globe, Clock, Plus, Search, Filter, Eye, Trash2, MoreVertical, Edit, Copy, Video } from 'lucide-react'
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
  }
}

export default function ScriptsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchScripts()
  }, [page])

  const fetchScripts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8011/api/v1/scripts?page=${page}&limit=12`)
      const data = await response.json()

      if (data.success) {
        setScripts(data.data || [])
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script? This action cannot be undone.')) {
      return
    }

    setDeletingId(scriptId)
    setOpenMenuId(null)
    try {
      const response = await fetch(`http://localhost:8011/api/v1/scripts/${scriptId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Remove script from list
        setScripts(scripts.filter(s => s.id !== scriptId))
        toast({
          title: "Success",
          description: "Script deleted successfully",
          variant: "success",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete script",
          variant: "error",
        })
      }
    } catch (error) {
      console.error('Failed to delete script:', error)
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "error",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopyScript = (script: Script) => {
    navigator.clipboard.writeText(script.content)
    setOpenMenuId(null)
    toast({
      title: "Success",
      description: "Script copied to clipboard",
      variant: "success",
    })
  }

  const handleCreateVideo = (scriptId: string) => {
    setOpenMenuId(null)
    router.push(`/dashboard/videos/new?scriptId=${scriptId}`)
  }

  const handleEditScript = (scriptId: string) => {
    setOpenMenuId(null)
    router.push(`/dashboard/scripts/${scriptId}`)
  }

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = platformFilter === 'all' || script.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      tiktok: 'bg-pink-100 text-pink-700',
      youtube: 'bg-red-100 text-red-700',
      youtube_shorts: 'bg-red-100 text-red-700',
      instagram_reel: 'bg-purple-100 text-purple-700',
      instagram_story: 'bg-purple-100 text-purple-700',
      facebook: 'bg-blue-100 text-blue-700',
    }
    return colors[platform] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Scripts</h1>
          <p className="mt-2 text-gray-600">
            {total} script{total !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Link
          href="/dashboard/scripts/new"
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Script</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Platform Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="instagram_reel">Instagram Reels</option>
              <option value="instagram_story">Instagram Stories</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scripts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || platformFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first script to get started'}
          </p>
          <Link
            href="/dashboard/scripts/new"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Script</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(script.platform)}`}>
                    {script.platform.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(script.created_at)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                  {script.topic}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {script.content}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {script.metadata?.word_count || 0} words
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {script.duration}s
                    </span>
                  </div>
                  <span className="flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    {script.language.toUpperCase()}
                  </span>
                </div>

                {script.metadata?.quality_score && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Quality Score</span>
                      <span className="text-xs font-medium text-indigo-600">
                        {script.metadata.quality_score}/100
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditScript(script.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <div className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === script.id ? null : script.id)
                      }}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      title="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === script.id && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => handleCreateVideo(script.id)}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4" />
                              <span>Create Video</span>
                            </div>
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/scripts/${script.id}/edit-scenes`)}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2">
                              <Edit className="h-4 w-4" />
                              <span>Edit as Scenes</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleCopyScript(script)}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2">
                              <Copy className="h-4 w-4" />
                              <span>Copy Content</span>
                            </div>
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/scripts/${script.id}`)}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4" />
                              <span>View Details</span>
                            </div>
                          </button>
                          <hr className="my-1 border-gray-200" />
                          <button
                            onClick={() => handleDelete(script.id)}
                            disabled={deletingId === script.id}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center space-x-2">
                              {deletingId === script.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > 12 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {Math.ceil(total / 12)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 12)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
