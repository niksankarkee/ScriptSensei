'use client'

/**
 * Video Creation Wizard Component
 *
 * Multi-step wizard for creating videos similar to Fliki's workflow
 * Steps: Template → Script → Styles → Customization
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { IdeaStep } from './wizard-steps/IdeaStep'
import { TemplateStep } from './wizard-steps/TemplateStep'
import { ScriptStep } from './wizard-steps/ScriptStep'
import { StylesStep } from './wizard-steps/StylesStep'
import { CustomizationStep } from './wizard-steps/CustomizationStep'

export interface VideoWizardData {
  // Idea step (for idea mode)
  topic: string
  duration: number

  // Template step
  aspectRatio: '9:16' | '1:1' | '16:9'
  template?: string

  // Styles step
  language: string
  dialect: string
  tone: string
  purpose: string
  audience: string
  scriptStyle: string

  // Script step
  script: string

  // Customization step
  voiceId: string
  mediaType: 'stock' | 'ai'
  useAvatar: boolean
}

interface VideoCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<VideoWizardData>
  mode: 'idea' | 'script'
  onSubmit: (data: VideoWizardData) => Promise<void>
}

export default function VideoCreationWizard({
  isOpen,
  onClose,
  initialData,
  mode,
  onSubmit
}: VideoCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)

  const [wizardData, setWizardData] = useState<VideoWizardData>({
    topic: '',
    duration: 30,
    aspectRatio: '16:9',
    language: 'en',
    dialect: 'United States',
    tone: 'informative',
    purpose: 'education',
    audience: 'young adults',
    scriptStyle: 'Enthusiastic and engaging like a travel blogger',
    script: initialData?.script || '',
    voiceId: 'en-US-Neural2-A',
    mediaType: 'stock',
    useAvatar: false,
    ...initialData
  })

  const totalSteps = mode === 'script' ? 3 : 5

  const steps = mode === 'script'
    ? ['Script', 'Template', 'Customization']
    : ['Prompt', 'Template', 'Styles', 'Script', 'Customization']

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const cleanScript = (rawScript: string): string => {
    // Split into lines
    let lines = rawScript.split('\n')

    // Process each line
    const cleaned = lines
      .map(line => {
        // Remove scene markers like "**Scene 1:**", "Scene 1 Start:", "Scene End:", etc.
        line = line.replace(/^\*\*Scene\s+\d+:?\*\*/i, '')
        line = line.replace(/^Scene\s+\d+\s*Start:?/i, '')
        line = line.replace(/^Scene\s+\d+\s*End:?/i, '')
        line = line.replace(/^\*\*Scene\s+Start:?\*\*/i, '')
        line = line.replace(/^\*\*Scene\s+End:?\*\*/i, '')

        // Remove Nepali scene directions in parentheses like "(पहिलो दृश्य: ...)", "(दोस्रो दृश्य: ...)", etc.
        line = line.replace(/\([^)]*(?:दृश्य|पहिलो|दोस्रो|तेस्रो|चौथो|पाँचौं|छैटौं|सातौं|आठौं|नवौं|दशौं)[^)]*\)/gi, '')

        // Remove English scene directions in parentheses
        line = line.replace(/\([^)]*(?:first scene|second scene|third scene|scene \d+|दृश्य \d+)[^)]*\)/gi, '')

        // Remove voice directions in parentheses like "(Smiling, friendly voice)", "(Excited tone)", etc.
        line = line.replace(/\([^)]*(?:voice|tone|smiling|excited|calm|serious|friendly|energetic|enthusiastic)[^)]*\)/gi, '')

        // Remove standalone stage directions in parentheses
        line = line.replace(/\*\*\([^)]+\)\*\*/g, '')
        line = line.replace(/\([^)]*(?:seconds?|Visual|Host|Voiceover|Narrator|Camera|Shot|Music|Sound|झण्डा|मन्दिर|पर्वत|हिमाल)[^)]*\)/gi, '')

        // Remove visual cues at start of line
        line = line.replace(/^\*\*(?:Visual|Host|Voiceover|Narrator|Camera|Shot|Music|Sound):\*\*/i, '')

        // Remove standalone bracketed directions like "[Scene changes]", "[Cut to]", etc.
        line = line.replace(/\[[^\]]*(?:scene|cut|fade|transition|music|sound|दृश्य)[^\]]*\]/gi, '')

        return line.trim()
      })
      .filter(line => {
        // Remove empty lines and lines that are just scene markers
        if (line.length === 0) return false
        if (/^Scene\s+\d+$/i.test(line)) return false
        if (/^Scene\s+Start$/i.test(line)) return false
        if (/^Scene\s+End$/i.test(line)) return false
        // Remove lines that are only scene directions
        if (/^\([^)]*(?:दृश्य|scene)[^)]*\)$/i.test(line)) return false
        return true
      })
      .map(line => {
        // Preserve markdown headings (lines starting with #)
        if (line.startsWith('#')) {
          return line
        }
        // Return regular text
        return line
      })

    // Join with proper spacing - headings get single line break, text gets double
    let result = ''
    for (let i = 0; i < cleaned.length; i++) {
      const currentLine = cleaned[i]
      const nextLine = cleaned[i + 1]

      result += currentLine

      if (nextLine) {
        // If current line is a heading or next line is a heading, single line break
        if (currentLine.startsWith('#') || nextLine.startsWith('#')) {
          result += '\n\n'
        } else {
          // Regular text gets double line break
          result += '\n\n'
        }
      }
    }

    return result.trim()
  }

  const handleGenerateScript = async () => {
    // Generate script after Styles step (step 3)
    setIsGeneratingScript(true)

    // Move to script step immediately to show live generation
    setCurrentStep(currentStep + 1)

    // Clear existing script
    setWizardData(prev => ({ ...prev, script: '' }))

    try {
      const response = await fetch('http://localhost:8011/api/v1/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: wizardData.topic,
          platform: 'youtube',
          tone: wizardData.tone,
          duration: wizardData.duration,
          language: wizardData.language,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Clean the generated script to remove stage directions and formatting
        const cleanedScript = cleanScript(data.data.content)

        // Simulate streaming effect by showing text gradually
        let currentText = ''
        const words = cleanedScript.split(' ')

        for (let i = 0; i < words.length; i++) {
          currentText += (i > 0 ? ' ' : '') + words[i]
          setWizardData(prev => ({
            ...prev,
            script: currentText
          }))
          // Adjust delay for speed (10ms = fast, 50ms = slower)
          await new Promise(resolve => setTimeout(resolve, 15))
        }
      } else {
        console.error('Failed to generate script:', data.error)
        alert('Failed to generate script. Please try again.')
        // Go back to styles step on error
        setCurrentStep(currentStep)
      }
    } catch (error) {
      console.error('Failed to generate script:', error)
      alert('Failed to connect to script service. Please try again.')
      // Go back to styles step on error
      setCurrentStep(currentStep)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(wizardData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateData = (updates: Partial<VideoWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'idea' ? 'Idea (prompt) to video' : 'Script to video'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isActive = stepNumber === currentStep
              const isCompleted = stepNumber < currentStep

              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
                        isActive
                          ? 'bg-pink-600 text-white'
                          : isCompleted
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    <span
                      className={`text-sm ${
                        isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2 mb-6" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {mode === 'script' ? (
            <>
              {currentStep === 1 && (
                <ScriptStep
                  script={wizardData.script}
                  onChange={(script) => updateData({ script })}
                  onNext={handleNext}
                  topic={wizardData.topic}
                  platform="YouTube"
                  language={wizardData.language}
                  tone={wizardData.tone}
                  duration={wizardData.duration}
                />
              )}
              {currentStep === 2 && (
                <TemplateStep
                  aspectRatio={wizardData.aspectRatio}
                  selectedTemplate={wizardData.template}
                  onChange={(data) => updateData(data)}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <CustomizationStep
                  voiceId={wizardData.voiceId}
                  mediaType={wizardData.mediaType}
                  useAvatar={wizardData.useAvatar}
                  onChange={(data) => updateData(data)}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          ) : (
            <>
              {/* Step 1: Prompt - User enters topic, duration, and resources */}
              {currentStep === 1 && (
                <IdeaStep
                  topic={wizardData.topic}
                  duration={wizardData.duration}
                  onChange={(data) => updateData(data)}
                  onNext={handleNext}
                />
              )}
              {/* Step 2: Template - User selects aspect ratio and template */}
              {currentStep === 2 && (
                <TemplateStep
                  aspectRatio={wizardData.aspectRatio}
                  selectedTemplate={wizardData.template}
                  onChange={(data) => updateData(data)}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {/* Step 3: Styles - User configures language, tone, etc. Then generates script */}
              {currentStep === 3 && (
                <StylesStep
                  language={wizardData.language}
                  dialect={wizardData.dialect}
                  tone={wizardData.tone}
                  purpose={wizardData.purpose}
                  audience={wizardData.audience}
                  scriptStyle={wizardData.scriptStyle}
                  onChange={(data) => updateData(data)}
                  onNext={handleGenerateScript}
                  onBack={handleBack}
                  isGenerating={isGeneratingScript}
                />
              )}
              {/* Step 4: Script - User reviews and edits the generated script */}
              {currentStep === 4 && (
                <ScriptStep
                  script={wizardData.script}
                  onChange={(script) => updateData({ script })}
                  onNext={handleNext}
                  onBack={handleBack}
                  topic={wizardData.topic}
                  platform="YouTube"
                  language={wizardData.language}
                  tone={wizardData.tone}
                  duration={wizardData.duration}
                />
              )}
              {/* Step 5: Customization - User selects voice, media type, avatar */}
              {currentStep === 5 && (
                <CustomizationStep
                  voiceId={wizardData.voiceId}
                  mediaType={wizardData.mediaType}
                  useAvatar={wizardData.useAvatar}
                  onChange={(data) => updateData(data)}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
