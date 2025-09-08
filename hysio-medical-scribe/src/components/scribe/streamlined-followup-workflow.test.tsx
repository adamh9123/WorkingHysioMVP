/**
 * Integration tests for StreamlinedFollowupWorkflow with new features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StreamlinedFollowupWorkflow } from './streamlined-followup-workflow';
import { PatientInfo } from '@/lib/types';
import * as audioRecorderHook from '@/hooks/useAudioRecorder';
import * as transcriptionAPI from '@/lib/api/transcription';
import * as apiModule from '@/lib/api';

// Mock dependencies
jest.mock('@/hooks/useAudioRecorder');
jest.mock('@/lib/api/transcription');
jest.mock('@/lib/api');

// Mock the copy-to-clipboard component
jest.mock('@/components/ui/copy-to-clipboard', () => ({
  CopyToClipboard: ({ text }: { text: string }) => (
    <button data-testid="copy-button">Copy</button>
  ),
}));

// Mock dynamic import for SOEP export
jest.mock('@/lib/utils/soep-export', () => ({
  SOEPExporter: {
    exportAndDownload: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('StreamlinedFollowupWorkflow', () => {
  const mockPatientInfo: PatientInfo = {
    initials: 'A.B.',
    birthYear: '1990',
    gender: 'vrouw',
    chiefComplaint: 'Schouderpijn rechts',
  };

  const mockOnComplete = jest.fn();

  const mockRecorderState = {
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    recordedBlob: null,
    error: null,
    isInitializing: false,
  };

  const mockRecorderControls = {
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    resetRecorder: jest.fn(),
  };

  const mockSOEPResult = {
    subjective: 'Test subjective data',
    objective: 'Test objective data',
    evaluation: 'Test evaluation',
    plan: 'Test plan',
    redFlags: [],
    fullStructuredText: 'Full SOEP text for testing',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAudioRecorder hook
    (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
      mockRecorderState,
      mockRecorderControls,
    ]);

    // Mock transcription API
    (transcriptionAPI.transcribeAudio as jest.Mock).mockResolvedValue({
      success: true,
      transcript: 'Test transcript',
      duration: 30,
      confidence: 0.9,
    });

    // Mock API calls
    (apiModule.apiCall as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSOEPResult,
    });
  });

  describe('Component Rendering', () => {
    it('should render workflow with patient information', () => {
      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Vervolgconsult - A\.B\./)).toBeInTheDocument();
      expect(screen.getByText(/Schouderpijn rechts/)).toBeInTheDocument();
    });

    it('should display session preparation section', () => {
      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Sessie Voorbereiding')).toBeInTheDocument();
      expect(screen.getByText('AI-gegenereerde voorbereiding voor dit vervolgconsult')).toBeInTheDocument();
    });

    it('should display SOEP recording section', () => {
      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('SOEP Opname')).toBeInTheDocument();
      expect(screen.getByText('Opnemen, stoppen, klaar')).toBeInTheDocument();
    });
  });

  describe('Audio Recording with 30-minute limit', () => {
    it('should use 30-minute recording limit', () => {
      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(audioRecorderHook.useAudioRecorder).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDuration: 1800000, // 30 minutes in milliseconds
        })
      );
    });

    it('should display record button initially', () => {
      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Start Opname')).toBeInTheDocument();
    });

    it('should show recording controls when recording', () => {
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, isRecording: true, recordingTime: 5000 },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByText('Pauzeer')).toBeInTheDocument();
    });

    it('should display recording time during recording', () => {
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, isRecording: true, recordingTime: 65000 }, // 1:05
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/1:05/)).toBeInTheDocument();
    });

    it('should handle pause and resume correctly', async () => {
      const user = userEvent.setup();
      
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, isRecording: true, recordingTime: 30000 },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const pauseButton = screen.getByText('Pauzeer');
      await user.click(pauseButton);

      expect(mockRecorderControls.pauseRecording).toHaveBeenCalled();
    });
  });

  describe('Session Preparation Generation', () => {
    it('should generate session preparation with patient data', async () => {
      const user = userEvent.setup();

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      // Should automatically generate preparation (this would be tested by checking if API is called)
      await waitFor(() => {
        expect(apiModule.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              model: 'groq/llama-3.2-90b-vision-preview',
              messages: expect.arrayContaining([
                expect.objectContaining({
                  role: 'user',
                  content: expect.stringContaining('A.B.'),
                }),
              ]),
            }),
          })
        );
      });
    });

    it('should handle preparation generation errors', async () => {
      (apiModule.apiCall as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });
    });
  });

  describe('SOEP Processing', () => {
    it('should process recorded audio into SOEP format', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(transcriptionAPI.transcribeAudio).toHaveBeenCalledWith(mockBlob);
      });

      await waitFor(() => {
        expect(apiModule.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('Test transcript'),
          })
        );
      });
    });

    it('should display SOEP results after processing', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('SOEP Documentatie Gereed')).toBeInTheDocument();
      });

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    it('should handle transcription errors', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      (transcriptionAPI.transcribeAudio as jest.Mock).mockRejectedValue(
        new Error('Transcription failed')
      );

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText(/Transcription failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export SOEP when export button is clicked', async () => {
      const { SOEPExporter } = await import('@/lib/utils/soep-export');
      const user = userEvent.setup();

      // Setup component with SOEP result
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      // Process audio to get SOEP result
      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(SOEPExporter.exportAndDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          patientInfo: mockPatientInfo,
          soepData: mockSOEPResult,
        }),
        'html'
      );
    });

    it('should handle export errors', async () => {
      const { SOEPExporter } = await import('@/lib/utils/soep-export');
      (SOEPExporter.exportAndDownload as jest.Mock).mockRejectedValue(
        new Error('Export failed')
      );

      const user = userEvent.setup();
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Export failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Completion', () => {
    it('should call onComplete when viewing SOEP result', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      // Process audio to get SOEP result
      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Bekijk SOEP')).toBeInTheDocument();
      });

      // Click view SOEP button
      const viewButton = screen.getByText('Bekijk SOEP');
      await user.click(viewButton);

      expect(mockOnComplete).toHaveBeenCalledWith(mockSOEPResult);
    });
  });

  describe('Error Handling', () => {
    it('should display recording errors', () => {
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, error: 'Microphone access denied' },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });

    it('should show close button for errors', async () => {
      const user = userEvent.setup();

      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, error: 'Test error' },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const closeButton = screen.getByText('Sluiten');
      await user.click(closeButton);

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should manage loading states correctly', async () => {
      const user = userEvent.setup();
      let resolveApiCall: (value: any) => void;
      
      (apiModule.apiCall as jest.Mock).mockImplementation(() => 
        new Promise(resolve => { resolveApiCall = resolve; })
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      (audioRecorderHook.useAudioRecorder as jest.Mock).mockReturnValue([
        { ...mockRecorderState, recordedBlob: mockBlob },
        mockRecorderControls,
      ]);

      render(
        <StreamlinedFollowupWorkflow
          patientInfo={mockPatientInfo}
          onComplete={mockOnComplete}
        />
      );

      const processButton = screen.getByText('Verwerk in SOEP');
      await user.click(processButton);

      // Should show loading state
      expect(screen.getByText('Bezig met verwerken...')).toBeInTheDocument();

      // Resolve the API call
      resolveApiCall!({ success: true, data: mockSOEPResult });

      await waitFor(() => {
        expect(screen.getByText('SOEP Documentatie Gereed')).toBeInTheDocument();
      });
    });
  });
});