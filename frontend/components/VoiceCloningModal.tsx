'use client'

/**
 * Voice Cloning Modal Component
 *
 * Comprehensive voice cloning interface with:
 * - Record your own voice with real-time waveform
 * - Upload audio files
 * - Voice quality analysis
 * - Sample script reading
 * - Similar to ElevenLabs/Fliki voice cloning
 */

import { useState, useRef, useEffect } from 'react'
import { X, Mic, Upload, Play, Pause, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface VoiceCloningModalProps {
  isOpen: boolean
  onClose: () => void
  onVoiceCloned: (voiceId: string, voiceName: string) => void
}

interface AudioRecording {
  id: string
  blob: Blob
  url: string
  duration: number
  name: string
}

export default function VoiceCloningModal({
  isOpen,
  onClose,
  onVoiceCloned
}: VoiceCloningModalProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [voiceName, setVoiceName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'analyzing' | 'training' | 'complete' | 'error'>('idle')
  const [qualityScore, setQualityScore] = useState<number | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sample script for voice recording
  const sampleScript = `Welcome to ScriptSensei! This is a sample recording to clone your voice.
Please read this text naturally and clearly. The more you record, the better the voice clone will be.
Try to speak in your normal tone and pace. You can record multiple samples for better quality.`

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      recordings.forEach(rec => URL.revokeObjectURL(rec.url))
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [recordings])

  // Draw waveform
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isRecording) return

      requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = 'rgb(249, 250, 251)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgb(236, 72, 153)' // pink-600
      ctx.beginPath()

      const sliceWidth = (canvas.width * 1.0) / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }

    draw()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio context for waveform
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)

        const newRecording: AudioRecording = {
          id: Date.now().toString(),
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          name: `Recording ${recordings.length + 1}`
        }

        setRecordings(prev => [...prev, newRecording])
        setRecordingTime(0)

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Start waveform visualization
      drawWaveform()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) clearInterval(timerRef.current)
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('audio/')) {
        const audioUrl = URL.createObjectURL(file)

        const newRecording: AudioRecording = {
          id: Date.now().toString() + index,
          blob: file,
          url: audioUrl,
          duration: 0, // Will be calculated when played
          name: file.name
        }

        setRecordings(prev => [...prev, newRecording])
      }
    })
  }

  const playRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id)
    if (!recording) return

    if (playingId === id) {
      setPlayingId(null)
      return
    }

    const audio = new Audio(recording.url)
    audio.play()
    setPlayingId(id)

    audio.onended = () => {
      setPlayingId(null)
    }
  }

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.url)
    }
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = () => {
    return recordings.reduce((sum, rec) => sum + rec.duration, recordingTime)
  }

  const handleCloneVoice = async () => {
    if (!voiceName.trim()) {
      alert('Please enter a name for your voice')
      return
    }

    if (recordings.length === 0) {
      alert('Please record or upload at least one audio sample')
      return
    }

    setIsProcessing(true)
    setProcessingStatus('analyzing')

    try {
      // Simulate API call to voice cloning service
      await new Promise(resolve => setTimeout(resolve, 2000))
      setProcessingStatus('training')

      // Simulate quality analysis
      const mockQuality = Math.floor(Math.random() * 30) + 70 // 70-100%
      setQualityScore(mockQuality)

      await new Promise(resolve => setTimeout(resolve, 3000))
      setProcessingStatus('complete')

      // In production, this would return the cloned voice ID
      const voiceId = `cloned-${Date.now()}`

      setTimeout(() => {
        onVoiceCloned(voiceId, voiceName)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Voice cloning failed:', error)
      setProcessingStatus('error')
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingStatus('idle')
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Clone Your Voice</h3>
            <p className="text-sm text-gray-600 mt-1">
              Record or upload audio samples to create your custom voice
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('record')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'record'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Record Audio
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Audio
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'record' ? (
            <div className="space-y-6">
              {/* Sample Script */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Sample Script to Read
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {sampleScript}
                </p>
              </div>

              {/* Recording Controls */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatTime(recordingTime)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
                  </p>
                </div>

                {/* Waveform Canvas */}
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={100}
                  className="w-full h-24 bg-gray-50 rounded-lg mb-4"
                />

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <Mic className="h-5 w-5" />
                      Start Recording
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={pauseRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Stop & Save
                      </button>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-600 text-center mt-4">
                  Minimum 2 minutes of audio recommended for best results
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Upload Audio Files</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Drag & drop or click to select audio files
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer"
                >
                  Select Files
                </label>
                <p className="text-xs text-gray-500 mt-3">
                  Supported formats: MP3, WAV, M4A, FLAC (Max 50MB per file)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Tips for Best Results</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Upload at least 2-3 minutes of clear audio</li>
                  <li>Use high-quality recordings with minimal background noise</li>
                  <li>Multiple shorter samples work better than one long sample</li>
                  <li>Speak naturally and vary your tone and expression</li>
                </ul>
              </div>
            </div>
          )}

          {/* Recordings List */}
          {recordings.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Your Recordings ({recordings.length})
              </h4>
              <div className="space-y-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => playRecording(recording.id)}
                        className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                      >
                        {playingId === recording.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{recording.name}</p>
                        <p className="text-xs text-gray-600">
                          {recording.duration > 0 ? formatTime(recording.duration) : 'Duration unknown'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteRecording(recording.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Total duration: {formatTime(getTotalDuration())}
                {getTotalDuration() < 120 && ' (Minimum 2 minutes recommended)'}
              </p>
            </div>
          )}

          {/* Voice Name Input */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Voice Name
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g., My Voice, Professional Voice, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
            />
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-pink-600 animate-spin mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">
                  {processingStatus === 'analyzing' && 'Analyzing Audio Quality...'}
                  {processingStatus === 'training' && 'Training Voice Model...'}
                  {processingStatus === 'complete' && 'Voice Cloned Successfully!'}
                  {processingStatus === 'error' && 'Error Processing Voice'}
                </h4>
                <p className="text-sm text-gray-600">
                  {processingStatus === 'analyzing' && 'Checking audio quality and clarity'}
                  {processingStatus === 'training' && 'Creating your custom voice model'}
                  {processingStatus === 'complete' && 'Your voice is ready to use'}
                  {processingStatus === 'error' && 'Please try again or contact support'}
                </p>
                {qualityScore && processingStatus === 'training' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="text-sm font-semibold text-pink-600">{qualityScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCloneVoice}
            disabled={recordings.length === 0 || !voiceName.trim() || isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Clone Voice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
