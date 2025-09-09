import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { InputPanel } from '@/components/ui/input-panel';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { 
  FileText, 
  Lightbulb
} from 'lucide-react';
import { PatientInfo, SOEPStructure, AudioRecording } from '@/lib/types';
import { apiCall, API_ENDPOINTS } from '@/lib/api';
import { transcribeAudio } from '@/lib/api/transcription';

// Simple SOEP parsing function for this workflow
const parseSOEPText = (fullText: string): SOEPStructure => {
  const result: SOEPStructure = {
    subjective: '',
    objective: '',
    evaluation: '',
    plan: '',
    redFlags: [],
    fullStructuredText: fullText,
  };

  // Extract SOEP sections with basic regex patterns
  const sections = [
    { key: 'subjective', pattern: /\*\*S\s*-?\s*Subjectief:?\*\*([\s\S]*?)(?=\*\*[OoEePp]\s*-|$)/i },
    { key: 'objective', pattern: /\*\*O\s*-?\s*Objectief:?\*\*([\s\S]*?)(?=\*\*[EePp]\s*-|$)/i },
    { key: 'evaluation', pattern: /\*\*E\s*-?\s*Evaluatie:?\*\*([\s\S]*?)(?=\*\*[Pp]\s*-|$)/i },
    { key: 'plan', pattern: /\*\*P\s*-?\s*Plan:?\*\*([\s\S]*?)(?=\*\*Rode\s*Vlagen|$)/i },
  ];

  sections.forEach(({ key, pattern }) => {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      result[key as keyof SOEPStructure] = match[1].trim();
    }
  });

  // Extract red flags
  const redFlagMatch = fullText.match(/\*\*Rode\s*Vlagen:?\*\*([\s\S]*?)$/i);
  if (redFlagMatch && redFlagMatch[1]) {
    const flags = redFlagMatch[1].split('\n')
      .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
      .filter(line => line.length > 0);
    result.redFlags = flags;
  }

  return result;
};


export interface StreamlinedFollowupWorkflowProps {
  patientInfo: PatientInfo;
  onComplete: (soepData: SOEPStructure, sessionPreparation?: string) => void;
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
  const [sessionPreparation, setSessionPreparation] = React.useState<string>('');
  const [consultRecording, setConsultRecording] = React.useState<AudioRecording | null>(null);
  const [consultNotes, setConsultNotes] = React.useState<string>('');
  
  // Loading states
  const [isGeneratingPreparation, setIsGeneratingPreparation] = React.useState(false);
  const [isProcessingSOEP, setIsProcessingSOEP] = React.useState(false);

  // Generate session preparation
  const handleGeneratePreparation = async () => {
    setIsGeneratingPreparation(true);
    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult voorbereidingen maakt. Je taak is om praktische guidance te genereren voor een vervolgconsult, NIET om een SOEP-structuur te maken. Focus op wat de therapeut moet weten en doen tijdens het vervolgconsult.`;
      
      const getAgeFromBirthYear = (birthYear: string): number => {
        const currentYear = new Date().getFullYear();
        return currentYear - parseInt(birthYear);
      };

      const age = getAgeFromBirthYear(patientInfo.birthYear);

      const userPrompt = `Patiënt: ${patientInfo.initials}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

Genereer een logische vervolgconsult voorbereiding met de volgende structuur:

**Focus & Evaluatie**
- Wat was het behandelplan van vorige keer?
- Welke doelen werden gesteld en moeten worden geëvalueerd?
- Welke verbeterpunten werden verwacht?

**Subjectieve Vragen**
- Specifieke vragen over de huidige status praesens
- Vragen over vooruitgang sinds vorige sessie
- Vragen over VAS/NPRS veranderingen
- Vragen over functionele verbeteringen
- Vragen over moeilijkheden met huisoefeningen
- Vragen over pijn of klachten

**Objectieve Aandachtspunten**
- Welke metingen of tests herhalen voor vergelijking?
- Welke ROM-metingen opnieuw uitvoeren?
- Welke functionele testen herdoen?
- Welke fysiotherapeutische observaties maken?
- Welke nieuwe onderzoeken overwegen?

Houd het praktisch, specifiek en gericht op deze hoofdklacht. Gebruik Nederlandse fysiotherapie terminologie.`;

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
      } else {
        // Fallback content when API fails
        const fallbackPreparation = `**Focus & Evaluatie**
- Evalueer vooruitgang sinds vorige behandeling
- Controleer of gestelde doelen zijn behaald
- Beoordeel effectiviteit van gegeven behandeling

**Subjectieve Vragen**
- Hoe ervaart patiënt de klachten sinds vorige sessie?
- VAS/NPRS score voor pijn (0-10)?
- Welke activiteiten zijn verbeterd of verslechterd?
- Compliance met huisoefeningen en adviezen?
- Nieuwe klachten of symptomen?

**Objectieve Aandachtspunten**
- ROM metingen vergelijken met vorige sessie
- Functionele testen herhalen
- Palpatie en inspectie van probleemgebied
- Gang- en bewegingspatronen observeren
- Kracht en stabiliteit testen

*Let op: Deze voorbereiding is automatisch gegenereerd toen de AI-service niet beschikbaar was.*`;
        
        setSessionPreparation(fallbackPreparation);
        console.error('API call failed, using fallback preparation:', response.error);
      }
    } catch (error) {
      console.error('Error generating preparation:', error);
      // Fallback content for complete failure
      const errorFallback = `**Vervolgconsult Voorbereiding**

Er is een technisch probleem opgetreden bij het genereren van de voorbereiding.

**Algemene aandachtspunten:**
- Evalueer vooruitgang sinds vorige behandeling
- Vraag naar huidige klachten en pijnscores
- Test ROM, kracht en functionaliteit
- Beoordeel compliance met huisoefeningen
- Stel behandelplan bij indien nodig

*Technische fout: Sessie voorbereiding kon niet automatisch worden gegenereerd.*`;
      
      setSessionPreparation(errorFallback);
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
        
        // Navigate directly to summary page with results
        onComplete(soepStructure, sessionPreparation);
      } else {
        // Create fallback SOEP structure when API fails
        const fallbackSOEP: SOEPStructure = {
          subjective: combinedInput || 'Geen input beschikbaar voor verwerking.',
          objective: 'AI-verwerking niet beschikbaar. Vul handmatig objectieve bevindingen in.',
          evaluation: 'AI-verwerking niet beschikbaar. Vul handmatig evaluatie in.',
          plan: 'AI-verwerking niet beschikbaar. Vul handmatig behandelplan in.',
          redFlags: [],
          fullStructuredText: `**S - Subjectief:**
${combinedInput || 'Geen input beschikbaar voor verwerking.'}

**O - Objectief:**
AI-verwerking niet beschikbaar. Vul handmatig objectieve bevindingen in.

**E - Evaluatie:**
AI-verwerking niet beschikbaar. Vul handmatig evaluatie in.

**P - Plan:**
AI-verwerking niet beschikbaar. Vul handmatig behandelplan in.

*Let op: Deze SOEP-structuur is handmatig aangemaakt omdat de AI-service niet beschikbaar was.*`
        };
        
        console.error('API call failed, using fallback SOEP:', response.error);
        onComplete(fallbackSOEP, sessionPreparation);
      }
    } catch (error) {
      console.error('Error processing SOEP:', error);
      
      // Create error fallback SOEP structure
      const errorSOEP: SOEPStructure = {
        subjective: combinedInput || 'Technische fout bij verwerking van input.',
        objective: 'Technische fout: Kan objectieve gegevens niet automatisch verwerken.',
        evaluation: 'Technische fout: Kan evaluatie niet automatisch genereren.',
        plan: 'Technische fout: Kan behandelplan niet automatisch genereren.',
        redFlags: [],
        fullStructuredText: `**TECHNISCHE FOUT - HANDMATIGE INVOER VEREIST**

**S - Subjectief:**
${combinedInput || 'Technische fout bij verwerking van input.'}

**O - Objectief:**
Technische fout: Kan objectieve gegevens niet automatisch verwerken.

**E - Evaluatie:**
Technische fout: Kan evaluatie niet automatisch genereren.

**P - Plan:**
Technische fout: Kan behandelplan niet automatisch genereren.

*BELANGRIJK: Er is een technische fout opgetreden. Vul alle SOEP-secties handmatig in voordat u het rapport afrondt.*`
      };
      
      onComplete(errorSOEP, sessionPreparation);
    } finally {
      setIsProcessingSOEP(false);
    }
  };


  return (
    <div className={cn('w-full min-h-screen bg-hysio-cream/30', className)}>
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

      {/* Two-Panel Layout */}
      <div className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Guidance (Sessie Voorbereiding) */}
        <div className="space-y-6">
          <div className="bg-hysio-mint/10 border-2 border-hysio-mint/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-hysio-deep-green" />
              <h2 className="text-xl font-semibold text-hysio-deep-green">Sessie Voorbereiding</h2>
            </div>
            
            {sessionPreparation ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <CopyToClipboard text={sessionPreparation} size="sm" />
                </div>
                <div className="bg-white p-4 rounded-lg border border-hysio-mint/20 shadow-sm">
                  <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800 max-h-96 overflow-y-auto">
                    {sessionPreparation}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button
                  onClick={handleGeneratePreparation}
                  disabled={isGeneratingPreparation}
                  size="lg"
                  className="bg-hysio-mint hover:bg-hysio-mint/90 text-white"
                >
                  {isGeneratingPreparation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Voorbereiden...
                    </>
                  ) : (
                    <>
                      <Lightbulb size={18} className="mr-2" />
                      Genereer Sessie Voorbereiding
                    </>
                  )}
                </Button>
                <p className="text-sm text-hysio-deep-green-900/70 mt-3">
                  Klik om een gepersonaliseerde voorbereiding te genereren voor dit vervolgconsult
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - User Input */}
        <div className="space-y-6">
          {/* Enhanced Input Panel with better styling */}
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
            hasProcessed={false}
          />
        </div>
      </div>
      
    </div>
  );
};

export { StreamlinedFollowupWorkflow };