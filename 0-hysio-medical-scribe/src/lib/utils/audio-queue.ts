// Audio processing queue and error handling system

import { generateId } from './index';
import type { TranscriptionResponse } from '@/types';

export interface AudioProcessingJob {
  id: string;
  audioBlob: Blob;
  options: {
    language?: string;
    prompt?: string;
    temperature?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number; // Higher number = higher priority
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: TranscriptionResponse;
  error?: string;
  retryCount: number;
  maxRetries: number;
  onProgress?: (progress: number) => void;
  onComplete?: (result: TranscriptionResponse) => void;
  onError?: (error: string) => void;
}

export class AudioProcessingQueue {
  private queue: AudioProcessingJob[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number;
  private retryDelay: number;

  constructor(options: { maxConcurrent?: number; retryDelay?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 2; // Process 2 jobs concurrently
    this.retryDelay = options.retryDelay || 2000; // 2 second delay between retries
  }

  // Add job to queue
  public addJob(
    audioBlob: Blob,
    options: AudioProcessingJob['options'] = {},
    callbacks: {
      onProgress?: (progress: number) => void;
      onComplete?: (result: TranscriptionResponse) => void;
      onError?: (error: string) => void;
    } = {},
    priority: number = 0,
    maxRetries: number = 3
  ): string {
    const job: AudioProcessingJob = {
      id: generateId(),
      audioBlob,
      options,
      status: 'pending',
      priority,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries,
      ...callbacks,
    };

    // Insert job in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(existingJob => existingJob.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    // Start processing if we have capacity
    this.processNext();

    return job.id;
  }

  // Cancel job
  public cancelJob(jobId: string): boolean {
    const jobIndex = this.queue.findIndex(job => job.id === jobId);
    
    if (jobIndex !== -1) {
      const job = this.queue[jobIndex];
      
      if (job.status === 'pending') {
        job.status = 'cancelled';
        this.queue.splice(jobIndex, 1);
        return true;
      } else if (job.status === 'processing') {
        job.status = 'cancelled';
        this.processing.delete(jobId);
        // Note: We can't actually cancel the API request once it's started
        return true;
      }
    }
    
    return false;
  }

  // Get job status
  public getJobStatus(jobId: string): AudioProcessingJob | null {
    return this.queue.find(job => job.id === jobId) || null;
  }

  // Get queue statistics
  public getQueueStats() {
    const pending = this.queue.filter(job => job.status === 'pending').length;
    const processing = this.processing.size;
    const completed = this.queue.filter(job => job.status === 'completed').length;
    const failed = this.queue.filter(job => job.status === 'failed').length;
    
    return {
      pending,
      processing,
      completed,
      failed,
      total: this.queue.length,
    };
  }

  // Clear completed jobs
  public clearCompletedJobs(): void {
    this.queue = this.queue.filter(job => 
      job.status !== 'completed' && job.status !== 'failed' && job.status !== 'cancelled'
    );
  }

  // Process next job in queue
  private processNext(): void {
    if (this.processing.size >= this.maxConcurrent) {
      return; // Already processing max concurrent jobs
    }

    const nextJob = this.queue.find(job => job.status === 'pending');
    if (!nextJob) {
      return; // No pending jobs
    }

    this.processJob(nextJob);
  }

  // Process individual job
  private async processJob(job: AudioProcessingJob): Promise<void> {
    job.status = 'processing';
    job.startedAt = new Date();
    this.processing.add(job.id);

    try {
      // Report progress start
      job.onProgress?.(0);

      // Dynamic import to avoid server-side issues
      const { transcribeAudio } = await import('@/lib/api/transcription');
      
      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        if (job.status === 'processing') {
          // Simulate progress between 10% and 90%
          const randomProgress = Math.min(90, Math.random() * 80 + 10);
          job.onProgress?.(randomProgress);
        }
      }, 500);

      // Perform transcription
      const result = await transcribeAudio(job.audioBlob, job.options);

      clearInterval(progressInterval);

      if (result.success) {
        // Success
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        job.onProgress?.(100);
        job.onComplete?.(result);
      } else {
        // API returned error
        throw new Error(result.error || 'Transcription failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        
        console.warn(`Retrying job ${job.id} (attempt ${job.retryCount}/${job.maxRetries}): ${errorMessage}`);
        
        // Schedule retry with delay
        setTimeout(() => {
          if (job.status === 'pending') { // Only retry if not cancelled
            this.processNext();
          }
        }, this.retryDelay * job.retryCount); // Exponential backoff
        
      } else {
        // Max retries reached
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = errorMessage;
        job.onError?.(errorMessage);
        
        console.error(`Job ${job.id} failed after ${job.maxRetries} retries: ${errorMessage}`);
      }
    } finally {
      this.processing.delete(job.id);
      
      // Process next job
      this.processNext();
    }
  }

  // Get queue length
  public get length(): number {
    return this.queue.length;
  }

  // Check if queue is empty
  public get isEmpty(): boolean {
    return this.queue.length === 0 && this.processing.size === 0;
  }

  // Check if queue is processing
  public get isProcessing(): boolean {
    return this.processing.size > 0;
  }
}

// Global queue instance
let globalQueue: AudioProcessingQueue | null = null;

export function getAudioProcessingQueue(): AudioProcessingQueue {
  if (!globalQueue) {
    globalQueue = new AudioProcessingQueue({
      maxConcurrent: 2,
      retryDelay: 2000,
    });
  }
  return globalQueue;
}