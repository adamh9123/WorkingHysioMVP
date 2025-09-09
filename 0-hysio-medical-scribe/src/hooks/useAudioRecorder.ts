import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  recordedBlob: Blob | null;
  error: string | null;
  isInitializing: boolean;
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecorder: () => void;
}

export interface UseAudioRecorderOptions {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in milliseconds, default 30 minutes
  sampleRate?: number; // default 16000 Hz for Whisper
  mimeType?: string;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): [AudioRecorderState, AudioRecorderControls] {
  const {
    onRecordingComplete,
    onError,
    maxDuration = 1800000, // 30 minutes
    sampleRate = 16000,
    mimeType = 'audio/wav'
  } = options;

  // State
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    recordedBlob: null,
    error: null,
    isInitializing: false,
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  const isBrowserSupported = useCallback((): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      return false;
    }
    
    // Check for common supported formats
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    return supportedTypes.some(type => MediaRecorder.isTypeSupported(type));
  }, []);

  // Update timer
  const updateTimer = useCallback(() => {
    setState(prev => {
      const newTime = Date.now() - startTimeRef.current;
      
      // Check max duration
      if (newTime >= maxDuration) {
        // Auto-stop recording when max duration reached
        setTimeout(() => {
          stopRecording();
        }, 0);
        return { ...prev, recordingTime: maxDuration };
      }
      
      return { ...prev, recordingTime: newTime };
    });
  }, [maxDuration]);

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(updateTimer, 100); // Update every 100ms
  }, [updateTimer]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isBrowserSupported()) {
      const errorMsg = 'Audio recording is not supported in this browser.';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Find the best supported mime type - prioritize formats that work well with Groq
      const supportedTypes = [
        'audio/wav',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/mpeg',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
      
      const bestMimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      console.log('Selected audio format:', bestMimeType);
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: bestMimeType
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, { type: bestMimeType });
        const duration = Date.now() - startTimeRef.current; // Use actual elapsed time
        
        setState(prev => ({
          ...prev,
          recordedBlob,
          isRecording: false,
          isPaused: false,
          recordingTime: duration
        }));

        onRecordingComplete?.(recordedBlob, duration);
        stopTimer();
      };

      mediaRecorder.onerror = (event) => {
        const errorMsg = `Recording error: ${event.error?.message || 'Unknown error'}`;
        setState(prev => ({ ...prev, error: errorMsg, isRecording: false, isPaused: false }));
        onError?.(errorMsg);
        stopTimer();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimer();

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        isInitializing: false,
        recordingTime: 0
      }));

    } catch (error) {
      const errorMsg = error instanceof Error 
        ? `Failed to start recording: ${error.message}`
        : 'Failed to start recording: Unknown error';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMsg, 
        isInitializing: false,
        isRecording: false 
      }));
      
      onError?.(errorMsg);
    }
  }, [isBrowserSupported, sampleRate, mimeType, onRecordingComplete, onError, startTimer, stopTimer, state.recordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [state.isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused, stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      // Resume timer from current recorded time, not from 0
      startTimeRef.current = Date.now() - state.recordingTime;
      timerRef.current = setInterval(updateTimer, 100);
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused, state.recordingTime, updateTimer]);

  // Reset recorder
  const resetRecorder = useCallback(() => {
    // Stop any ongoing recording
    if (state.isRecording) {
      stopRecording();
    }
    
    stopTimer();
    
    // Clean up refs
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    startTimeRef.current = 0;
    
    // Reset state
    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      recordedBlob: null,
      error: null,
      isInitializing: false,
    });
  }, [state.isRecording, stopRecording, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopTimer();
    };
  }, [stopTimer]);

  const controls: AudioRecorderControls = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecorder,
  };

  return [state, controls];
}