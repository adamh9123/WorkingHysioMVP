import * as React from 'react';
import { cn } from '@/utils';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { AssistantIntegration } from '@/components/assistant/assistant-integration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { 
  Mic, 
  Upload, 
  FileText, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { AudioTranscription, AudioRecording } from '@/lib/types';

export interface InputPanelProps {
  phase: 'anamnesis' | 'examination';
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onTranscriptionComplete?: (transcription: AudioTranscription) => void;
  onError?: (error: string) => void;
  onManualNotesChange?: (notes: string) => void;
  onProcessClick?: () => void;
  processButtonLabel?: string;
  manualNotes?: string;
  disabled?: boolean;
  isProcessing?: boolean;
  className?: string;
  recording?: AudioRecording | null;
  showProcessButton?: boolean;
  hasProcessed?: boolean; // Flag to control collapsible section states
}

const InputPanel: React.FC<InputPanelProps> = ({
  phase,
  onRecordingComplete,
  onTranscriptionComplete,
  onError,
  onManualNotesChange,
  onProcessClick,
  processButtonLabel,
  manualNotes = '',
  disabled = false,
  isProcessing = false,
  className,
  recording,
  showProcessButton = true,
  hasProcessed = false,
}) => {
  const [assistantCollapsed, setAssistantCollapsed] = React.useState(true);
  const [uploadKey, setUploadKey] = React.useState(0);

  const phaseLabels = {
    anamnesis: {
      title: 'Anamnese Invoer',
      description: 'Neem de anamnese op of voer handmatige notities in',
      processLabel: 'Verwerk Anamnese',
      audioPrompt: 'Dit is een fysiotherapie anamnese gesprek in het Nederlands. Transcribeer accuraat alle medische termen en patiënt uitspraken.',
    },
    examination: {
      title: 'Gespreksinvoer', 
      description: 'Leg het vervolgconsult vast via opname of handmatige notities',
      processLabel: 'Verwerk Gesprek',
      audioPrompt: 'Dit is een fysiotherapie vervolgconsult in het Nederlands. Transcribeer accuraat alle bevindingen, voortgang en behandelingsplannen.',
    }
  };

  const currentPhase = phaseLabels[phase];
  const defaultProcessLabel = processButtonLabel || currentPhase.processLabel;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input to allow re-uploading the same file
    event.target.value = '';
    setUploadKey(prev => prev + 1);

    if (!file.type.startsWith('audio/')) {
      onError?.('Selecteer een audio bestand');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      onError?.('Audio bestand is te groot (max 25MB)');
      return;
    }

    try {
      // Convert file to blob and call recording complete
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      
      // Estimate duration (this is approximate - real implementation would need to decode audio)
      const estimatedDuration = file.size / 16000; // Very rough estimation
      
      onRecordingComplete?.(blob, estimatedDuration);
    } catch (error) {
      onError?.('Fout bij uploaden van audio bestand');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>

      {/* Live Audio Recorder - Expanded before processing, collapsed after */}
      <CollapsibleSection 
        title="Live Opname"
        defaultOpen={!hasProcessed}
        className="border-2 border-hysio-mint/30"
      >
        <div className="space-y-4">
          <AudioRecorder
            onRecordingComplete={onRecordingComplete}
            onTranscriptionComplete={onTranscriptionComplete}
            onError={onError}
            autoTranscribe={false}
            transcriptionOptions={{
              language: 'nl',
              prompt: currentPhase.audioPrompt,
              temperature: 0.0,
            }}
            disabled={disabled || isProcessing}
            maxDuration={1800000} // 30 minutes for both anamnesis and examination
          />
        </div>
      </CollapsibleSection>

      {/* Manual Input - Expanded before processing, collapsed after */}
      <CollapsibleSection 
        title="Handmatige Notities"
        defaultOpen={!hasProcessed}
        className="border-2 border-hysio-mint/30"
      >
        <div className="space-y-4">
          <textarea
            value={manualNotes}
            onChange={(e) => onManualNotesChange?.(e.target.value)}
            placeholder={`Voer hier handmatige ${phase === 'anamnesis' ? 'anamnese' : 'onderzoeks'} notities in...`}
            disabled={disabled || isProcessing}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y disabled:opacity-50"
          />
          <p className="text-xs text-gray-500">
            Deze notities worden automatisch gecombineerd met audio transcriptie bij verwerking.
          </p>
        </div>
      </CollapsibleSection>

      {/* Hysio Assistant - Available both before and after processing */}
      <CollapsibleSection 
        title="Hysio Assistant"
        defaultOpen={false}
        className="border-2 border-hysio-mint/30"
      >
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-hysio-deep-green" />
            <span className="text-sm font-medium text-hysio-deep-green">
              AI Assistent voor {phase === 'anamnesis' ? 'Anamnese' : 'Onderzoek'}
            </span>
          </div>
          <AssistantIntegration
            isCollapsed={false}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </CollapsibleSection>

      {/* Process Button */}
      {showProcessButton && (recording || manualNotes.trim()) && (
        <div className="sticky bottom-0 bg-white p-4 border-t border-hysio-mint/20 -mx-6">
          <Button
            onClick={onProcessClick}
            disabled={disabled || isProcessing || (!recording && !manualNotes.trim())}
            size="lg"
            className="w-full bg-hysio-mint hover:bg-hysio-mint/90 px-8"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Verwerken...
              </>
            ) : (
              <>
                <FileText size={20} className="mr-2" />
                {defaultProcessLabel}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export { InputPanel };