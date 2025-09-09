// React hook for audio processing queue

import { useState, useEffect, useCallback } from 'react';
import { getAudioProcessingQueue, type AudioProcessingJob } from '@/utils/audio-queue';
import type { TranscriptionResponse } from '@/types';

export interface AudioProcessingState {
  isProcessing: boolean;
  queueLength: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
}

export interface UseAudioProcessingOptions {
  autoRefresh?: boolean; // Automatically refresh state
  refreshInterval?: number; // Refresh interval in ms
}

export interface AudioProcessingCallbacks {
  onProgress?: (jobId: string, progress: number) => void;
  onComplete?: (jobId: string, result: TranscriptionResponse) => void;
  onError?: (jobId: string, error: string) => void;
}

export function useAudioProcessing(
  options: UseAudioProcessingOptions = {},
  callbacks: AudioProcessingCallbacks = {}
) {
  const { autoRefresh = true, refreshInterval = 1000 } = options;
  const { onProgress, onComplete, onError } = callbacks;

  const [state, setState] = useState<AudioProcessingState>({
    isProcessing: false,
    queueLength: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
  });

  const [jobs, setJobs] = useState<Map<string, AudioProcessingJob>>(new Map());

  // Get queue instance
  const queue = getAudioProcessingQueue();

  // Update state from queue
  const updateState = useCallback(() => {
    const stats = queue.getQueueStats();
    setState({
      isProcessing: queue.isProcessing,
      queueLength: stats.total,
      processingCount: stats.processing,
      completedCount: stats.completed,
      failedCount: stats.failed,
    });
  }, [queue]);

  // Add job to processing queue
  const addJob = useCallback(
    (
      audioBlob: Blob,
      options: { language?: string; prompt?: string; temperature?: number } = {},
      priority: number = 0,
      maxRetries: number = 3
    ): string => {
      const jobId = queue.addJob(
        audioBlob,
        options,
        {
          onProgress: (progress) => {
            onProgress?.(jobId, progress);
            // Update job in local state
            setJobs(prev => {
              const newJobs = new Map(prev);
              const job = queue.getJobStatus(jobId);
              if (job) {
                newJobs.set(jobId, job);
              }
              return newJobs;
            });
          },
          onComplete: (result) => {
            onComplete?.(jobId, result);
            updateState();
            // Update job in local state
            setJobs(prev => {
              const newJobs = new Map(prev);
              const job = queue.getJobStatus(jobId);
              if (job) {
                newJobs.set(jobId, job);
              }
              return newJobs;
            });
          },
          onError: (error) => {
            onError?.(jobId, error);
            updateState();
            // Update job in local state
            setJobs(prev => {
              const newJobs = new Map(prev);
              const job = queue.getJobStatus(jobId);
              if (job) {
                newJobs.set(jobId, job);
              }
              return newJobs;
            });
          },
        },
        priority,
        maxRetries
      );

      // Add job to local state
      const job = queue.getJobStatus(jobId);
      if (job) {
        setJobs(prev => new Map(prev).set(jobId, job));
      }

      updateState();
      return jobId;
    },
    [queue, onProgress, onComplete, onError, updateState]
  );

  // Cancel job
  const cancelJob = useCallback(
    (jobId: string): boolean => {
      const success = queue.cancelJob(jobId);
      if (success) {
        setJobs(prev => {
          const newJobs = new Map(prev);
          newJobs.delete(jobId);
          return newJobs;
        });
        updateState();
      }
      return success;
    },
    [queue, updateState]
  );

  // Get job status
  const getJobStatus = useCallback(
    (jobId: string): AudioProcessingJob | null => {
      return jobs.get(jobId) || queue.getJobStatus(jobId);
    },
    [jobs, queue]
  );

  // Clear completed jobs
  const clearCompleted = useCallback(() => {
    queue.clearCompletedJobs();
    
    // Remove completed jobs from local state
    setJobs(prev => {
      const newJobs = new Map();
      prev.forEach((job, id) => {
        if (job.status !== 'completed' && job.status !== 'failed' && job.status !== 'cancelled') {
          newJobs.set(id, job);
        }
      });
      return newJobs;
    });
    
    updateState();
  }, [queue, updateState]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(updateState, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, updateState]);

  // Initial state update
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    // State
    state,
    jobs: Array.from(jobs.values()),
    
    // Actions
    addJob,
    cancelJob,
    getJobStatus,
    clearCompleted,
    
    // Utilities
    refresh: updateState,
  };
}