import { useState, useCallback, useEffect, useRef } from 'react';
import { SessionData, PatientInfo, IntakeData, FollowupData } from '@/lib/types';

export type SessionType = 'intake' | 'followup';
export type SessionStatus = 'idle' | 'in-progress' | 'paused' | 'completed' | 'error';

export interface SessionState {
  id: string;
  type: SessionType;
  status: SessionStatus;
  patientInfo: PatientInfo | null;
  intakeData: IntakeData | null;
  followupData: FollowupData | null;
  currentStep: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  lastSavedAt: string | null;
  autoSaveEnabled: boolean;
}

export interface UseSessionStateOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
  storageKey?: string;
}

export interface UseSessionStateReturn {
  session: SessionState;
  
  // Session lifecycle
  startSession: (type: SessionType, patientInfo: PatientInfo) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  resetSession: () => void;
  
  // Data updates
  updatePatientInfo: (patientInfo: PatientInfo) => void;
  updateIntakeData: (intakeData: IntakeData) => void;
  updateFollowupData: (followupData: FollowupData) => void;
  setCurrentStep: (step: string) => void;
  
  // Auto-save controls
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  manualSave: () => void;
  
  // Session queries
  isSessionActive: boolean;
  isSessionPaused: boolean;
  isSessionCompleted: boolean;
  sessionDuration: number; // in milliseconds
  timeSinceLastSave: number; // in milliseconds
  hasUnsavedChanges: boolean;
  
  // Session recovery
  loadSession: (sessionId: string) => boolean;
  getSavedSessions: () => SessionState[];
  deleteSession: (sessionId: string) => void;
}

const DEFAULT_OPTIONS: Required<UseSessionStateOptions> = {
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  storageKey: 'hysio-scribe-sessions',
};

const createInitialSessionState = (): SessionState => ({
  id: '',
  type: 'intake',
  status: 'idle',
  patientInfo: null,
  intakeData: null,
  followupData: null,
  currentStep: null,
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  lastSavedAt: null,
  autoSaveEnabled: true,
});

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useSessionState = (options: UseSessionStateOptions = {}): UseSessionStateReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [session, setSession] = useState<SessionState>(createInitialSessionState);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const sessionStartTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);

  // Save session to localStorage
  const saveToStorage = useCallback((sessionToSave: SessionState) => {
    try {
      const sessions = getSavedSessions();
      const existingIndex = sessions.findIndex(s => s.id === sessionToSave.id);
      
      const updatedSession = {
        ...sessionToSave,
        lastSavedAt: new Date().toISOString(),
      };
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = updatedSession;
      } else {
        sessions.push(updatedSession);
      }
      
      // Keep only last 10 sessions to prevent storage bloat
      const sortedSessions = sessions
        .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
        .slice(0, 10);
      
      localStorage.setItem(config.storageKey, JSON.stringify(sortedSessions));
      
      setSession(prev => ({
        ...prev,
        lastSavedAt: updatedSession.lastSavedAt,
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }, [config.storageKey]);

  // Load sessions from localStorage
  const getSavedSessions = useCallback((): SessionState[] => {
    try {
      const saved = localStorage.getItem(config.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }, [config.storageKey]);

  // Auto-save functionality
  const setupAutoSave = useCallback(() => {
    if (session.autoSaveEnabled && session.status === 'in-progress' && session.id) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      autoSaveIntervalRef.current = setInterval(() => {
        setSession(current => {
          if (current.status === 'in-progress') {
            saveToStorage(current);
          }
          return current;
        });
      }, config.autoSaveInterval);
    }
  }, [session.autoSaveEnabled, session.status, session.id, config.autoSaveInterval, saveToStorage]);

  const clearAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = undefined;
    }
  }, []);

  // Session lifecycle methods
  const startSession = useCallback((type: SessionType, patientInfo: PatientInfo) => {
    const sessionId = generateSessionId();
    const now = new Date().toISOString();
    
    sessionStartTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    lastPauseTimeRef.current = 0;
    
    const newSession: SessionState = {
      id: sessionId,
      type,
      status: 'in-progress',
      patientInfo,
      intakeData: type === 'intake' ? {
        patientInfo,
        preparation: '',
        anamnesisRecording: null,
        anamnesisTranscript: '',
        phsbStructure: null,
        examinationPlan: '',
        examinationRecording: null,
        examinationFindings: '',
        clinicalConclusion: '',
        diagnosis: '',
        treatmentPlan: '',
        redFlags: [],
        recommendations: '',
        followUpPlan: '',
        notes: '',
        createdAt: now,
        updatedAt: now,
      } : null,
      followupData: type === 'followup' ? {
        patientInfo,
        sessionPreparation: '',
        soepRecording: null,
        soepTranscript: '',
        soepStructure: null,
        progressEvaluation: '',
        treatmentAdjustments: '',
        nextSessionPlan: '',
        homeExercises: '',
        patientEducation: '',
        redFlags: [],
        notes: '',
        createdAt: now,
        updatedAt: now,
      } : null,
      currentStep: type === 'intake' ? 'preparation' : 'session-planning',
      startedAt: now,
      pausedAt: null,
      completedAt: null,
      lastSavedAt: null,
      autoSaveEnabled: config.autoSave,
    };
    
    setSession(newSession);
    saveToStorage(newSession);
  }, [config.autoSave, saveToStorage]);

  const pauseSession = useCallback(() => {
    if (session.status === 'in-progress') {
      const now = new Date().toISOString();
      lastPauseTimeRef.current = Date.now();
      
      setSession(prev => {
        const paused = {
          ...prev,
          status: 'paused' as SessionStatus,
          pausedAt: now,
        };
        saveToStorage(paused);
        return paused;
      });
      
      clearAutoSave();
    }
  }, [session.status, saveToStorage, clearAutoSave]);

  const resumeSession = useCallback(() => {
    if (session.status === 'paused') {
      const now = Date.now();
      if (lastPauseTimeRef.current > 0) {
        totalPausedTimeRef.current += now - lastPauseTimeRef.current;
      }
      
      setSession(prev => ({
        ...prev,
        status: 'in-progress',
        pausedAt: null,
      }));
    }
  }, [session.status]);

  const completeSession = useCallback(() => {
    if (session.status === 'in-progress' || session.status === 'paused') {
      const now = new Date().toISOString();
      
      setSession(prev => {
        const completed = {
          ...prev,
          status: 'completed' as SessionStatus,
          completedAt: now,
          pausedAt: null,
        };
        saveToStorage(completed);
        return completed;
      });
      
      clearAutoSave();
    }
  }, [session.status, saveToStorage, clearAutoSave]);

  const resetSession = useCallback(() => {
    clearAutoSave();
    sessionStartTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    lastPauseTimeRef.current = 0;
    setSession(createInitialSessionState());
  }, [clearAutoSave]);

  // Data update methods
  const updatePatientInfo = useCallback((patientInfo: PatientInfo) => {
    setSession(prev => ({
      ...prev,
      patientInfo,
      intakeData: prev.intakeData ? { ...prev.intakeData, patientInfo } : null,
      followupData: prev.followupData ? { ...prev.followupData, patientInfo } : null,
    }));
  }, []);

  const updateIntakeData = useCallback((intakeData: IntakeData) => {
    setSession(prev => ({
      ...prev,
      intakeData: {
        ...intakeData,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const updateFollowupData = useCallback((followupData: FollowupData) => {
    setSession(prev => ({
      ...prev,
      followupData: {
        ...followupData,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const setCurrentStep = useCallback((step: string) => {
    setSession(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  // Auto-save controls
  const enableAutoSave = useCallback(() => {
    setSession(prev => ({
      ...prev,
      autoSaveEnabled: true,
    }));
  }, []);

  const disableAutoSave = useCallback(() => {
    clearAutoSave();
    setSession(prev => ({
      ...prev,
      autoSaveEnabled: false,
    }));
  }, [clearAutoSave]);

  const manualSave = useCallback(() => {
    if (session.id) {
      saveToStorage(session);
    }
  }, [session, saveToStorage]);

  // Session recovery methods
  const loadSession = useCallback((sessionId: string): boolean => {
    const sessions = getSavedSessions();
    const sessionToLoad = sessions.find(s => s.id === sessionId);
    
    if (sessionToLoad) {
      setSession(sessionToLoad);
      
      if (sessionToLoad.status === 'in-progress') {
        // Reset timing data for resumed session
        sessionStartTimeRef.current = Date.now();
        totalPausedTimeRef.current = 0;
        lastPauseTimeRef.current = 0;
      }
      
      return true;
    }
    
    return false;
  }, [getSavedSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    const sessions = getSavedSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(config.storageKey, JSON.stringify(filteredSessions));
  }, [getSavedSessions, config.storageKey]);

  // Computed values
  const isSessionActive = session.status === 'in-progress';
  const isSessionPaused = session.status === 'paused';
  const isSessionCompleted = session.status === 'completed';
  
  const sessionDuration = sessionStartTimeRef.current > 0 
    ? Date.now() - sessionStartTimeRef.current - totalPausedTimeRef.current 
    : 0;
    
  const timeSinceLastSave = session.lastSavedAt 
    ? Date.now() - new Date(session.lastSavedAt).getTime()
    : Infinity;
    
  const hasUnsavedChanges = timeSinceLastSave > config.autoSaveInterval;

  // Set up auto-save when session becomes active
  useEffect(() => {
    if (session.status === 'in-progress' && session.autoSaveEnabled) {
      setupAutoSave();
    } else {
      clearAutoSave();
    }
    
    return () => clearAutoSave();
  }, [session.status, session.autoSaveEnabled, setupAutoSave, clearAutoSave]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAutoSave();
    };
  }, [clearAutoSave]);

  return {
    session,
    
    // Session lifecycle
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    resetSession,
    
    // Data updates
    updatePatientInfo,
    updateIntakeData,
    updateFollowupData,
    setCurrentStep,
    
    // Auto-save controls
    enableAutoSave,
    disableAutoSave,
    manualSave,
    
    // Session queries
    isSessionActive,
    isSessionPaused,
    isSessionCompleted,
    sessionDuration,
    timeSinceLastSave,
    hasUnsavedChanges,
    
    // Session recovery
    loadSession,
    getSavedSessions,
    deleteSession,
  };
};