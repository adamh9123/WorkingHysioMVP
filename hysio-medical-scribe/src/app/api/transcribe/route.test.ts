/**
 * Integration tests for transcription API route with audio splitting
 */

import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import * as audioSplitter from '@/lib/utils/audio-splitter';
import * as groqAPI from '@/lib/api/groq';

// Mock the dependencies
jest.mock('@/lib/utils/audio-splitter', () => ({
  isFileSizeExceeded: jest.fn(),
  splitAudioFile: jest.fn(),
  processAudioSegments: jest.fn(),
  formatFileSize: jest.fn(),
  MAX_FILE_SIZE: 25 * 1024 * 1024,
}));

jest.mock('@/lib/api/groq', () => ({
  transcribeAudioWithGroq: jest.fn(),
  isSupportedAudioFormat: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('Transcription API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GROQ_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET endpoint', () => {
    it('should return API status with splitting enabled', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Transcription API is running with automatic splitting',
        model: 'whisper-large-v3-turbo',
        provider: 'Groq',
        supportedFormats: ['audio/m4a', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/flac'],
        maxFileSize: '25MB per segment (automatic splitting for larger files)',
        splittingEnabled: true,
        maxRecordingTime: '30 minutes',
        hasGroqKey: true,
        groqKeyLength: 12,
      });
    });

    it('should handle missing GROQ API key', async () => {
      delete process.env.GROQ_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(data.hasGroqKey).toBe(false);
      expect(data.groqKeyLength).toBe(0);
    });
  });

  describe('POST endpoint - Small files (≤25MB)', () => {
    it('should process small audio files directly', async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      // Mock responses
      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(false);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('1 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);
      (groqAPI.transcribeAudioWithGroq as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          text: 'Test transcription',
          duration: 30.5,
          confidence: 0.95,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        transcript: 'Test transcription',
        duration: 30.5,
        confidence: 0.95,
        segmented: false,
        fileSize: '1 MB',
      });
    });

    it('should handle transcription errors for small files', async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(false);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('1 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);
      (groqAPI.transcribeAudioWithGroq as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Transcription failed',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Transcription failed',
      });
    });
  });

  describe('POST endpoint - Large files (>25MB)', () => {
    it('should split and process large audio files', async () => {
      const largeAudioData = new ArrayBuffer(30 * 1024 * 1024); // 30MB
      const mockFile = new File([largeAudioData], 'large-test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      // Mock responses for large file processing
      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(true);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('30 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);

      const mockSegments = [
        {
          blob: new Blob(['segment1']),
          index: 0,
          duration: 300,
          size: 15 * 1024 * 1024,
          startTime: 0,
          endTime: 300,
        },
        {
          blob: new Blob(['segment2']),
          index: 1,
          duration: 300,
          size: 15 * 1024 * 1024,
          startTime: 300,
          endTime: 600,
        },
      ];

      (audioSplitter.splitAudioFile as jest.Mock).mockResolvedValue({
        segments: mockSegments,
        totalDuration: 600,
        totalSize: 30 * 1024 * 1024,
      });

      (audioSplitter.processAudioSegments as jest.Mock).mockResolvedValue({
        combinedTranscript: 'Segment 1 transcript\\n\\nSegment 2 transcript',
        segments: [
          { index: 0, transcript: 'Segment 1 transcript', duration: 300 },
          { index: 1, transcript: 'Segment 2 transcript', duration: 300 },
        ],
        totalDuration: 600,
        errors: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        transcript: 'Segment 1 transcript\\n\\nSegment 2 transcript',
        duration: 600,
        confidence: 1.0,
        segmented: true,
        fileSize: '30 MB',
      });

      expect(audioSplitter.splitAudioFile).toHaveBeenCalled();
      expect(audioSplitter.processAudioSegments).toHaveBeenCalled();
    });

    it('should handle audio splitting errors', async () => {
      const largeAudioData = new ArrayBuffer(30 * 1024 * 1024);
      const mockFile = new File([largeAudioData], 'large-test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(true);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('30 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);

      (audioSplitter.splitAudioFile as jest.Mock).mockResolvedValue({
        error: 'Audio splitting failed',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Audio splitting failed: Audio splitting failed',
      });
    });

    it('should handle segment processing errors gracefully', async () => {
      const largeAudioData = new ArrayBuffer(30 * 1024 * 1024);
      const mockFile = new File([largeAudioData], 'large-test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(true);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('30 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);

      const mockSegments = [
        {
          blob: new Blob(['segment1']),
          index: 0,
          duration: 300,
          size: 15 * 1024 * 1024,
          startTime: 0,
          endTime: 300,
        },
      ];

      (audioSplitter.splitAudioFile as jest.Mock).mockResolvedValue({
        segments: mockSegments,
        totalDuration: 300,
        totalSize: 30 * 1024 * 1024,
      });

      (audioSplitter.processAudioSegments as jest.Mock).mockResolvedValue({
        combinedTranscript: 'Partial transcript\\n\\n[Error processing segment 2]',
        segments: [
          { index: 0, transcript: 'Partial transcript', duration: 300 },
          { index: 1, transcript: '[Error processing segment 2]', duration: 0, error: 'Network error' },
        ],
        totalDuration: 300,
        errors: ['Segment 2: Network error'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.segmented).toBe(true);
      expect(data.transcript).toContain('[Error processing segment 2]');
    });
  });

  describe('Request validation', () => {
    it('should reject non-multipart requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Request must be multipart/form-data',
      });
    });

    it('should reject requests without audio file', async () => {
      const formData = new FormData();
      formData.append('text', 'no audio file');

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'No audio file provided',
      });
    });

    it('should reject unsupported audio formats', async () => {
      const mockFile = new File(['audio data'], 'test.xyz', { type: 'audio/xyz' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(false);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported audio format');
    });
  });

  describe('Optional parameters', () => {
    it('should handle custom language parameter', async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);
      formData.append('language', 'en');

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(false);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('1 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);
      (groqAPI.transcribeAudioWithGroq as jest.Mock).mockResolvedValue({
        success: true,
        data: { text: 'English transcription', duration: 30, confidence: 0.9 },
      });

      await POST(request);

      expect(groqAPI.transcribeAudioWithGroq).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({ language: 'en' })
      );
    });

    it('should handle custom prompt and temperature', async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);
      formData.append('prompt', 'Medical consultation');
      formData.append('temperature', '0.2');

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(false);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('1 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);
      (groqAPI.transcribeAudioWithGroq as jest.Mock).mockResolvedValue({
        success: true,
        data: { text: 'Medical transcription', duration: 30, confidence: 0.9 },
      });

      await POST(request);

      expect(groqAPI.transcribeAudioWithGroq).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({
          prompt: 'Medical consultation',
          temperature: 0.2,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      // Mock an unexpected error
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error during transcription',
        details: 'Unexpected error',
      });
    });

    it('should handle audio splitting runtime errors', async () => {
      const largeAudioData = new ArrayBuffer(30 * 1024 * 1024);
      const mockFile = new File([largeAudioData], 'large-test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', mockFile);

      const request = new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      (audioSplitter.isFileSizeExceeded as jest.Mock).mockReturnValue(true);
      (audioSplitter.formatFileSize as jest.Mock).mockReturnValue('30 MB');
      (groqAPI.isSupportedAudioFormat as jest.Mock).mockReturnValue(true);

      // Mock splitting to throw an error
      (audioSplitter.splitAudioFile as jest.Mock).mockRejectedValue(new Error('Runtime splitting error'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to process large audio file');
    });
  });
});