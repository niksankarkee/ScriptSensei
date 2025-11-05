'use client'

/**
 * Interactive Canvas Component
 *
 * Canvas-based editor for direct manipulation of video elements
 * - Add text, shapes, images
 * - Drag, resize, rotate elements
 * - Layer management
 * - Real-time preview
 */

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Text as KonvaText, Rect, Circle, Image as KonvaImage, Transformer } from 'react-konva'
import { Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2 } from 'lucide-react'

interface CanvasElement {
  id: string
  type: 'text' | 'rect' | 'circle' | 'image' | 'avatar'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  rotation?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  src?: string
  draggable: boolean
}

interface InteractiveCanvasProps {
  width: number
  height: number
  backgroundImage?: string
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
  onElementsChange?: (elements: CanvasElement[]) => void
}

export default function InteractiveCanvas({
  width,
  height,
  backgroundImage,
  aspectRatio,
  onElementsChange
}: InteractiveCanvasProps) {
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  // Calculate canvas dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    const maxWidth = width
    const maxHeight = height
    let canvasWidth = maxWidth
    let canvasHeight = maxHeight

    switch (aspectRatio) {
      case '16:9':
        canvasHeight = (canvasWidth * 9) / 16
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight
          canvasWidth = (canvasHeight * 16) / 9
        }
        break
      case '9:16':
        canvasWidth = (canvasHeight * 9) / 16
        if (canvasWidth > maxWidth) {
          canvasWidth = maxWidth
          canvasHeight = (canvasWidth * 16) / 9
        }
        break
      case '1:1':
        canvasWidth = canvasHeight = Math.min(maxWidth, maxHeight)
        break
      case '4:5':
        canvasHeight = (canvasWidth * 5) / 4
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight
          canvasWidth = (canvasHeight * 4) / 5
        }
        break
    }

    return { width: canvasWidth, height: canvasHeight }
  }

  const dimensions = getCanvasDimensions()

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const stage = stageRef.current
      const selectedNode = stage.findOne(`#${selectedId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer().batchDraw()
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [selectedId])

  // Notify parent of changes
  useEffect(() => {
    onElementsChange?.(elements)
  }, [elements, onElementsChange])

  const handleAddText = () => {
    const newText: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: dimensions.width / 2 - 50,
      y: dimensions.height / 2 - 20,
      text: 'Double click to edit',
      fontSize: 24,
      fontFamily: 'Inter',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 0.5,
      draggable: true
    }
    setElements([...elements, newText])
    setSelectedId(newText.id)
  }

  const handleAddRect = () => {
    const newRect: CanvasElement = {
      id: `rect-${Date.now()}`,
      type: 'rect',
      x: dimensions.width / 2 - 50,
      y: dimensions.height / 2 - 50,
      width: 100,
      height: 100,
      fill: '#FF6B9D',
      stroke: '#000000',
      strokeWidth: 2,
      draggable: true
    }
    setElements([...elements, newRect])
    setSelectedId(newRect.id)
  }

  const handleAddCircle = () => {
    const newCircle: CanvasElement = {
      id: `circle-${Date.now()}`,
      type: 'circle',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      radius: 50,
      fill: '#4ECDC4',
      stroke: '#000000',
      strokeWidth: 2,
      draggable: true
    }
    setElements([...elements, newCircle])
    setSelectedId(newCircle.id)
  }

  const handleDeleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId))
      setSelectedId(null)
    }
  }

  const handleDragEnd = (id: string, e: any) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, x: e.target.x(), y: e.target.y() } : el
    ))
  }

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    setElements(elements.map(el => {
      if (el.id === id) {
        if (el.type === 'rect') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation()
          }
        } else if (el.type === 'circle') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            radius: Math.max(5, el.radius! * Math.max(scaleX, scaleY)),
            rotation: node.rotation()
          }
        } else if (el.type === 'text') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(10, el.fontSize! * Math.max(scaleX, scaleY)),
            rotation: node.rotation()
          }
        }
      }
      return el
    }))

    // Reset scale after transform
    node.scaleX(1)
    node.scaleY(1)
  }

  const handleTextDblClick = (id: string, e: any) => {
    const textNode = e.target
    const textPosition = textNode.absolutePosition()

    // Hide text node
    textNode.hide()

    // Create textarea
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const element = elements.find(el => el.id === id)
    textarea.value = element?.text || ''
    textarea.style.position = 'absolute'
    textarea.style.top = `${textPosition.y}px`
    textarea.style.left = `${textPosition.x}px`
    textarea.style.width = `${textNode.width()}px`
    textarea.style.fontSize = `${element?.fontSize || 24}px`
    textarea.style.fontFamily = element?.fontFamily || 'Inter'
    textarea.style.border = '2px solid #FF6B9D'
    textarea.style.padding = '4px'
    textarea.style.margin = '0px'
    textarea.style.overflow = 'hidden'
    textarea.style.background = 'white'
    textarea.style.outline = 'none'
    textarea.style.resize = 'none'
    textarea.style.zIndex = '1000'

    textarea.focus()

    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea)
      textNode.show()
      const layer = textNode.getLayer()
      layer?.batchDraw()
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        setElements(elements.map(el =>
          el.id === id ? { ...el, text: textarea.value } : el
        ))
        removeTextarea()
      }
      if (e.key === 'Escape') {
        removeTextarea()
      }
    })

    textarea.addEventListener('blur', () => {
      setElements(elements.map(el =>
        el.id === id ? { ...el, text: textarea.value } : el
      ))
      removeTextarea()
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <button
          onClick={handleAddText}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors text-sm"
        >
          <Type className="h-4 w-4" />
          Add Text
        </button>
        <button
          onClick={handleAddRect}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          <Square className="h-4 w-4" />
          Rectangle
        </button>
        <button
          onClick={handleAddCircle}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
        >
          <CircleIcon className="h-4 w-4" />
          Circle
        </button>

        <div className="flex-1" />

        {selectedId && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}

        <div className="text-xs text-gray-400">
          {aspectRatio} • {dimensions.width.toFixed(0)}×{dimensions.height.toFixed(0)}
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden"
        onClick={() => setSelectedId(null)}
      >
        <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-black"
            onClick={(e) => {
              // Deselect when clicking on empty area
              if (e.target === e.target.getStage()) {
                setSelectedId(null)
              }
            }}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={dimensions.width}
                height={dimensions.height}
                fill="#1a1a1a"
              />

              {/* Elements */}
              {elements.map(element => {
                if (element.type === 'text') {
                  return (
                    <KonvaText
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      text={element.text}
                      fontSize={element.fontSize}
                      fontFamily={element.fontFamily}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      rotation={element.rotation}
                      draggable={element.draggable}
                      onClick={() => setSelectedId(element.id)}
                      onDblClick={(e) => handleTextDblClick(element.id, e)}
                      onDragEnd={(e) => handleDragEnd(element.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(element.id, e)}
                    />
                  )
                } else if (element.type === 'rect') {
                  return (
                    <Rect
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      rotation={element.rotation}
                      draggable={element.draggable}
                      onClick={() => setSelectedId(element.id)}
                      onDragEnd={(e) => handleDragEnd(element.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(element.id, e)}
                    />
                  )
                } else if (element.type === 'circle') {
                  return (
                    <Circle
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      radius={element.radius}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      rotation={element.rotation}
                      draggable={element.draggable}
                      onClick={() => setSelectedId(element.id)}
                      onDragEnd={(e) => handleDragEnd(element.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(element.id, e)}
                    />
                  )
                }
                return null
              })}

              {/* Transformer */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox
                  }
                  return newBox
                }}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                borderStroke="#FF6B9D"
                borderStrokeWidth={2}
                anchorStroke="#FF6B9D"
                anchorFill="#FFFFFF"
                anchorSize={8}
                rotateEnabled={true}
              />
            </Layer>
          </Stage>

          {/* Hint text */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <p className="text-sm mb-2">Click buttons above to add elements</p>
                <p className="text-xs">Drag to move • Double-click text to edit • Use handles to resize/rotate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info bar */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        {selectedId ? (
          <span>Selected: {elements.find(el => el.id === selectedId)?.type} • Press Delete or click button above</span>
        ) : (
          <span>{elements.length} element(s) • Click an element to select</span>
        )}
      </div>
    </div>
  )
}
