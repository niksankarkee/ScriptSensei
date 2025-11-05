'use client'

/**
 * Shape Editor Modal - Placeholder Component
 *
 * This is a placeholder for the shape editing functionality.
 * Full implementation will include direct canvas manipulation (drag, resize, rotate).
 *
 * Features to be implemented:
 * - Basic shapes (rectangle, circle, triangle, line, arrow)
 * - Text shapes
 * - Direct manipulation on canvas
 * - Properties panel (color, stroke, opacity, size)
 * - Layer ordering (bring to front, send to back)
 */

import { X, Square, Circle, Triangle, Type, ArrowRight, Minus } from 'lucide-react'

interface ShapeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onAddShape?: (shapeType: string) => void
}

const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: Square, description: 'Add a rectangle shape' },
  { id: 'circle', name: 'Circle', icon: Circle, description: 'Add a circle shape' },
  { id: 'triangle', name: 'Triangle', icon: Triangle, description: 'Add a triangle shape' },
  { id: 'line', name: 'Line', icon: Minus, description: 'Add a line' },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight, description: 'Add an arrow' },
  { id: 'text', name: 'Text', icon: Type, description: 'Add text shape' },
]

export default function ShapeEditorModal({
  isOpen,
  onClose,
  onAddShape
}: ShapeEditorModalProps) {
  if (!isOpen) return null

  const handleShapeSelect = (shapeType: string) => {
    onAddShape?.(shapeType)
    // In full implementation, this would add the shape to canvas
    // and enable direct manipulation mode
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Shape Editor</h2>
            <p className="text-sm text-gray-600 mt-1">Coming Soon - Direct canvas manipulation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Shape Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Shapes</h3>
            <div className="grid grid-cols-3 gap-3">
              {SHAPES.map(shape => (
                <button
                  key={shape.id}
                  onClick={() => handleShapeSelect(shape.id)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
                >
                  <shape.icon className="h-8 w-8 text-gray-600 group-hover:text-pink-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-pink-700">
                    {shape.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    {shape.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Features Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Planned Features
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Direct manipulation on canvas (drag, resize, rotate)</li>
              <li>• Customizable properties (color, stroke, opacity)</li>
              <li>• Layer management (ordering, grouping)</li>
              <li>• Shape presets and templates</li>
              <li>• Animation effects for shapes</li>
              <li>• Text inside shapes</li>
            </ul>
          </div>

          {/* Implementation Note */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              🚧 Implementation Note
            </h4>
            <p className="text-sm text-yellow-800">
              Shape editing requires Phase 5 (Canvas Manipulation) implementation.
              This will include Konva.js or Fabric.js integration for direct shape
              manipulation on the video canvas, similar to Fliki's implementation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
