'use client'

import { useRef } from 'react'
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

interface KonvaCanvasProps {
  canvasWidth: number
  canvasHeight: number
  sceneNumber: number
  sceneText: string
  imageUrl?: string
  textOverlay?: {
    enabled: boolean
    text: string
    position: 'top' | 'center' | 'bottom'
    style: 'default' | 'bold' | 'subtitle'
  }
}

function SceneImage({ src, width, height }: { src: string; width: number; height: number }) {
  const [image] = useImage(src, 'anonymous')

  if (!image) {
    return null
  }

  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={width}
      height={height}
    />
  )
}

export default function KonvaCanvas({
  canvasWidth,
  canvasHeight,
  sceneNumber,
  sceneText,
  imageUrl,
  textOverlay
}: KonvaCanvasProps) {
  const stageRef = useRef<any>(null)

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth}
      height={canvasHeight}
      scale={{ x: 0.5, y: 0.5 }}
      style={{
        width: canvasWidth * 0.5,
        height: canvasHeight * 0.5
      }}
    >
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="#1f2937"
        />

        {/* Scene Background Image */}
        {imageUrl && (
          <SceneImage
            src={imageUrl}
            width={canvasWidth}
            height={canvasHeight}
          />
        )}

        {/* Scene Number Placeholder */}
        {!imageUrl && (
          <>
            <KonvaText
              x={0}
              y={canvasHeight / 2 - 100}
              width={canvasWidth}
              text={`Scene ${sceneNumber}`}
              fontSize={200}
              fontStyle="bold"
              fill="rgba(255, 255, 255, 0.3)"
              align="center"
            />
            <KonvaText
              x={canvasWidth * 0.1}
              y={canvasHeight / 2 + 150}
              width={canvasWidth * 0.8}
              text={sceneText || ''}
              fontSize={48}
              fill="rgba(255, 255, 255, 0.95)"
              align="center"
            />
          </>
        )}

        {/* Text Overlay */}
        {textOverlay?.enabled && textOverlay.text && (
          <>
            <Rect
              x={0}
              y={textOverlay.position === 'top' ? 40 :
                 textOverlay.position === 'bottom' ? canvasHeight - 120 :
                 canvasHeight / 2 - 40}
              width={canvasWidth}
              height={80}
              fill="rgba(0, 0, 0, 0.7)"
            />
            <KonvaText
              x={0}
              y={textOverlay.position === 'top' ? 60 :
                 textOverlay.position === 'bottom' ? canvasHeight - 100 :
                 canvasHeight / 2 - 20}
              width={canvasWidth}
              text={textOverlay.text}
              fontSize={textOverlay.style === 'bold' ? 60 :
                        textOverlay.style === 'subtitle' ? 50 : 54}
              fontStyle={textOverlay.style === 'bold' ? 'bold' : 'normal'}
              fill="#ffffff"
              align="center"
            />
          </>
        )}
      </Layer>
    </Stage>
  )
}
