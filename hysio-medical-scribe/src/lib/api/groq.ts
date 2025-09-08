// Groq API integration for Whisper Large v3 Turbo

import Groq from 'groq-sdk';
import type { AudioTranscription } from '@/lib/types';

// Initialize Groq client
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqClient = new Groq({ 
      apiKey,
      timeout: 120000, // 2 minutes timeout
      maxRetries: 2,   // Retry failed requests twice
    });
  }
  return groqClient;
}

export interface GroqTranscriptionOptions {
  language?: string; // ISO 639-1 language code, default 'nl' for Dutch
  prompt?: string; // Optional prompt to guide the model
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1, controls randomness
  model?: string; // Default to whisper-large-v3-turbo
}

export async function transcribeAudioWithGroq(
  audioBlob: Blob,
  options: GroqTranscriptionOptions = {}
): Promise<{ success: true; data: AudioTranscription } | { success: false; error: string }> {
  try {
    const {
      language = 'nl', // Dutch by default
      prompt,
      response_format = 'verbose_json',
      temperature = 0.0,
      model = 'whisper-large-v3-turbo'
    } = options;

    // Determine appropriate file extension based on mime type
    const getExtension = (mimeType: string): string => {
      const type = mimeType.toLowerCase();
      if (type.includes('m4a') || type.includes('x-m4a')) return 'm4a';
      if (type.includes('mp4')) return 'mp4';
      if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
      if (type.includes('webm')) return 'webm';
      if (type.includes('ogg')) return 'ogg';
      if (type.includes('flac')) return 'flac';
      if (type.includes('wav') || type.includes('wave')) return 'wav';
      return 'm4a'; // default to m4a as it's widely supported
    };
    
    const mimeType = audioBlob.type || 'audio/wav';
    const extension = getExtension(mimeType);
    
    // Convert blob to File object (required by Groq SDK)
    const audioFile = new File([audioBlob], `audio.${extension}`, {
      type: mimeType
    });

    // Get Groq client
    const client = getGroqClient();

    // Perform transcription with retry logic
    let transcription;
    let lastError: any;
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Transcription attempt ${attempt}/${maxAttempts}`);
        
        transcription = await client.audio.transcriptions.create({
          file: audioFile,
          model,
          language,
          prompt,
          response_format,
          temperature,
        });
        
        // If successful, break out of retry loop
        break;
        
      } catch (error) {
        lastError = error;
        console.error(`Transcription attempt ${attempt} failed:`, error);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxAttempts) {
          const waitTime = attempt * 2000; // Wait 2s, 4s, etc.
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If all attempts failed, throw the last error
    if (!transcription) {
      throw lastError || new Error('All transcription attempts failed');
    }

    // Handle different response formats
    let transcript: string;
    let duration: number | undefined;
    
    if (response_format === 'verbose_json' && typeof transcription === 'object') {
      transcript = transcription.text || '';
      duration = transcription.duration;
    } else if (typeof transcription === 'string') {
      transcript = transcription;
    } else if (typeof transcription === 'object' && 'text' in transcription) {
      transcript = transcription.text || '';
    } else {
      transcript = String(transcription);
    }

    return {
      success: true,
      data: {
        text: transcript.trim(),
        duration: duration || 0,
        confidence: 1.0, // Groq doesn't provide confidence scores, assuming high confidence
      }
    };

  } catch (error) {
    console.error('Groq transcription error:', error);
    
    let errorMessage = 'Failed to transcribe audio';
    
    if (error instanceof Error) {
      errorMessage = `Groq transcription failed: ${error.message}`;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.error?.message) {
        errorMessage = `Groq API error: ${errorObj.error.message}`;
      } else if (errorObj.message) {
        errorMessage = `Groq error: ${errorObj.message}`;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function transcribeAudioFile(
  file: File,
  options: GroqTranscriptionOptions = {}
): Promise<{ success: true; data: AudioTranscription } | { success: false; error: string }> {
  // Convert File to Blob and use the main transcription function
  const blob = new Blob([file], { type: file.type });
  return transcribeAudioWithGroq(blob, options);
}

// Utility function to check if audio format is supported
export function isSupportedAudioFormat(mimeType: string): boolean {
  if (!mimeType) return false;
  
  const supportedFormats = [
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/wav',
    'audio/wave',
    'audio/mpeg',
    'audio/mp3',
    'audio/webm',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
  ];
  
  // Convert to lowercase for case-insensitive comparison
  const lowerMimeType = mimeType.toLowerCase();
  
  // Check if any supported format is contained in the mime type
  // This handles cases like 'audio/webm;codecs=opus'
  return supportedFormats.some(format => 
    lowerMimeType.includes(format.toLowerCase())
  );
}

// Utility function to estimate cost (approximate)
export function estimateTranscriptionCost(durationInSeconds: number): number {
  // Groq pricing is typically around $0.00001 per second for Whisper
  // This is an approximation - check current Groq pricing for accuracy
  return durationInSeconds * 0.00001;
}