'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import VideoCreationWizard, { VideoWizardData } from '@/components/VideoCreationWizard'

export default function CreatePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [showWizard, setShowWizard] = useState(false)
  const [wizardMode, setWizardMode] = useState<'idea' | 'script'>('idea')

  const handleOpenWizard = (mode: 'idea' | 'script') => {
    setWizardMode(mode)
    setShowWizard(true)
  }

  const handleWizardSubmit = async (data: VideoWizardData) => {
    try {
      // Generate a unique script ID for this video generation request
      const scriptId = `script_${crypto.randomUUID()}`
      const scriptContent = data.script

      // If this is idea mode and we don't have a script yet, generate it
      if (wizardMode === 'idea' && !scriptContent) {
        toast({
          title: "Error",
          description: "Script content is required",
          variant: "error",
        })
        return
      }

      // Create video with all wizard data
      console.log('[CreatePage] 🎬 Submitting video generation request:', {
        aspect_ratio: data.aspectRatio,
        language: data.language,
        voice_id: data.voiceId,
        media_type: data.mediaType,
        template: data.template,
      })

      const response = await fetch('http://localhost:8012/api/v1/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_id: scriptId,
          script_content: scriptContent,
          platform: 'youtube', // Can be derived from aspect ratio or added to wizard
          language: data.language,
          voice_id: data.voiceId,
          voice_provider: 'azure',
          visual_style: data.mediaType === 'ai' ? 'ai_generated' : 'stock',
          aspect_ratio: data.aspectRatio,
          resolution: '1080p',
          user_id: 'user_123', // TODO: Get from Clerk

          // New wizard fields
          template: data.template,
          dialect: data.dialect,
          tone: data.tone,
          purpose: data.purpose,
          audience: data.audience,
          script_style: data.scriptStyle,
          media_type: data.mediaType,
          use_avatar: data.useAvatar,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Get video ID from response
        const videoId = result.data?.id || result.video_id || result.id

        if (!videoId) {
          console.error('No video ID in response:', result)
          toast({
            title: "Error",
            description: "Failed to get video ID from server",
            variant: "error",
          })
          return
        }

        console.log('[CreatePage] Video created successfully, ID:', videoId)

        toast({
          title: "Success",
          description: "Video generation started!",
          variant: "success",
        })
        setShowWizard(false)

        // Redirect to progress page instead of videos list
        router.push(`/dashboard/videos/${videoId}/generate`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create video",
          variant: "error",
        })
      }
    } catch (error) {
      console.error('Failed to create video:', error)
      toast({
        title: "Error",
        description: "Failed to connect to video service",
        variant: "error",
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Video</h1>
        <p className="mt-2 text-gray-600">
          Transform your idea into an AI-powered video in minutes
        </p>
      </div>

      {/* Creation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Idea to Video */}
        <button
          onClick={() => handleOpenWizard('idea')}
          className="group relative bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-pink-500 hover:shadow-lg transition-all p-8 text-left"
        >
          <div className="absolute top-4 right-4 px-3 py-1 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">
            POPULAR
          </div>
          <div className="mb-4">
            <Sparkles className="h-12 w-12 text-pink-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Idea to Video</h3>
          <p className="text-gray-600 mb-4">
            Start with a topic or prompt and let AI generate the complete video for you
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              AI-generated script
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Template selection
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Style customization
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Full control
            </li>
          </ul>
          <div className="mt-6 flex items-center text-pink-600 font-semibold group-hover:translate-x-2 transition-transform">
            Get Started
            <svg className="h-5 w-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {/* Script to Video */}
        <button
          onClick={() => handleOpenWizard('script')}
          className="group bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all p-8 text-left"
        >
          <div className="mb-4">
            <FileText className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Script to Video</h3>
          <p className="text-gray-600 mb-4">
            Already have a script? Convert it directly to video with our wizard
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Paste your script
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Edit with formatting
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Choose template
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Customize voice
            </li>
          </ul>
          <div className="mt-6 flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform">
            Get Started
            <svg className="h-5 w-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-pink-50 rounded-lg p-8 border border-indigo-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">What you can create:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl mb-2">🎥</div>
            <h4 className="font-semibold text-gray-900 mb-1">Short-form Content</h4>
            <p className="text-sm text-gray-600">TikToks, Reels, YouTube Shorts optimized for virality</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-semibold text-gray-900 mb-1">Social Media Videos</h4>
            <p className="text-sm text-gray-600">Platform-specific content with perfect formatting</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🎬</div>
            <h4 className="font-semibold text-gray-900 mb-1">Long-form Videos</h4>
            <p className="text-sm text-gray-600">YouTube videos, tutorials, and educational content</p>
          </div>
        </div>
      </div>

      {/* Video Creation Wizard */}
      <VideoCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        mode={wizardMode}
        onSubmit={handleWizardSubmit}
      />
    </div>
  )
}
