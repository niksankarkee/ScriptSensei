/**
 * React Hook for Real-time Video Processing Progress
 *
 * Connects to Socket.IO server and receives progress updates for video generation
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface VideoProgressUpdate {
  job_id: string;
  progress: number;
  message: string;
  current_step?: string;
  timestamp: string;
}

export interface VideoProcessingStarted {
  job_id: string;
  status: 'processing';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VideoProcessingCompleted {
  job_id: string;
  status: 'completed';
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  timestamp: string;
}

export interface VideoProcessingFailed {
  job_id: string;
  status: 'failed';
  error: string;
  timestamp: string;
}

export type VideoStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface VideoProgressState {
  status: VideoStatus;
  progress: number;
  message: string;
  currentStep?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

interface UseVideoProgressOptions {
  onProgressUpdate?: (update: VideoProgressUpdate) => void;
  onCompleted?: (result: VideoProcessingCompleted) => void;
  onFailed?: (error: VideoProcessingFailed) => void;
}

/**
 * Hook to track real-time video processing progress
 *
 * @param jobId - The video job ID to track
 * @param options - Optional callbacks for events
 * @returns Video progress state and connection status
 */
export function useVideoProgress(
  jobId: string | null,
  options: UseVideoProgressOptions = {}
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progressState, setProgressState] = useState<VideoProgressState>({
    status: 'idle',
    progress: 0,
    message: 'Waiting to start...',
  });

  const socketRef = useRef<Socket | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Connect to Socket.IO server
  useEffect(() => {
    // Connect to video processing service
    const newSocket = io('http://localhost:8012', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  // Subscribe to job-specific updates
  useEffect(() => {
    if (!socket || !jobId) return;

    // Unsubscribe from previous job
    if (jobIdRef.current && jobIdRef.current !== jobId) {
      socket.emit('unsubscribe_from_job', { job_id: jobIdRef.current });
    }

    // Subscribe to new job
    socket.emit('subscribe_to_job', { job_id: jobId });
    jobIdRef.current = jobId;

    // Handle subscription confirmation
    socket.on('subscribed', (data) => {
      console.log('✅ Subscribed to job:', data.job_id);
    });

    // Handle processing started
    socket.on('processing_started', (data: VideoProcessingStarted) => {
      if (data.job_id === jobId) {
        console.log('🚀 Processing started:', data);
        setProgressState({
          status: 'processing',
          progress: 0,
          message: 'Processing started...',
        });
      }
    });

    // Handle progress updates
    socket.on('progress_update', (data: VideoProgressUpdate) => {
      if (data.job_id === jobId) {
        console.log(`📊 Progress: ${data.progress}% - ${data.message}`);
        setProgressState({
          status: 'processing',
          progress: data.progress,
          message: data.message,
          currentStep: data.current_step,
        });

        // Call optional callback
        if (options.onProgressUpdate) {
          options.onProgressUpdate(data);
        }
      }
    });

    // Handle processing completed
    socket.on('processing_completed', (data: VideoProcessingCompleted) => {
      if (data.job_id === jobId) {
        console.log('✅ Processing completed:', data);
        setProgressState({
          status: 'completed',
          progress: 100,
          message: 'Video processing complete!',
          videoUrl: data.video_url,
          thumbnailUrl: data.thumbnail_url,
          duration: data.duration,
        });

        // Call optional callback
        if (options.onCompleted) {
          options.onCompleted(data);
        }
      }
    });

    // Handle processing failed
    socket.on('processing_failed', (data: VideoProcessingFailed) => {
      if (data.job_id === jobId) {
        console.error('❌ Processing failed:', data.error);
        setProgressState({
          status: 'failed',
          progress: 0,
          message: 'Processing failed',
          error: data.error,
        });

        // Call optional callback
        if (options.onFailed) {
          options.onFailed(data);
        }
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('subscribed');
      socket.off('processing_started');
      socket.off('progress_update');
      socket.off('processing_completed');
      socket.off('processing_failed');
    };
  }, [socket, jobId, options]);

  // Unsubscribe on unmount
  useEffect(() => {
    return () => {
      if (socket && jobIdRef.current) {
        socket.emit('unsubscribe_from_job', { job_id: jobIdRef.current });
      }
    };
  }, [socket]);

  return {
    isConnected,
    progressState,
    socket,
  };
}
