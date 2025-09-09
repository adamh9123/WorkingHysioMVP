'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PatientInfo, IntakeData } from '@/lib/types';

// Extended state interface for multi-page workflow
export interface IntakeSessionData {
  // Patient Information
  patientInfo: PatientInfo | null;
  
  // Session metadata
  sessionId: string | null;
  sessionType: 'intake' | 'followup' | null;
  currentStep: 'voorbereiding' | 'anamnese' | 'onderzoek' | 'klinische-conclusie' | null;
  
  // Intake workflow data
  anamneseData: {
    klacht: string;
    ontstaanswijze: string;
    beloop: string;
    beperkingen: string;
    hulpvraag: string;
    verwachtingen: string;
    voorgaande_behandelingen: string;
    medicatie: string;
    comorbiditeit: string;
    werk_sport: string;
    aanvullende_info: string;
  } | null;
  
  onderzoekData: {
    observatie: string;
    bewegingsonderzoek: string;
    functieonderzoek: string;
    provocatietesten: string;
    palpatie: string;
    aanvullende_testen: string;
    metingen: Array<{
      test: string;
      resultaat: string;
      referentiewaarde: string;
      interpretatie: string;
    }>;
  } | null;
  
  klinischeConclusieData: {
    hypotheses: Array<{
      hypothese: string;
      onderbouwing: string;
      waarschijnlijkheid: 'hoog' | 'middel' | 'laag';
    }>;
    diagnose: string;
    prognose: string;
    behandelplan: string;
    doelen: Array<{
      doel: string;
      termijn: 'kort' | 'middel' | 'lang';
      meetbaar: boolean;
    }>;
    rode_vlagen: string[];
    vervolgstappen: string;
  } | null;
  
  // Session timing and metadata
  startTime: string | null;
  currentStepStartTime: string | null;
  stepDurations: Record<string, number>;
  totalDuration: number;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
}

type IntakeSessionAction = 
  | { type: 'START_SESSION'; payload: { sessionType: 'intake' | 'followup'; patientInfo: PatientInfo } }
  | { type: 'UPDATE_PATIENT_INFO'; payload: PatientInfo }
  | { type: 'SET_CURRENT_STEP'; payload: IntakeSessionData['currentStep'] }
  | { type: 'UPDATE_ANAMNESE'; payload: Partial<IntakeSessionData['anamneseData']> }
  | { type: 'UPDATE_ONDERZOEK'; payload: Partial<IntakeSessionData['onderzoekData']> }
  | { type: 'UPDATE_KLINISCHE_CONCLUSIE'; payload: Partial<IntakeSessionData['klinischeConclusieData']> }
  | { type: 'MARK_STEP_COMPLETE'; payload: string }
  | { type: 'SAVE_SESSION' }
  | { type: 'RESET_SESSION' }
  | { type: 'LOAD_SESSION'; payload: IntakeSessionData }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean };

const initialState: IntakeSessionData = {
  patientInfo: null,
  sessionId: null,
  sessionType: null,
  currentStep: null,
  anamneseData: null,
  onderzoekData: null,
  klinischeConclusieData: null,
  startTime: null,
  currentStepStartTime: null,
  stepDurations: {},
  totalDuration: 0,
  lastSaved: null,
  hasUnsavedChanges: false,
};

function intakeSessionReducer(state: IntakeSessionData, action: IntakeSessionAction): IntakeSessionData {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: action.payload.sessionType,
        patientInfo: action.payload.patientInfo,
        currentStep: 'voorbereiding',
        startTime: new Date().toISOString(),
        currentStepStartTime: new Date().toISOString(),
        hasUnsavedChanges: true,
      };
      
    case 'UPDATE_PATIENT_INFO':
      return {
        ...state,
        patientInfo: action.payload,
        hasUnsavedChanges: true,
      };
      
    case 'SET_CURRENT_STEP': {
      const now = new Date().toISOString();
      const currentStepDuration = state.currentStepStartTime 
        ? Date.now() - new Date(state.currentStepStartTime).getTime()
        : 0;
        
      return {
        ...state,
        currentStep: action.payload,
        currentStepStartTime: now,
        stepDurations: state.currentStep ? {
          ...state.stepDurations,
          [state.currentStep]: (state.stepDurations[state.currentStep] || 0) + currentStepDuration,
        } : state.stepDurations,
      };
    }
    
    case 'UPDATE_ANAMNESE':
      return {
        ...state,
        anamneseData: {
          klacht: '',
          ontstaanswijze: '',
          beloop: '',
          beperkingen: '',
          hulpvraag: '',
          verwachtingen: '',
          voorgaande_behandelingen: '',
          medicatie: '',
          comorbiditeit: '',
          werk_sport: '',
          aanvullende_info: '',
          ...state.anamneseData,
          ...action.payload,
        },
        hasUnsavedChanges: true,
      };
      
    case 'UPDATE_ONDERZOEK':
      return {
        ...state,
        onderzoekData: {
          observatie: '',
          bewegingsonderzoek: '',
          functieonderzoek: '',
          provocatietesten: '',
          palpatie: '',
          aanvullende_testen: '',
          metingen: [],
          ...state.onderzoekData,
          ...action.payload,
        },
        hasUnsavedChanges: true,
      };
      
    case 'UPDATE_KLINISCHE_CONCLUSIE':
      return {
        ...state,
        klinischeConclusieData: {
          hypotheses: [],
          diagnose: '',
          prognose: '',
          behandelplan: '',
          doelen: [],
          rode_vlagen: [],
          vervolgstappen: '',
          ...state.klinischeConclusieData,
          ...action.payload,
        },
        hasUnsavedChanges: true,
      };
      
    case 'SAVE_SESSION':
      return {
        ...state,
        lastSaved: new Date().toISOString(),
        hasUnsavedChanges: false,
      };
      
    case 'RESET_SESSION':
      return initialState;
      
    case 'LOAD_SESSION':
      return action.payload;
      
    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload,
      };
      
    default:
      return state;
  }
}

interface IntakeSessionContextType {
  state: IntakeSessionData;
  
  // Session management
  startSession: (sessionType: 'intake' | 'followup', patientInfo: PatientInfo) => void;
  resetSession: () => void;
  saveSession: () => Promise<void>;
  loadSession: (sessionData: IntakeSessionData) => void;
  
  // Navigation
  goToStep: (step: IntakeSessionData['currentStep']) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Data updates
  updatePatientInfo: (patientInfo: PatientInfo) => void;
  updateAnamnese: (data: Partial<IntakeSessionData['anamneseData']>) => void;
  updateOnderzoek: (data: Partial<IntakeSessionData['onderzoekData']>) => void;
  updateKlinischeConclusie: (data: Partial<IntakeSessionData['klinischeConclusieData']>) => void;
  
  // Utility
  getStepProgress: () => { current: number; total: number; percentage: number };
  getTotalDuration: () => number;
  canNavigateToStep: (step: IntakeSessionData['currentStep']) => boolean;
}

const IntakeSessionContext = createContext<IntakeSessionContextType | null>(null);

export function IntakeSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(intakeSessionReducer, initialState);
  const router = useRouter();
  
  // Auto-save functionality
  useEffect(() => {
    if (state.hasUnsavedChanges && state.sessionId) {
      const autoSaveTimer = setTimeout(() => {
        saveSession();
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [state.hasUnsavedChanges, state.sessionId]);
  
  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('hysio_intake_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        dispatch({ type: 'LOAD_SESSION', payload: sessionData });
      } catch (error) {
        console.error('Failed to load saved session:', error);
      }
    }
  }, []);
  
  const startSession = useCallback((sessionType: 'intake' | 'followup', patientInfo: PatientInfo) => {
    dispatch({ type: 'START_SESSION', payload: { sessionType, patientInfo } });
    router.push('/scribe/voorbereiding-intake');
  }, [router]);
  
  const resetSession = useCallback(() => {
    localStorage.removeItem('hysio_intake_session');
    dispatch({ type: 'RESET_SESSION' });
    router.push('/scribe');
  }, [router]);
  
  const saveSession = useCallback(async () => {
    if (state.sessionId) {
      try {
        localStorage.setItem('hysio_intake_session', JSON.stringify(state));
        dispatch({ type: 'SAVE_SESSION' });
        console.log('Session saved successfully');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }, [state]);
  
  const loadSession = useCallback((sessionData: IntakeSessionData) => {
    dispatch({ type: 'LOAD_SESSION', payload: sessionData });
  }, []);
  
  const goToStep = useCallback((step: IntakeSessionData['currentStep']) => {
    if (!step) return;
    
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    
    const stepRoutes = {
      'voorbereiding': '/scribe/voorbereiding-intake',
      'anamnese': '/scribe/anamnese',
      'onderzoek': '/scribe/onderzoek',
      'klinische-conclusie': '/scribe/klinische-conclusie',
    };
    
    router.push(stepRoutes[step]);
  }, [router]);
  
  const nextStep = useCallback(() => {
    const stepOrder: IntakeSessionData['currentStep'][] = [
      'voorbereiding', 'anamnese', 'onderzoek', 'klinische-conclusie'
    ];
    
    const currentIndex = state.currentStep ? stepOrder.indexOf(state.currentStep) : -1;
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  }, [state.currentStep, goToStep]);
  
  const previousStep = useCallback(() => {
    const stepOrder: IntakeSessionData['currentStep'][] = [
      'voorbereiding', 'anamnese', 'onderzoek', 'klinische-conclusie'
    ];
    
    const currentIndex = state.currentStep ? stepOrder.indexOf(state.currentStep) : -1;
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  }, [state.currentStep, goToStep]);
  
  const updatePatientInfo = useCallback((patientInfo: PatientInfo) => {
    dispatch({ type: 'UPDATE_PATIENT_INFO', payload: patientInfo });
  }, []);
  
  const updateAnamnese = useCallback((data: Partial<IntakeSessionData['anamneseData']>) => {
    dispatch({ type: 'UPDATE_ANAMNESE', payload: data });
  }, []);
  
  const updateOnderzoek = useCallback((data: Partial<IntakeSessionData['onderzoekData']>) => {
    dispatch({ type: 'UPDATE_ONDERZOEK', payload: data });
  }, []);
  
  const updateKlinischeConclusie = useCallback((data: Partial<IntakeSessionData['klinischeConclusieData']>) => {
    dispatch({ type: 'UPDATE_KLINISCHE_CONCLUSIE', payload: data });
  }, []);
  
  const getStepProgress = useCallback(() => {
    const stepOrder = ['voorbereiding', 'anamnese', 'onderzoek', 'klinische-conclusie'];
    const currentIndex = state.currentStep ? stepOrder.indexOf(state.currentStep) : 0;
    
    return {
      current: currentIndex + 1,
      total: stepOrder.length,
      percentage: Math.round(((currentIndex + 1) / stepOrder.length) * 100),
    };
  }, [state.currentStep]);
  
  const getTotalDuration = useCallback(() => {
    if (!state.startTime) return 0;
    return Date.now() - new Date(state.startTime).getTime();
  }, [state.startTime]);
  
  const canNavigateToStep = useCallback((step: IntakeSessionData['currentStep']) => {
    // For now, allow navigation to any step if session is active
    // In the future, you could add validation logic here
    return state.sessionId !== null && step !== null;
  }, [state.sessionId]);
  
  const value: IntakeSessionContextType = {
    state,
    startSession,
    resetSession,
    saveSession,
    loadSession,
    goToStep,
    nextStep,
    previousStep,
    updatePatientInfo,
    updateAnamnese,
    updateOnderzoek,
    updateKlinischeConclusie,
    getStepProgress,
    getTotalDuration,
    canNavigateToStep,
  };
  
  return (
    <IntakeSessionContext.Provider value={value}>
      {children}
    </IntakeSessionContext.Provider>
  );
}

export function useIntakeSession() {
  const context = useContext(IntakeSessionContext);
  if (!context) {
    throw new Error('useIntakeSession must be used within an IntakeSessionProvider');
  }
  return context;
}