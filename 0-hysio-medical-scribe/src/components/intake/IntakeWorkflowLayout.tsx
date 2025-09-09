'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIntakeSession } from '@/context/IntakeSessionContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Save, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  Search,
  Activity
} from 'lucide-react';

interface IntakeWorkflowLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  showProgressBar?: boolean;
}

export function IntakeWorkflowLayout({
  children,
  title,
  subtitle,
  canGoNext = true,
  canGoPrevious = true,
  onNext,
  onPrevious,
  showProgressBar = true,
}: IntakeWorkflowLayoutProps) {
  const router = useRouter();
  const { 
    state, 
    nextStep, 
    previousStep, 
    resetSession, 
    saveSession, 
    getStepProgress,
    getTotalDuration 
  } = useIntakeSession();

  const progress = getStepProgress();
  const duration = getTotalDuration();

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      previousStep();
    }
  };

  const handleSaveAndExit = async () => {
    await saveSession();
    router.push('/dashboard');
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'voorbereiding':
        return <FileText size={16} />;
      case 'anamnese':
        return <Users size={16} />;
      case 'onderzoek':
        return <Search size={16} />;
      case 'klinische-conclusie':
        return <Activity size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-surface border-b border-border-muted p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-hysio-deep-green/10 rounded-full flex items-center justify-center">
              {getStepIcon(state.currentStep || '')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-secondary">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-text-muted">{subtitle}</p>
              )}
              {state.patientInfo && (
                <p className="text-sm text-text-muted">
                  {state.patientInfo.initials} ({state.patientInfo.birthYear}) - 
                  {state.sessionType === 'intake' ? ' Nieuwe Intake' : ' Vervolgconsult'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Status */}
            {state.sessionId && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-text-secondary" />
                  <span className="text-text-muted">
                    {formatDuration(duration)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-700">Actief</span>
                </div>
                
                {state.hasUnsavedChanges && (
                  <div className="flex items-center gap-1">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-amber-700 text-xs">Niet opgeslagen</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveSession}
                className="text-text-secondary"
              >
                <Save size={14} className="mr-1" />
                Opslaan
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
              >
                <Home size={14} className="mr-1" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSession}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Stoppen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="bg-background-surface border-b border-border-muted p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">
                Stap {progress.current} van {progress.total}
              </span>
              <span className="text-sm text-text-muted">
                {progress.percentage}% voltooid
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-hysio-deep-green h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between mt-3">
              {['voorbereiding', 'anamnese', 'onderzoek', 'klinische-conclusie'].map((step, index) => {
                const isActive = state.currentStep === step;
                const isCompleted = progress.current > index + 1;
                
                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200
                      ${isActive 
                        ? 'bg-hysio-deep-green text-white' 
                        : isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`
                      text-xs capitalize
                      ${isActive ? 'text-hysio-deep-green font-medium' : 'text-text-muted'}
                    `}>
                      {step.replace('-', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-background-surface border-t border-border-muted p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canGoPrevious && progress.current > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Vorige
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canGoNext && progress.current < progress.total && (
              <Button
                variant="primary"
                onClick={handleNext}
                className="gap-2"
              >
                Volgende
                <ArrowRight size={16} />
              </Button>
            )}
            
            {progress.current === progress.total && (
              <Button
                variant="primary"
                onClick={() => {
                  // Complete the intake and go to results
                  saveSession();
                  router.push('/scribe/resultaten');
                }}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Intake Afronden
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}