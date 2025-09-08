import * as React from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { useAudioRecorder, type UseAudioRecorderOptions } from '@/hooks/useAudioRecorder';
import { transcribeAudio } from '@/lib/api/transcription';
import { Button } from './button';
import { Spinner } from './spinner';
import { Mic, MicOff, Play, Pause, Square, Upload, RotateCcw } from 'lucide-react';
import type { AudioTranscription } from '@/lib/types';

export interface AudioRecorderProps extends React.HTMLAttributes<HTMLDivElement> {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onTranscriptionComplete?: (transcription: AudioTranscription) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  sampleRate?: number;
  showTimer?: boolean;
  showWaveform?: boolean;
  allowUpload?: boolean;
  autoTranscribe?: boolean;
  transcriptionOptions?: {
    language?: string;
    prompt?: string;
    temperature?: number;
  };
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionComplete,
  onError,
  maxDuration = 1800000, // 30 minutes
  sampleRate = 16000,
  showTimer = true,
  showWaveform = false,
  allowUpload = true,
  autoTranscribe = false,
  transcriptionOptions = {},
  disabled = false,
  className,
  ...props
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [transcription, setTranscription] = React.useState<AudioTranscription | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Handle transcription
  const handleTranscription = async (blob: Blob) => {
    if (!autoTranscribe) return;
    
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(blob, {
        language: transcriptionOptions.language || 'nl',
        prompt: transcriptionOptions.prompt,
        temperature: transcriptionOptions.temperature || 0.0,
      });
      
      if (result.success && result.transcript) {
        const transcriptionData: AudioTranscription = {
          text: result.transcript,
          duration: result.duration,
          timestamp: new Date().toISOString(),
        };
        
        setTranscription(transcriptionData);
        onTranscriptionComplete?.(transcriptionData);
      } else {
        onError?.(result.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      onError?.('Unexpected error during transcription');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Audio recorder hook options
  const recorderOptions: UseAudioRecorderOptions = {
    onRecordingComplete: async (blob, duration) => {
      // Create URL for playback
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      onRecordingComplete?.(blob, duration);
      
      // Auto-transcribe if enabled
      if (autoTranscribe) {
        await handleTranscription(blob);
      }
    },
    onError,
    maxDuration,
    sampleRate,
  };

  const [recorderState, recorderControls] = useAudioRecorder(recorderOptions);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      onError?.('Please select a valid audio file.');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Get duration from audio element
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration * 1000; // Convert to milliseconds
      onRecordingComplete?.(file, duration);
    });
    
    // Auto-transcribe uploaded file if enabled
    if (autoTranscribe) {
      await handleTranscription(file);
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Handle audio playback
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Reset everything
  const handleReset = () => {
    recorderControls.resetRecorder();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setIsTranscribing(false);
    setTranscription(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const { isRecording, isPaused, recordingTime, error, isInitializing } = recorderState;
  
  const isProcessing = isTranscribing;
  const showSpinner = isInitializing || isTranscribing;

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center gap-4">
        {/* Start/Stop Recording */}
        {!isRecording ? (
          <Button
            onClick={recorderControls.startRecording}
            disabled={disabled || isInitializing || isTranscribing}
            variant="primary"
            size="lg"
            className="gap-2"
            loading={showSpinner}
          >
            <Mic size={20} />
            {isTranscribing ? 'Transcriberen...' : 'Start opname'}
          </Button>
        ) : (
          <Button
            onClick={recorderControls.stopRecording}
            disabled={disabled}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square size={20} />
            Stop opname
          </Button>
        )}

        {/* Pause/Resume */}
        {isRecording && (
          <Button
            onClick={isPaused ? recorderControls.resumeRecording : recorderControls.pauseRecording}
            disabled={disabled || isTranscribing}
            variant="secondary"
            size="lg"
            className="gap-2"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
            {isPaused ? 'Hervatten' : 'Pauzeren'}
          </Button>
        )}

        {/* Reset */}
        {(audioUrl || isRecording || transcription) && (
          <Button
            onClick={handleReset}
            disabled={disabled || isTranscribing}
            variant="ghost"
            size="lg"
            className="gap-2"
          >
            <RotateCcw size={20} />
            Reset
          </Button>
        )}
      </div>

      {/* Timer */}
      {showTimer && (isRecording || recordingTime > 0) && (
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className={cn(
              'w-3 h-3 rounded-full bg-red-500',
              isPaused ? 'animate-none' : 'animate-pulse'
            )} />
          )}
          <span className="text-lg font-mono text-hysio-deep-green">
            {formatDuration(recordingTime / 1000)}
          </span>
          {maxDuration && (
            <span className="text-sm text-hysio-deep-green-900/70">
              / {formatDuration(maxDuration / 1000)}
            </span>
          )}
        </div>
      )}

      {/* Waveform Placeholder */}
      {showWaveform && isRecording && (
        <div className="h-16 bg-hysio-mint/10 rounded-md flex items-center justify-center">
          <div className="flex items-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 bg-hysio-mint rounded-full transition-all duration-150',
                  isPaused ? 'h-2' : 'animate-pulse'
                )}
                style={{
                  height: isPaused ? '8px' : `${Math.random() * 48 + 8}px`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isTranscribing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-3">
            <Spinner size={20} />
            <span className="text-sm text-blue-700 font-medium">
              Audio wordt getranscribeerd...
            </span>
          </div>
        </div>
      )}

      {/* Transcription Result */}
      {transcription && !isTranscribing && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-800 mb-2">Transcriptie</h4>
          <div className="text-sm text-green-700 bg-white p-3 rounded border border-green-200">
            <p>{transcription.text}</p>
          </div>
          {transcription.duration && (
            <p className="text-xs text-green-600 mt-2">
              Duur: {formatDuration(transcription.duration / 1000)}
            </p>
          )}
        </div>
      )}

      {/* Audio Playback */}
      {audioUrl && !isRecording && (
        <div className="p-4 bg-hysio-mint/5 rounded-md border border-hysio-mint/20">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlayback}
              disabled={disabled || isTranscribing}
              variant="ghost"
              size="icon"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="flex-1"
              controls
            />
          </div>
        </div>
      )}

      {/* File Upload */}
      {allowUpload && !isRecording && !isTranscribing && (
        <div className="border-2 border-dashed border-hysio-mint/30 rounded-md p-6">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-hysio-deep-green-900/50 mb-2" />
            <p className="text-sm text-hysio-deep-green-900/70 mb-2">
              Of upload een audiobestand
              {autoTranscribe && <span className="block text-xs text-hysio-deep-green-900/50 mt-1">Wordt automatisch getranscribeerd</span>}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              variant="outline"
              size="sm"
            >
              Bestand selecteren
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { AudioRecorder };