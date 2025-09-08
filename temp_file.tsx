import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { TwoPanelLayout } from '@/components/ui/two-panel-layout';
import { InputPanel } from '@/components/ui/input-panel';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { 
  FileText, 
  Lightbulb,
  Copy,
  ChevronRight,
  CheckCircle,
  Stethoscope
} from 'lucide-react';
import { PatientInfo, SOEPStructure, AudioRecording } from '@/lib/types';
import { apiCall, API_ENDPOINTS } from '@/lib/api';
import { transcribeAudio } from '@/lib/api/transcription';

// SOEP parsing function - extracts individual sections from structured text
const parseSOEPText = (fullText: string): SOEPStructure => {
  const result: SOEPStructure = {
    subjective: '',
    objective: '',
    evaluation: '',
    plan: '',
    redFlags: [],
    fullStructuredText: fullText,
  };

  // Extract SOEP sections
  const sections = [
    { key: 'subjective', patterns: [/\*\*S\s*-?\s*Subjectief:?\*\*([\s\S]*?)(?=\*\*[OoEePp]\s*-|$)/i] },
    { key: 'objective', patterns: [/\*\*O\s*-?\s*Objectief:?\*\*([\s\S]*?)(?=\*\*[EePp]\s*-|$)/i] },
    { key: 'evaluation', patterns: [/\*\*E\s*-?\s*Evaluatie:?\*\*([\s\S]*?)(?=\*\*[Pp]\s*-|$)/i] },
    { key: 'plan', patterns: [/\*\*P\s*-?\s*Plan:?\*\*([\s\S]*?)(?=\*\*Rode\s*Vlagen|$)/i] },
  ];

  sections.forEach(({ key, patterns }) => {
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        result[key as keyof SOEPStructure] = match[1].trim();
        break;
      }
    }
  });

  // Extract red flags
  const redFlagPatterns = [
    /\*\*Rode\s*Vlagen:?\*\*([\s\S]*?)$/i,
    /\[RODE\s*VLAG:?([^\]]+)\]/gi
  ];
  
  for (const pattern of redFlagPatterns) {
    if (pattern.global) {
      const matches = fullText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const flags = match[1].split('\n')
            .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
            .filter(line => line.length > 0);
          result.redFlags.push(...flags);
        }
      }
    } else {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        const flags = match[1].split('\n')
          .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
          .filter(line => line.length > 0);
        result.redFlags.push(...flags);
      }
    }
  }

  // Remove duplicates from red flags
  result.redFlags = [...new Set(result.redFlags)];

  return result;
};

// SOEP Results Panel component - similar to PHSBResultsPanel
interface SOEPResultsPanelProps {
  soepData: SOEPStructure;
  onDataChange?: (updatedData: SOEPStructure) => void;
  enableEditing?: boolean;
  showSources?: boolean;
  audioSource?: boolean;
  manualSource?: boolean;
  className?: string;
}

const SOEPResultsPanel: React.FC<SOEPResultsPanelProps> = ({
  soepData,
  onDataChange,
  enableEditing = true,
  showSources = false,
  audioSource = false,
  manualSource = false,
  className,
}) => {
  const [localData, setLocalData] = React.useState<SOEPStructure>(soepData);
  const [showFullView, setShowFullView] = React.useState(false);

  React.useEffect(() => {
    if (soepData.fullStructuredText && 
        !soepData.subjective && 
        !soepData.objective && 
        !soepData.evaluation && 
        !soepData.plan) {
      const parsedData = parseSOEPText(soepData.fullStructuredText);
      setLocalData(parsedData);
    } else {
      setLocalData(soepData);
    }
  }, [soepData]);

  const updateSectionContent = (sectionId: keyof SOEPStructure, newContent: string) => {
    const updatedData = {
      ...localData,
      [sectionId]: newContent
    };
    
    if (sectionId !== 'fullStructuredText' && sectionId !== 'redFlags') {
      updatedData.fullStructuredText = buildFullSOEPText(updatedData);
    }
    
    setLocalData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const buildFullSOEPText = (data: SOEPStructure): string => {
    const sections = [];
    
    if (data.subjective) {
      sections.push(`**S - Subjectief:**\n${data.subjective}`);
    }
    
    if (data.objective) {
      sections.push(`**O - Objectief:**\n${data.objective}`);
    }
    
    if (data.evaluation) {
      sections.push(`**E - Evaluatie:**\n${data.evaluation}`);
    }
    
    if (data.plan) {
      sections.push(`**P - Plan:**\n${data.plan}`);
    }
    
    if (data.redFlags && data.redFlags.length > 0) {
      const redFlagsText = data.redFlags.map(flag => `[RODE VLAG: ${flag}]`).join('\n');
      sections.push(`**Rode Vlagen:**\n${redFlagsText}`);
    }
    
    return sections.join('\n\n');
  };

  const copyFullSOEP = async () => {
    try {
      await navigator.clipboard.writeText(localData.fullStructuredText);
      console.log('Volledige SOEP gekopieerd naar clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copySectionContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('SOEP sectie gekopieerd naar clipboard');
    } catch (err) {
      console.error('Failed to copy section to clipboard:', err);
    }
  };

  const EditableText: React.FC<{
    content: string;
    sectionId: keyof SOEPStructure;
    placeholder?: string;
    multiline?: boolean;
  }> = ({ content, sectionId, placeholder, multiline = true }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempValue, setTempValue] = React.useState(content);

    React.useEffect(() => {
      setTempValue(content);
    }, [content]);

    const handleSave = () => {
      updateSectionContent(sectionId, tempValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(content);
      setIsEditing(false);
    };

    if (!enableEditing) {
      return (
        <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
          {content || placeholder}
        </pre>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-hysio-mint/40 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y font-inter text-sm"
              rows={Math.max(3, tempValue.split('\n').length + 1)}
              placeholder={placeholder}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-hysio-mint/40 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint font-inter text-sm"
              placeholder={placeholder}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-hysio-mint hover:bg-hysio-mint/90 text-white"
            >
              Opslaan
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
            >
              Annuleren
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-text hover:bg-hysio-mint/5 p-2 rounded-md transition-colors group"
      >
        <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
          {content || (
            <span className="text-gray-400 italic">
              {placeholder || 'Klik om te bewerken...'}
            </span>
          )}
        </pre>
        <div className="opacity-0 group-hover:opacity-100 text-xs text-hysio-mint mt-1 transition-opacity">
          Klik om te bewerken
        </div>
      </div>
    );
  };

  const soepSections = [
    { key: 'subjective', title: 'Subjectief', shortTitle: 'S', description: 'Wat zegt de patiënt', icon: FileText },
    { key: 'objective', title: 'Objectief', shortTitle: 'O', description: 'Wat zie/meet je', icon: Stethoscope },
    { key: 'evaluation', title: 'Evaluatie', shortTitle: 'E', description: 'Wat betekent dit', icon: CheckCircle },
    { key: 'plan', title: 'Plan', shortTitle: 'P', description: 'Wat ga je doen', icon: ChevronRight },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* SOEP Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-hysio-deep-green flex items-center gap-3">
              <div className="w-12 h-12 bg-hysio-mint/20 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-hysio-deep-green" />
              </div>
              SOEP Documentatie
            </h2>
            <p className="text-hysio-deep-green-900/70 mt-2">
              Gestructureerde vervolgconsult documentatie volgens SOEP-methode
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowFullView(!showFullView)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText size={16} />
              {showFullView ? 'Sectie weergave' : 'Volledige weergave'}
            </Button>
            
            <Button
              onClick={copyFullSOEP}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Copy size={16} />
              Kopiëer Volledig
            </Button>
          </div>
        </div>

        {/* Show sources used */}
        {showSources && (
          <div className="flex flex-wrap gap-2 mb-4">
            {audioSource && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                <FileText size={14} className="mr-2" />
                Audio transcriptie gebruikt
              </span>
            )}
            {manualSource && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                <FileText size={14} className="mr-2" />
                Handmatige notities gebruikt
              </span>
            )}
          </div>
        )}
      </div>

      {/* SOEP Content */}
      {showFullView ? (
        // Full structured text view
        <div className="bg-hysio-cream/30 p-6 rounded-lg border-2 border-hysio-mint/20">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-hysio-deep-green">
              Volledige SOEP Structuur
            </h3>
            <Button
              onClick={copyFullSOEP}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Copy size={14} />
              Kopiëren
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <EditableText
              content={localData.fullStructuredText}
              sectionId="fullStructuredText"
              placeholder="Volledige SOEP structuur..."
            />
          </div>
        </div>
      ) : (
        // Individual sections
        <div className="space-y-4">
          {soepSections.map((section) => {
            const sectionContent = localData[section.key as keyof SOEPStructure] as string || '';
            
            return (
              <div key={section.key} className="bg-white border-2 border-hysio-mint/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-hysio-mint/20 flex items-center justify-center">
                      <section.icon size={20} className="text-hysio-deep-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-hysio-deep-green">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => copySectionContent(sectionContent)}
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    disabled={!sectionContent.trim()}
                    title={`Kopiëer ${section.title}`}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <EditableText
                    content={sectionContent}
                    sectionId={section.key as keyof SOEPStructure}
                    placeholder={`Voer ${section.title.toLowerCase()} in...`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

type ConsultState = 'initial' | 'soep-processed';

export interface StreamlinedFollowupWorkflowProps {
  patientInfo: PatientInfo;
  onComplete: (soepData: SOEPStructure) => void;
  onBack: () => void;
  className?: string;
  disabled?: boolean;
}

const StreamlinedFollowupWorkflow: React.FC<StreamlinedFollowupWorkflowProps> = ({
  patientInfo,
  onComplete,
  onBack,
  className,
  disabled = false,
}) => {
  // State management
  const [consultState, setConsultState] = React.useState<ConsultState>('initial');
  const [sessionPreparation, setSessionPreparation] = React.useState<string>('');
  const [consultRecording, setConsultRecording] = React.useState<AudioRecording | null>(null);
  const [consultNotes, setConsultNotes] = React.useState<string>('');
  const [soepResults, setSOEPResults] = React.useState<SOEPStructure | null>(null);
  
  // Loading states
  const [isGeneratingPreparation, setIsGeneratingPreparation] = React.useState(false);
  const [isProcessingSOEP, setIsProcessingSOEP] = React.useState(false);

  // Generate session preparation
  const handleGeneratePreparation = async () => {
    setIsGeneratingPreparation(true);
    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult voorbereidingen maakt volgens het Hysio Medical Scribe protocol.`;
      
      const getAgeFromBirthYear = (birthYear: string): number => {
        const currentYear = new Date().getFullYear();
        return currentYear - parseInt(birthYear);
      };

      const age = getAgeFromBirthYear(patientInfo.birthYear);

      const userPrompt = `Patiënt: ${patientInfo.initials}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

Maak een voorbereiding voor dit vervolgconsult. Focus op voortgangsevaluatie en SOEP-documentatie volgens Nederlandse fysiotherapie standaarden.`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.3,
          },
        }),
      });
      
      if (response.success && response.data?.content) {
        setSessionPreparation(response.data.content);
      }
    } catch (error) {
      console.error('Error generating preparation:', error);
    } finally {
      setIsGeneratingPreparation(false);
    }
  };

  // Handle recording
  const handleConsultRecording = (blob: Blob, duration: number) => {
    const recording: AudioRecording = {
      id: `consult-${Date.now()}`,
      blob,
      duration,
      timestamp: new Date().toISOString(),
      phase: 'followup',
    };
    setConsultRecording(recording);
  };

  // Process SOEP
  const handleProcessSOEP = async () => {
    setIsProcessingSOEP(true);
    try {
      let transcriptionText = '';
      
      // Transcribe audio if available
      if (consultRecording) {
        const transcriptionResult = await transcribeAudio(
          consultRecording.blob,
          'nl',
          'Vervolgconsult fysiotherapie volgens SOEP methode. Inclusief klachten, behandeling, oefeningen en vervolgplan.'
        );
        if (transcriptionResult.success && transcriptionResult.transcript) {
          transcriptionText = transcriptionResult.transcript;
        }
      }
      
      // Combine transcription and manual notes
      const combinedInput = [transcriptionText, consultNotes].filter(Boolean).join('\n\n');
      
      // Generate SOEP structure
      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult transcripties structureert volgens de SOEP methode.`;
      
      const getAgeFromBirthYear = (birthYear: string): number => {
        const currentYear = new Date().getFullYear();
        return currentYear - parseInt(birthYear);
      };

      const age = getAgeFromBirthYear(patientInfo.birthYear);

      const userPrompt = `Analyseer de volgende vervolgconsult input en genereer een gestructureerde SOEP documentatie.

Patiënt context:
- Leeftijd: ${age} jaar
- Geslacht: ${patientInfo.gender}
- Hoofdklacht: ${patientInfo.chiefComplaint}

Consult input:
${combinedInput}

Genereer een professionele SOEP structuur:

**S - Subjectief:**
[Wat zegt de patiënt over klachten, ervaring, gevoel]

**O - Objectief:**
[Wat zie/meet je - observaties, testen, metingen]

**E - Evaluatie:**
[Wat betekent dit - analyse, interpretatie, conclusie]

**P - Plan:**
[Wat ga je doen - behandeling, huisoefeningen, vervolgafspraak]

Antwoord in het Nederlands, professioneel gestructureerd.`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.2,
          },
        }),
      });
      
      if (response.success && response.data?.content) {
        const soepStructure: SOEPStructure = parseSOEPText(response.data.content);
        
        setSOEPResults(soepStructure);
        setConsultState('soep-processed');
      }
    } catch (error) {
      console.error('Error processing SOEP:', error);
    } finally {
      setIsProcessingSOEP(false);
    }
  };

  const handleStartRecording = () => {
    setRecordingTime(0);
    setError(null);
    recorderControls.startRecording();
  };

  const handleStopRecording = () => {
    recorderControls.stopRecording();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      recorderControls.resumeRecording();
    } else {
      recorderControls.pauseRecording();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Selecteer een geldig audiobestand.');
      return;
    }

    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Reset file input
    event.target.value = '';
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const processSOEP = async () => {
    if (!audioBlob && !manualNotes.trim()) {
      setError('Maak een audio-opname of voer handmatige notities in voordat je verwerkt.');
      return;
    }

    setIsProcessingSOEP(true);
    setError(null);

    try {
      let transcriptionText = '';

      // Transcribe audio if available
      if (audioBlob) {
        const transcribeResult = await transcribeAudio(audioBlob, {
          language: 'nl',
          prompt: 'Vervolgconsult fysiotherapie volgens SOEP methode. Inclusief klachten, behandeling, oefeningen en vervolgplan.',
          temperature: 0.0
        });

        if (transcribeResult.success && transcribeResult.transcript) {
          transcriptionText = transcribeResult.transcript;
        } else {
          throw new Error(transcribeResult.error || 'Transcriptie mislukt');
        }
      }

      // Combine transcription and manual notes
      const combinedInput = [transcriptionText, manualNotes].filter(Boolean).join('\n\n');

      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult transcripties structureert volgens de SOEP methode:

S - Subjectief: wat zegt de patiënt (klachten, ervaring, gevoel)
O - Objectief: wat zie/meet je (observaties, testen, metingen)
E - Evaluatie: wat betekent dit (analyse, interpretatie, conclusie)
P - Plan: wat ga je doen (behandeling, huisoefeningen, vervolgafspraak)

Analyseer de transcriptie en/of notities en structureer volgens SOEP. 
Identificeer eventuele rode vlagen en behandelvoortgang.
Gebruik Nederlandse fysiotherapie terminologie.`;

      const getAgeFromBirthYear = (birthYear: string): number => {
        const currentYear = new Date().getFullYear();
        return currentYear - parseInt(birthYear);
      };

      const age = getAgeFromBirthYear(patientInfo.birthYear);

      const userPrompt = `Vervolgconsult informatie:
${combinedInput}

Patiënt: ${patientInfo.initials}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.6,
            max_tokens: 2000,
          },
        }),
      });

      if (response.success && response.data?.content) {
        const soepStructure: SOEPStructure = {
          subjective: extractSOEPSection(response.data.content, 'Subjectief') || '',
          objective: extractSOEPSection(response.data.content, 'Objectief') || '',
          evaluation: extractSOEPSection(response.data.content, 'Evaluatie') || '',
          plan: extractSOEPSection(response.data.content, 'Plan') || '',
          redFlags: extractRedFlags(response.data.content),
          fullStructuredText: response.data.content,
        };

        setSOEPResult(soepStructure);
      } else {
        setError(response.error || 'Fout bij verwerken van SOEP documentatie');
      }
    } catch (error) {
      console.error('SOEP processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onverwachte fout bij verwerken van SOEP documentatie';
      setError(`Fout bij SOEP verwerking: ${errorMessage}`);
    } finally {
      setIsProcessingSOEP(false);
    }
  };

  const extractSOEPSection = (content: string, sectionName: string): string => {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?${sectionName}[^\\n]*:?\\*?\\*?\\s*\\n([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][^\\n]*:?\\*?\\*?|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractRedFlags = (content: string): string[] => {
    const redFlagSection = extractSOEPSection(content, 'rode vlagen');
    if (!redFlagSection) return [];
    
    return redFlagSection
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  // Navigate to SOEP result page
  const viewSOEPResult = () => {
    if (soepResult) {
      onComplete(soepResult);
    }
  };

  const handleExportSOEP = async () => {
    if (!soepResult) return;
    
    try {
      const { SOEPExporter } = await import('@/lib/utils/soep-export');
      
      await SOEPExporter.exportAndDownload({
        patientInfo,
        soepData: soepResult,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, 'html');
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed. Please try again.');
    }
  };

  return (
    <div className={cn('w-full min-h-screen', className)}>
      {/* Global Header */}
      <div className="bg-white border-b border-hysio-mint/20 p-6 mb-6">
        <div className="w-full px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-hysio-deep-green">
                Vervolgconsult Workflow
              </h1>
              <p className="text-sm text-hysio-deep-green-900/70">
                {patientInfo.initials} ({patientInfo.birthYear}) - {patientInfo.chiefComplaint}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={disabled}
            >
              Terug naar patiënt info
            </Button>
          </div>
        </div>
      </div>

      {/* Two Panel Layout */}
      <TwoPanelLayout
        leftPanel={
          <div className="h-full overflow-auto p-6 space-y-6">
            {/* SOEP Documentatie - Initially collapsed, expanded after processing */}
            <CollapsibleSection 
              title="SOEP Documentatie"
              defaultOpen={soepResults !== null}
              className="border-2 border-hysio-mint/30"
            >
              {soepResults ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-hysio-mint/20">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={18} className="text-hysio-deep-green" />
                        <h4 className="font-semibold text-hysio-deep-green">SOEP Rapport</h4>
                      </div>
                      <CopyToClipboard text={soepResults.fullStructuredText} size="sm" />
                    </div>
                    <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
                      {soepResults.fullStructuredText}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>SOEP documentatie wordt hier getoond na verwerking</p>
                </div>
              )}
            </CollapsibleSection>
            
            {/* Sessie Voorbereiding - Initially expanded, collapsed after processing */}
            <CollapsibleSection 
              title="Sessie Voorbereiding"
              defaultOpen={soepResults === null}
              className="border-2 border-amber-200 bg-amber-50/30"
            >
              {sessionPreparation ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-amber-700" />
                        <h4 className="font-semibold text-amber-700">Consult Voorbereiding</h4>
                      </div>
                      <CopyToClipboard text={sessionPreparation} size="sm" />
                    </div>
                    <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
                      {sessionPreparation}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button
                    onClick={handleGeneratePreparation}
                    disabled={isGeneratingPreparation}
                    className="bg-hysio-mint hover:bg-hysio-mint/90"
                  >
                    {isGeneratingPreparation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Voorbereiden...
                      </>
                    ) : (
                      <>
                        <Lightbulb size={16} className="mr-2" />
                        Genereer Sessie Voorbereiding
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CollapsibleSection>
          </div>
        }
        rightPanel={
          <InputPanel
            phase="examination"
            onRecordingComplete={handleConsultRecording}
            onManualNotesChange={setConsultNotes}
            onProcessClick={handleProcessSOEP}
            processButtonLabel="Verwerk in SOEP"
            manualNotes={consultNotes}
            disabled={disabled}
            isProcessing={isProcessingSOEP}
            recording={consultRecording}
            showProcessButton={true}
            hasProcessed={soepResults !== null}
          />
        }
      />
      
      {/* Full-width navigation bar after SOEP processing */}
      {soepResults && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-hysio-mint/20 p-6 shadow-lg z-50">
          <div className="w-full px-6">
            <Button
              onClick={() => soepResults && onComplete(soepResults)}
              disabled={disabled}
              size="lg"
              className="w-full bg-hysio-deep-green hover:bg-hysio-deep-green/90 text-white py-4 text-xl font-semibold"
            >
              <CheckCircle size={24} className="mr-3" />
              Genereer Samenvatting
              <ChevronRight size={24} className="ml-3" />
            </Button>
            <p className="text-center text-sm text-hysio-deep-green-900/60 mt-2">
              SOEP voltooid - Ga door naar de samenvattingsfase
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
};

export { StreamlinedFollowupWorkflow };
