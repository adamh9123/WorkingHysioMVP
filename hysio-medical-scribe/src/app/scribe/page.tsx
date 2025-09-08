'use client';

import * as React from 'react';
import { SessionTypeSelector } from '@/components/scribe/session-type-selector';
import { PatientInfoForm } from '@/components/scribe/patient-info-form';
import { NewIntakeWorkflow } from '@/components/scribe/new-intake-workflow';
import { StreamlinedFollowupWorkflow } from '@/components/scribe/streamlined-followup-workflow';
import { SOEPResultPage } from '@/components/scribe/soep-result-page';
import { ConsultSummaryPage } from '@/components/scribe/consult-summary-page';
import { useSessionState } from '@/hooks/useSessionState';
import { PatientInfo, IntakeData, FollowupData, SOEPStructure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause,
  RotateCcw,
  Home,
  Save
} from 'lucide-react';

type ApplicationStep = 
  | 'session-type-selection'
  | 'patient-info'
  | 'workflow'
  | 'soep-result'
  | 'consult-summary'
  | 'completed';

export default function ScribePage() {
  const [currentStep, setCurrentStep] = React.useState<ApplicationStep>('session-type-selection');
  const [sessionType, setSessionType] = React.useState<'intake' | 'followup' | null>(null);
  const [patientInfo, setPatientInfo] = React.useState<PatientInfo | null>(null);
  const [completedSessionData, setCompletedSessionData] = React.useState<IntakeData | FollowupData | null>(null);
  const [soepResultData, setSOEPResultData] = React.useState<SOEPStructure | null>(null);
  const [consultSummaryData, setConsultSummaryData] = React.useState<{ soepData: SOEPStructure; sessionPreparation?: string } | null>(null);

  const sessionState = useSessionState({
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
  });

  const handleSessionTypeSelect = (type: 'intake' | 'followup') => {
    setSessionType(type);
    // Both intake and followup now use the same full-page patient-info flow
    setCurrentStep('patient-info');
  };

  const handlePatientInfoSubmit = (info: PatientInfo) => {
    setPatientInfo(info);
    
    // Start session with session state manager
    if (sessionType) {
      sessionState.startSession(sessionType, info);
    }
    
    // Both intake and followup go to workflow after patient info submission
    setCurrentStep('workflow');
  };


  const handleWorkflowComplete = (data: IntakeData | FollowupData) => {
    setCompletedSessionData(data);
    sessionState.completeSession();
    setCurrentStep('completed');
  };

  const handleSOEPComplete = (soepData: SOEPStructure, sessionPreparation?: string) => {
    setConsultSummaryData({ soepData, sessionPreparation });
    setCurrentStep('consult-summary');
  };

  const handleSOEPResultBack = () => {
    setCurrentStep('workflow');
  };

  const handleConsultSummaryBack = () => {
    setCurrentStep('workflow');
  };


  const handleSOEPResultComplete = (editedSoepData: SOEPStructure) => {
    // Create a FollowupData object with the SOEP data
    const followupData: FollowupData = {
      patientInfo: patientInfo!,
      sessionPreparation: '', // This would come from the streamlined workflow
      soepRecording: null,
      soepTranscript: '',
      soepStructure: editedSoepData,
      progressEvaluation: '',
      treatmentAdjustments: '',
      nextSessionPlan: '',
      homeExercises: '',
      patientEducation: '',
      redFlags: editedSoepData.redFlags || [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    handleWorkflowComplete(followupData);
  };

  const handleBackToPatientInfo = () => {
    setCurrentStep('patient-info');
  };

  const handleBackToSessionType = () => {
    // Pause session if active
    if (sessionState.isSessionActive) {
      sessionState.pauseSession();
    }
    setCurrentStep('session-type-selection');
    setSessionType(null);
    setPatientInfo(null);
  };

  const handleStartNew = () => {
    sessionState.resetSession();
    setCurrentStep('session-type-selection');
    setSessionType(null);
    setPatientInfo(null);
    setCompletedSessionData(null);
    setSOEPResultData(null);
    setConsultSummaryData(null);
  };

  const handleSaveAndExit = () => {
    if (sessionState.isSessionActive) {
      sessionState.pauseSession();
    }
    // In a real application, this would navigate to a dashboard or session list
    console.log('Session saved and paused');
  };

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-hysio-mint/20 p-4 mb-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-hysio-mint/20 rounded-full flex items-center justify-center">
            <FileText size={20} className="text-hysio-deep-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-hysio-deep-green">
              Hysio Medical Scribe
            </h1>
            {patientInfo && (
              <p className="text-sm text-hysio-deep-green-900/70">
                {patientInfo.initials} ({patientInfo.birthYear}) - 
                {sessionType === 'intake' ? ' Nieuwe Intake' : ' Vervolgconsult'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Session Status */}
          {sessionState.session.id && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-hysio-deep-green" />
                <span className="text-hysio-deep-green-900/80">
                  {formatDuration(sessionState.sessionDuration)}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {sessionState.isSessionActive && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700">Actief</span>
                  </>
                )}
                {sessionState.isSessionPaused && (
                  <>
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-amber-700">Gepauzeerd</span>
                  </>
                )}
                {sessionState.isSessionCompleted && (
                  <>
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-green-700">Voltooid</span>
                  </>
                )}
              </div>
              
              {sessionState.hasUnsavedChanges && (
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-amber-700 text-xs">Niet opgeslagen</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {sessionState.isSessionActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={sessionState.pauseSession}
                className="text-hysio-deep-green"
              >
                <Pause size={14} className="mr-1" />
                Pauzeren
              </Button>
            )}
            
            {sessionState.isSessionPaused && (
              <Button
                variant="ghost"
                size="sm"
                onClick={sessionState.resumeSession}
                className="text-hysio-deep-green"
              >
                <Play size={14} className="mr-1" />
                Hervatten
              </Button>
            )}
            
            {(sessionState.isSessionActive || sessionState.isSessionPaused) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={sessionState.manualSave}
                className="text-hysio-deep-green"
              >
                <Save size={14} className="mr-1" />
                Opslaan
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAndExit}
            >
              <Home size={14} className="mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'session-type-selection':
        return (
          <SessionTypeSelector
            onSessionTypeSelect={handleSessionTypeSelect}
          />
        );

      case 'patient-info':
        return (
          <PatientInfoForm
            onPatientInfoSubmit={handlePatientInfoSubmit}
            onBack={handleBackToSessionType}
            sessionType={sessionType!}
          />
        );

      case 'workflow':
        return (
          <div className="space-y-6">
            {sessionType === 'intake' ? (
              <NewIntakeWorkflow
                patientInfo={patientInfo!}
                onComplete={handleWorkflowComplete}
                onBack={handleBackToSessionType}
                initialData={sessionState.session.intakeData || undefined}
              />
            ) : (
              <StreamlinedFollowupWorkflow
                patientInfo={patientInfo!}
                onComplete={handleSOEPComplete}
                onBack={handleBackToPatientInfo}
              />
            )}
          </div>
        );

      case 'soep-result':
        return soepResultData && patientInfo ? (
          <SOEPResultPage
            patientInfo={patientInfo}
            soepData={soepResultData}
            onBack={handleSOEPResultBack}
            onComplete={handleSOEPResultComplete}
          />
        ) : null;

      case 'consult-summary':
        return consultSummaryData && patientInfo ? (
          <ConsultSummaryPage
            patientInfo={patientInfo}
            soepData={consultSummaryData.soepData}
            sessionPreparation={consultSummaryData.sessionPreparation}
            onBack={handleConsultSummaryBack}
            onExportPDF={() => {}} // Export is now handled internally
            onExportWord={() => {}} // Export is now handled internally
          />
        ) : null;

      case 'completed':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <CardTitle className="text-2xl font-semibold text-green-800">
                  Sessie Voltooid!
                </CardTitle>
                <CardDescription className="text-green-700">
                  {sessionType === 'intake' ? 'Intake' : 'Vervolgconsult'} voor {patientInfo?.initials} ({patientInfo?.birthYear}) is succesvol afgerond
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-6">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <User size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">Patiënt</span>
                    </div>
                    <p className="text-green-700">
                      {patientInfo?.initials} ({patientInfo?.birthYear})
                    </p>
                  </div>
                  
                  <div className="bg-white/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <Clock size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">Duur</span>
                    </div>
                    <p className="text-green-700">
                      {formatDuration(sessionState.sessionDuration)}
                    </p>
                  </div>
                  
                  <div className="bg-white/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <FileText size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">Type</span>
                    </div>
                    <p className="text-green-700">
                      {sessionType === 'intake' ? 'Nieuwe Intake' : 'Vervolgconsult'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartNew}
                  >
                    <RotateCcw size={18} className="mr-2" />
                    Nieuwe Sessie Starten
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      // In a real app, this would navigate to session details or export
                      console.log('Export session data:', completedSessionData);
                    }}
                  >
                    <FileText size={18} className="mr-2" />
                    Exporteren
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleSaveAndExit}
                  >
                    <Home size={18} className="mr-2" />
                    Terug naar Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-hysio-cream/30">
      {renderHeader()}
      
      <main className="pb-8">
        {renderContent()}
      </main>
      
      
      {/* Footer */}
      <footer className="bg-white border-t border-hysio-mint/20 p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-hysio-deep-green-900/60">
            Hysio Medical Scribe - AI-ondersteunde fysiotherapie documentatie
          </p>
          <p className="text-xs text-hysio-deep-green-900/50 mt-1">
            Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF) - 
            Alle AI-content moet worden geverifieerd door een bevoegd fysiotherapeut
          </p>
        </div>
      </footer>
    </div>
  );
}