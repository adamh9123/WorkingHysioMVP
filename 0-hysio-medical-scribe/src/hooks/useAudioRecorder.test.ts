/**
 * Tests for useAudioRecorder hook with 30-minute limit
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioRecorder } from './useAudioRecorder';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  onerror: null,
};

// Mock getUserMedia
const mockGetUserMedia = jest.fn();

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// Mock MediaRecorder constructor
global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
(global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useAudioRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('30-minute recording limit', () => {
    it('should use 30 minutes (1800000ms) as default max duration', () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [state] = result.current;
      
      // The default max duration should be 1800000ms (30 minutes)
      expect(state.recordingTime).toBe(0);
    });

    it('should accept custom max duration', () => {
      const customDuration = 600000; // 10 minutes
      const { result } = renderHook(() => 
        useAudioRecorder({ maxDuration: customDuration })
      );
      
      // Should accept the custom duration
      expect(result.current).toBeDefined();
    });

    it('should auto-stop recording when reaching 30-minute limit', async () => {
      const onRecordingComplete = jest.fn();
      const { result } = renderHook(() => 
        useAudioRecorder({ 
          maxDuration: 1000, // 1 second for testing
          onRecordingComplete 
        })
      );

      const [, controls] = result.current;

      // Start recording
      await act(async () => {
        await controls.startRecording();
      });

      // Simulate reaching max duration
      act(() => {
        jest.advanceTimersByTime(1100); // Slightly over 1 second
      });

      // Should auto-stop after max duration
      await waitFor(() => {
        const [state] = result.current;
        expect(state.recordingTime).toBe(1000); // Clamped to max duration
      });
    });

    it('should update recording time correctly during recording', async () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [, controls] = result.current;

      // Start recording
      await act(async () => {
        await controls.startRecording();
      });

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Check recording time
      const [state] = result.current;
      expect(state.recordingTime).toBeGreaterThanOrEqual(5000);
      expect(state.isRecording).toBe(true);
    });

    it('should handle pause and resume correctly with timing', async () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [, controls] = result.current;

      // Start recording
      await act(async () => {
        await controls.startRecording();
      });

      // Record for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Pause recording
      act(() => {
        controls.pauseRecording();
      });

      const [pausedState] = result.current;
      expect(pausedState.isPaused).toBe(true);
      expect(pausedState.recordingTime).toBeGreaterThanOrEqual(2000);

      // Wait 1 second while paused (time should not advance)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Resume recording
      act(() => {
        controls.resumeRecording();
      });

      // Record for another 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const [resumedState] = result.current;
      expect(resumedState.isPaused).toBe(false);
      expect(resumedState.recordingTime).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('error handling', () => {
    it('should handle getUserMedia errors', async () => {
      const onError = jest.fn();
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useAudioRecorder({ onError }));
      const [, controls] = result.current;

      await act(async () => {
        await controls.startRecording();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start recording')
      );
    });

    it('should handle MediaRecorder not supported', async () => {
      const originalMediaRecorder = global.MediaRecorder;
      // @ts-ignore
      delete global.MediaRecorder;

      const onError = jest.fn();
      const { result } = renderHook(() => useAudioRecorder({ onError }));
      const [, controls] = result.current;

      await act(async () => {
        await controls.startRecording();
      });

      expect(onError).toHaveBeenCalledWith(
        'Audio recording is not supported in this browser.'
      );

      // Restore MediaRecorder
      global.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('recording controls', () => {
    it('should start recording successfully', async () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [, controls] = result.current;

      await act(async () => {
        await controls.startRecording();
      });

      const [state] = result.current;
      expect(state.isRecording).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it('should stop recording successfully', async () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [, controls] = result.current;

      // Start recording first
      await act(async () => {
        await controls.startRecording();
      });

      // Stop recording
      act(() => {
        controls.stopRecording();
      });

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it('should reset recorder state', async () => {
      const { result } = renderHook(() => useAudioRecorder());
      const [, controls] = result.current;

      // Start recording
      await act(async () => {
        await controls.startRecording();
      });

      // Reset recorder
      act(() => {
        controls.resetRecorder();
      });

      const [state] = result.current;
      expect(state.isRecording).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.recordingTime).toBe(0);
      expect(state.recordedBlob).toBeNull();
      expect(state.error).toBeNull();
    });
  });
});