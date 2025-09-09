'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIntakeSession } from '@/context/IntakeSessionContext';
import { SessionTypeSelector } from '@/components/scribe/session-type-selector';
import { PatientInfoForm } from '@/components/scribe/patient-info-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  ArrowRight, 
  RefreshCw,
  Home,
  Clock,
  CheckCircle
} from 'lucide-react';
import { PatientInfo } from '@/lib/types';

export default function ScribePage() {
  const router = useRouter();
  const { state, startSession, resetSession } = useIntakeSession();
  
  const [currentStep, setCurrentStep] = React.useState<'session-selection' | 'patient-info'>('session-selection');
  const [selectedSessionType, setSelectedSessionType] = React.useState<'intake' | 'followup' | null>(null);

  // If there's an active session, redirect to the appropriate step
  useEffect(() => {
    if (state.sessionId && state.currentStep) {
      const stepRoutes = {
        'voorbereiding': '/scribe/voorbereiding-intake',
        'anamnese': '/scribe/anamnese',
        'onderzoek': '/scribe/onderzoek',
        'klinische-conclusie': '/scribe/klinische-conclusie',
      };
      
      router.push(stepRoutes[state.currentStep]);
    }
  }, [state.sessionId, state.currentStep, router]);

  const handleSessionTypeSelect = (type: 'intake' | 'followup') => {
    setSelectedSessionType(type);
    setCurrentStep('patient-info');
  };

  const handlePatientInfoSubmit = (patientInfo: PatientInfo) => {
    if (selectedSessionType) {
      startSession(selectedSessionType, patientInfo);
      // The useEffect will handle the redirect
    }
  };

  const handleBackToSessionSelection = () => {
    setCurrentStep('session-selection');
    setSelectedSessionType(null);
  };

  const handleNewSession = () => {
    resetSession();
    setCurrentStep('session-selection');
    setSelectedSessionType(null);
  };

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-surface border-b border-border-muted p-4 mb-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-hysio-deep-green/10 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-hysio-deep-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-secondary">
                Hysio Medical Scribe
              </h1>
              <p className="text-sm text-text-muted">
                Start een nieuwe intake of vervolgconsult sessie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <Home size={14} className="mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-8">
        {/* Active Session Warning */}
        {state.sessionId && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-amber-600" />
                  <div>
                    <CardTitle className="text-amber-800">Actieve Sessie Gevonden</CardTitle>
                    <CardDescription className="text-amber-600">
                      U heeft een actieve {state.sessionType} sessie voor {state.patientInfo?.initials}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-amber-700">
                    Duur: {formatDuration(Date.now() - new Date(state.startTime || 0).getTime())}
                  </div>
                  <div className="text-xs text-amber-600">
                    Huidige stap: {state.currentStep || 'onbekend'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const stepRoutes = {
                      'voorbereiding': '/scribe/voorbereiding-intake',
                      'anamnese': '/scribe/anamnese',
                      'onderzoek': '/scribe/onderzoek',
                      'klinische-conclusie': '/scribe/klinische-conclusie',
                    };
                    
                    router.push(stepRoutes[state.currentStep || 'voorbereiding']);
                  }}
                  className="gap-2"
                >
                  <ArrowRight size={16} />
                  Verder met sessie
                </Button>
                
                <Button
                  onClick={handleNewSession}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw size={16} />
                  Nieuwe sessie starten
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {currentStep === 'session-selection' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-text-secondary mb-4">
                Welkom bij Hysio Medical Scribe
              </h2>
              <p className="text-lg text-text-muted max-w-2xl mx-auto">
                Start een nieuwe fysiotherapie sessie. Kies het type sessie om te beginnen 
                met de gestructureerde documentatie workflow.
              </p>
            </div>

            {/* Session Type Selection */}
            <SessionTypeSelector onSessionTypeSelect={handleSessionTypeSelect} />

            {/* Features Overview */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-hysio-deep-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-hysio-deep-green" />
                  </div>
                  <CardTitle>Multi-Step Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Systematische 4-stappen intake workflow met voorbereiding, anamnese, 
                    onderzoek en klinische conclusie.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-hysio-assistant/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-hysio-assistant" />
                  </div>
                  <CardTitle>State Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Alle gegevens worden automatisch opgeslagen. U kunt naadloos tussen 
                    stappen navigeren zonder gegevensverlies.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-hysio-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={28} className="text-hysio-emerald" />
                  </div>
                  <CardTitle>KNGF Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Volledig conform Nederlandse fysiotherapie richtlijnen met 
                    gestructureerde documentatie en kwaliteitscontrole.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'patient-info' && selectedSessionType && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button
                onClick={handleBackToSessionSelection}
                variant="ghost"
                className="gap-2 text-text-muted hover:text-text-secondary"
              >
                <ArrowRight size={16} className="rotate-180" />
                Terug naar sessie selectie
              </Button>
            </div>

            <PatientInfoForm
              onPatientInfoSubmit={handlePatientInfoSubmit}
              onBack={handleBackToSessionSelection}
              sessionType={selectedSessionType}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-background-surface border-t border-border-muted p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-text-muted">
            Hysio Medical Scribe - AI-ondersteunde fysiotherapie documentatie
          </p>
          <p className="text-xs text-text-muted mt-1">
            Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF) - 
            Alle AI-content moet worden geverifieerd door een bevoegd fysiotherapeut
          </p>
        </div>
      </footer>
    </div>
  );
}