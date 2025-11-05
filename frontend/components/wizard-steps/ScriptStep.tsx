'use client'

/**
 * Script Step Component
 *
 * Allows users to review and edit the generated script with markdown formatting
 * Renders markdown as formatted HTML (headings, paragraphs) instead of showing raw markdown syntax
 * Users can toggle between rendered view and edit mode
 */

import { useState, useRef } from 'react'
import { Sparkles, RefreshCw, ArrowRight, Edit3, Eye, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateScript, analyzeContent } from '@/lib/api/content-service'

interface ScriptStepProps {
  script: string
  onChange: (script: string) => void
  onNext: () => void
  onBack?: () => void
  // Optional wizard data for regeneration
  topic?: string
  platform?: string
  language?: string
  tone?: string
  duration?: number
}

type FormatType = 'H1' | 'H2' | 'Paragraph'

export function ScriptStep({ script, onChange, onNext, onBack, topic, platform, language, tone, duration }: ScriptStepProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeFormat, setActiveFormat] = useState<FormatType>('Paragraph')
  const [characterCount, setCharacterCount] = useState(script?.length || 0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const estimatedMinutes = Math.max(1, Math.ceil(characterCount / 1800))

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newScript = e.target.value
    onChange(newScript)
    setCharacterCount(newScript.length)
  }

  const applyFormat = (format: FormatType) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = script.substring(start, end)

    let formattedText = selectedText

    if (format === 'H1') {
      formattedText = `# ${selectedText || 'Heading 1'}`
    } else if (format === 'H2') {
      formattedText = `## ${selectedText || 'Heading 2'}`
    }

    const newScript =
      script.substring(0, start) + formattedText + script.substring(end)

    onChange(newScript)
    setCharacterCount(newScript.length)
    setActiveFormat(format)

    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + formattedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleRegenerateScript = async () => {
    if (!topic) {
      alert('Cannot regenerate without topic information. Please use the idea wizard.')
      return
    }

    setIsRegenerating(true)
    try {
      const result = await generateScript({
        topic,
        platform,
        language,
        tone,
        duration
      })

      onChange(result.content)
      setCharacterCount(result.content.length)

      // Show success message
      alert('Script regenerated successfully!')
    } catch (error) {
      console.error('Failed to regenerate script:', error)
      alert('Failed to regenerate script. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleEnhanceScript = async () => {
    if (!script?.trim()) {
      alert('Please enter a script first.')
      return
    }

    setIsEnhancing(true)
    try {
      const analysis = await analyzeContent(script)

      // Create enhanced version with suggestions
      const suggestions = analysis.suggestions?.join('\n') || 'No specific suggestions available.'
      const enhancementPrompt = `Quality Scores:\n- Hook: ${analysis.hook_score}/100\n- SEO: ${analysis.seo_score}/100\n- Engagement: ${analysis.engagement_score}/100\n- Overall: ${analysis.overall_quality}/100\n\nSuggestions:\n${suggestions}`

      // For now, show analysis results
      // In future, could call LLM to actually enhance the script
      if (confirm(`${enhancementPrompt}\n\nWould you like to regenerate the script with these improvements in mind?`)) {
        await handleRegenerateScript()
      }
    } catch (error: any) {
      console.error('Failed to enhance script:', error)
      // Check if it's a 404 error (endpoint not implemented yet)
      if (error?.status === 404 || error?.message?.includes('404')) {
        alert('The script enhancement feature is coming soon! The backend API endpoint is not yet implemented.')
      } else {
        alert('Failed to analyze script. Please try again.')
      }
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* View/Edit Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                onClick={() => applyFormat('H1')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  activeFormat === 'H1'
                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                H1
              </button>
              <button
                onClick={() => applyFormat('H2')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  activeFormat === 'H2'
                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                H2
              </button>
              <button
                onClick={() => setActiveFormat('Paragraph')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  activeFormat === 'Paragraph'
                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Paragraph
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {isEditMode ? (
            <>
              <Eye className="h-4 w-4" />
              Preview
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600">
        {isEditMode
          ? 'Edit your voiceover script. Use the format buttons to add headings.'
          : 'Review your voiceover script before generating your video. Click Edit to make changes.'
        }
      </p>

      {/* Script Display/Editor */}
      <div className="relative">
        {isEditMode ? (
          // Edit Mode - Show textarea
          <textarea
            ref={textareaRef}
            value={script}
            onChange={handleScriptChange}
            placeholder="Enter your script here..."
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent resize-none font-sans text-base leading-relaxed whitespace-pre-wrap"
            style={{ lineHeight: '1.6' }}
          />
        ) : (
          // Preview Mode - Render markdown
          <div className="w-full min-h-[24rem] max-h-96 overflow-y-auto p-6 border border-gray-300 rounded-lg bg-white">
            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-4 prose-h2:text-2xl prose-h2:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {script || '*No script content yet. Click Edit to add your script.*'}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Character count and AI actions */}
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <button
            onClick={handleRegenerateScript}
            disabled={isRegenerating || isEnhancing}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate script with AI"
          >
            {isRegenerating ? (
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5 text-indigo-600" />
            )}
          </button>
          <button
            onClick={handleEnhanceScript}
            disabled={isRegenerating || isEnhancing}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Analyze and enhance script with AI (Coming Soon)"
          >
            {isEnhancing ? (
              <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 text-green-600" />
            )}
          </button>
        </div>
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-end gap-4 text-sm">
        <span className={characterCount > 1800 ? 'text-pink-600' : 'text-gray-600'}>
          {characterCount} / 1800 characters
        </span>
        <span className="text-gray-600">~{estimatedMinutes} minutes of content</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          disabled={!script?.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
