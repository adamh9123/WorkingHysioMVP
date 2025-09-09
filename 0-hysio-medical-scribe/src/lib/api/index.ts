// API integration utilities for Hysio Medical Scribe

export const API_ENDPOINTS = {
  TRANSCRIPTION: '/api/transcribe',
  GENERATE_CONTENT: '/api/generate',
  ASSISTANT: '/api/assistant',
  SESSIONS: '/api/sessions',
} as const;

// API response wrapper type
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Base API utility function
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Export transcription utilities
export * from './transcription';
export * from './groq';

// Export OpenAI utilities
export * from './openai';