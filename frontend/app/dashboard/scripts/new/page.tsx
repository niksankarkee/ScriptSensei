'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Copy, Download, Loader2, FileText } from 'lucide-react'

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', maxDuration: 180, aspectRatio: '9:16' },
  { id: 'youtube', name: 'YouTube', maxDuration: 0, aspectRatio: '16:9' },
  { id: 'youtube_shorts', name: 'YouTube Shorts', maxDuration: 60, aspectRatio: '9:16' },
  { id: 'instagram_reel', name: 'Instagram Reels', maxDuration: 90, aspectRatio: '9:16' },
  { id: 'instagram_story', name: 'Instagram Stories', maxDuration: 15, aspectRatio: '9:16' },
  { id: 'facebook', name: 'Facebook', maxDuration: 0, aspectRatio: '16:9' },
]

const TONES = [
  'professional',
  'casual',
  'inspirational',
  'humorous',
  'educational',
  'entertaining',
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'id', name: 'Indonesian' },
  { code: 'th', name: 'Thai (ภาษาไทย)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ms', name: 'Malay' },
]

export default function NewScriptPage() {
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [tone, setTone] = useState('professional')
  const [duration, setDuration] = useState(60)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<any>(null)
  const [error, setError] = useState('')
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({})

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)

  // Load template from session storage if coming from templates page
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId) {
      const templateData = sessionStorage.getItem('selectedTemplate')
      if (templateData) {
        const template = JSON.parse(templateData)
        setSelectedTemplate(template)
        setPlatform(template.platform)
        setTone(template.tone)
        setDuration(template.duration)
        setLanguage(template.language)

        // Extract placeholders from template prompt
        const placeholders = template.promptTemplate.match(/\{(\w+)\}/g)
        if (placeholders) {
          const fields: Record<string, string> = {}
          placeholders.forEach((ph: string) => {
            const key = ph.replace(/[{}]/g, '')
            fields[key] = ''
          })
          setTemplateFields(fields)
        }
      }
    }
  }, [searchParams])

  const handleGenerate = async () => {
    // Validate inputs
    if (selectedTemplate) {
      // Check if all template fields are filled
      const missingFields = Object.entries(templateFields).filter(([_, value]) => !value.trim())
      if (missingFields.length > 0) {
        setError(`Please fill in all fields: ${missingFields.map(([key]) => key).join(', ')}`)
        return
      }
    } else {
      if (!topic.trim()) {
        setError('Please enter a topic')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      // Build topic from template if using template
      let finalTopic = topic
      if (selectedTemplate) {
        finalTopic = selectedTemplate.promptTemplate
        Object.entries(templateFields).forEach(([key, value]) => {
          finalTopic = finalTopic.replace(`{${key}}`, value)
        })
      }

      const response = await fetch('http://localhost:8011/api/v1/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: finalTopic,
          platform,
          tone,
          duration,
          language,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedScript(data.data)
        // Show save notification
        setShowSaveNotification(true)
        setTimeout(() => setShowSaveNotification(false), 5000)
      } else {
        setError(data.error || 'Failed to generate script')
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the Content Service is running.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript.content)
      alert('Script copied to clipboard!')
    }
  }

  const downloadScript = () => {
    if (generatedScript) {
      const blob = new Blob([generatedScript.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleSaveScript = () => {
    if (generatedScript) {
      // Script is already saved in the database when generated
      // Just navigate to the script detail page
      window.location.href = `/dashboard/scripts/${generatedScript.id}`
    }
  }

  const handleCreateVideo = () => {
    if (generatedScript) {
      // Navigate to video creation page with script ID
      window.location.href = `/dashboard/videos/new?scriptId=${generatedScript.id}`
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Save Notification */}
      {showSaveNotification && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-800">
            Script automatically saved! You can find it in your Scripts library.
          </span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate AI Script</h1>
        <p className="mt-2 text-gray-600">
          Create engaging scripts optimized for any platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Script Details</h2>

          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-indigo-900">{selectedTemplate.name}</h3>
                    <p className="text-sm text-indigo-700 mt-1">{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template Fields or Topic */}
            {selectedTemplate ? (
              Object.keys(templateFields).map((fieldKey) => (
                <div key={fieldKey}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {fieldKey.replace(/([A-Z])/g, ' $1').trim()} *
                  </label>
                  <input
                    type="text"
                    value={templateFields[fieldKey]}
                    onChange={(e) => setTemplateFields({
                      ...templateFields,
                      [fieldKey]: e.target.value
                    })}
                    placeholder={`Enter ${fieldKey.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Benefits of morning meditation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.maxDuration > 0 ? ` (max ${p.maxDuration}s)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds): {duration}s
              </label>
              <input
                type="range"
                min="15"
                max={selectedPlatform?.maxDuration || 300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15s</span>
                <span>{selectedPlatform?.maxDuration || 300}s</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Script Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Generated Script</h2>
            {generatedScript && (
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  onClick={downloadScript}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {!generatedScript && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                Your generated script will appear here
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Creating your script...</p>
            </div>
          )}

          {generatedScript && (
            <div className="space-y-4">
              {/* Script Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm font-medium text-gray-900">
                    {generatedScript.metadata?.provider || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Word Count</p>
                  <p className="text-sm font-medium text-gray-900">
                    {generatedScript.metadata?.word_count || 0} words
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estimated Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {generatedScript.metadata?.estimated_duration || 0}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quality Score</p>
                  <p className="text-sm font-medium text-gray-900">
                    {generatedScript.metadata?.quality_score || 0}/100
                  </p>
                </div>
              </div>

              {/* Script Content */}
              <div className="p-4 bg-gray-50 rounded-md max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                  {generatedScript.content}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveScript}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Script Details
                </button>
                <button
                  onClick={handleCreateVideo}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Create Video
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
