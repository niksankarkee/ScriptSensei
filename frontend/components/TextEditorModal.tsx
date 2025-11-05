'use client'

/**
 * Text Editor Modal Component
 *
 * Inline text editor for scene text layers matching Fliki's interface
 * Includes: Rich text editing, font controls, color picker, animations
 * Allows editing of scene narration text with formatting options
 */

import { useState, useEffect } from 'react'
import { X, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react'

interface TextEditorModalProps {
  isOpen: boolean
  onClose: () => void
  initialText: string
  onSaveText: (text: string, formatting?: TextFormatting) => void
}

interface TextFormatting {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  animation?: 'none' | 'fadeIn' | 'slideIn' | 'typewriter'
}

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat'
]

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]

const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideIn', label: 'Slide In' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'bounceIn', label: 'Bounce In' }
]

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#000080', '#808080', '#C0C0C0', '#FF69B4'
]

export default function TextEditorModal({
  isOpen,
  onClose,
  initialText,
  onSaveText
}: TextEditorModalProps) {
  const [text, setText] = useState(initialText)
  const [formatting, setFormatting] = useState<TextFormatting>({
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#000000',
    animation: 'none'
  })

  useEffect(() => {
    if (isOpen) {
      setText(initialText)
    }
  }, [isOpen, initialText])

  if (!isOpen) return null

  const handleSave = () => {
    onSaveText(text, formatting)
    onClose()
  }

  const toggleBold = () => {
    setFormatting(prev => ({
      ...prev,
      fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
    }))
  }

  const toggleItalic = () => {
    setFormatting(prev => ({
      ...prev,
      fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
    }))
  }

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    setFormatting(prev => ({ ...prev, textAlign: align }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Text</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 space-y-3">
          {/* Font Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Font Family */}
            <select
              value={formatting.fontFamily}
              onChange={(e) => setFormatting(prev => ({ ...prev, fontFamily: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {FONT_FAMILIES.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>

            {/* Font Size */}
            <select
              value={formatting.fontSize}
              onChange={(e) => setFormatting(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {FONT_SIZES.map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Bold */}
            <button
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                formatting.fontWeight === 'bold' ? 'bg-gray-200' : ''
              }`}
              title="Bold"
            >
              <Bold className="h-4 w-4 text-gray-700" />
            </button>

            {/* Italic */}
            <button
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                formatting.fontStyle === 'italic' ? 'bg-gray-200' : ''
              }`}
              title="Italic"
            >
              <Italic className="h-4 w-4 text-gray-700" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Alignment */}
            <button
              onClick={() => setAlignment('left')}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                formatting.textAlign === 'left' ? 'bg-gray-200' : ''
              }`}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4 text-gray-700" />
            </button>

            <button
              onClick={() => setAlignment('center')}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                formatting.textAlign === 'center' ? 'bg-gray-200' : ''
              }`}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4 text-gray-700" />
            </button>

            <button
              onClick={() => setAlignment('right')}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                formatting.textAlign === 'right' ? 'bg-gray-200' : ''
              }`}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4 text-gray-700" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-gray-700" />
              <input
                type="color"
                value={formatting.color}
                onChange={(e) => setFormatting(prev => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Text Color"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Quick colors:</span>
            <div className="flex gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormatting(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    formatting.color === color ? 'border-pink-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows={8}
              placeholder="Enter your text here..."
              style={{
                fontFamily: formatting.fontFamily,
                fontSize: `${formatting.fontSize}px`,
                fontWeight: formatting.fontWeight,
                fontStyle: formatting.fontStyle,
                textAlign: formatting.textAlign,
                color: formatting.color
              }}
            />
          </div>

          {/* Animation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Animation
            </label>
            <select
              value={formatting.animation}
              onChange={(e) => setFormatting(prev => ({
                ...prev,
                animation: e.target.value as TextFormatting['animation']
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {ANIMATIONS.map(anim => (
                <option key={anim.value} value={anim.value}>{anim.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div
              className="w-full min-h-[100px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              style={{
                fontFamily: formatting.fontFamily,
                fontSize: `${formatting.fontSize}px`,
                fontWeight: formatting.fontWeight,
                fontStyle: formatting.fontStyle,
                textAlign: formatting.textAlign,
                color: formatting.color
              }}
            >
              {text || 'Preview will appear here...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {text.length} characters
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
