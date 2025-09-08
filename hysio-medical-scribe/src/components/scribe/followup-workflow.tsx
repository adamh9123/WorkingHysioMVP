import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Mic, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ChevronRight,
  RotateCcw,
  Edit3,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react';
import { FollowupData, PatientInfo, AudioTranscription, SOEPStructure } from '@/lib/types';
import { apiCall, API_ENDPOINTS } from '@/lib/api';

export type FollowupStep = 
  | 'session-planning' 
  | 'soep-documentation' 
  | 'progress-evaluation' 
  | 'plan-adjustment';

export interface FollowupWorkflowProps {
  patientInfo: PatientInfo;
  onComplete: (followupData: FollowupData) => void;
  onBack: () => void;
  initialData?: Partial<FollowupData>;
  disabled?: boolean;
  className?: string;
}

interface StepConfig {
  id: FollowupStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  estimatedTime: string;
}

const followupSteps: StepConfig[] = [
  {
    id: 'session-planning',
    title: 'Sessie Voorbereiding',
    description: 'Bekijk patiënthistorie en bereid vervolgconsult voor',
    icon: FileText,
    estimatedTime: '3-5 min',
  },
  {
    id: 'soep-documentation',
    title: 'SOEP Documentatie',
    description: 'Gestructureerde opname volgens SOEP methode',
    icon: Mic,
    estimatedTime: '10-15 min',
  },
  {
    id: 'progress-evaluation',
    title: 'Voortgang Evaluatie',
    description: 'Beoordeling van behandelresultaten en doelbereik',
    icon: TrendingUp,
    estimatedTime: '5 min',
  },
  {
    id: 'plan-adjustment',
    title: 'Plan Aanpassing',
    description: 'Update behandelplan en vervolgafspraken',
    icon: Target,
    estimatedTime: '5 min',
  },
];

const FollowupWorkflow: React.FC<FollowupWorkflowProps> = ({
  patientInfo,
  onComplete,
  onBack,
  initialData = {},
  disabled = false,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState<FollowupStep>('session-planning');
  const [completedSteps, setCompletedSteps] = React.useState<Set<FollowupStep>>(new Set());
  const [followupData, setFollowupData] = React.useState<FollowupData>({
    patientInfo,
    sessionPreparation: initialData.sessionPreparation || '',
    soepRecording: initialData.soepRecording || null,
    soepTranscript: initialData.soepTranscript || '',
    soepStructure: initialData.soepStructure || null,
    progressEvaluation: initialData.progressEvaluation || '',
    treatmentAdjustments: initialData.treatmentAdjustments || '',
    nextSessionPlan: initialData.nextSessionPlan || '',
    homeExercises: initialData.homeExercises || '',
    patientEducation: initialData.patientEducation || '',
    redFlags: initialData.redFlags || [],
    notes: initialData.notes || '',
    createdAt: initialData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manualNotes, setManualNotes] = React.useState({
    subjective: '',
    objective: '',
    evaluation: '',
    plan: '',
  });

  const currentStepIndex = followupSteps.findIndex(step => step.id === currentStep);
  const currentStepConfig = followupSteps[currentStepIndex];

  const generateSessionPreparation = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult voorbereidingen maakt volgens het Hysio Medical Scribe protocol.

Gebruik exact dit template format voor een normale zitting voorbereiding:

📂 Voorbereiding Zitting – [Naam patiënt], [Leeftijd] jaar
Hoofdklacht: [korte beschrijving klacht]

1️⃣ Focus & Evaluatie:
• Status van de patiënt in relatie tot de behandeldoelen.
• Reactie op de vorige interventie.

2️⃣ Subjectieve Anamnese (S):
• Algemeen: Hoe is het gegaan? Veranderingen?
• Pijn: NPRS huidig/gemiddeld. Provocatie/reductie.
• Functie: Status van PSK-activiteiten (ADL/werk/sport).
• Oefeningen: Therapietrouw, ervaring, effect.
• CEGS: Mentaal welzijn, zorgen, nieuwe inzichten.

3️⃣ Rode Vlaggen Her-screening:
• Nieuwe symptomen (koorts, gewichtsverlies)?
• Nieuw trauma?
• Veranderde neurologische tekenen?

4️⃣ Objectief Onderzoek (O):
• Klinimetrie: Herhaal NPRS, PSK, etc.
• Onderzoek: Her-test ROM, kracht, specifieke tests.
• Functioneel: Observeer de uitvoering van de beperkende activiteit.

Focus: "Is de patiënt op koers richting de gestelde behandeldoelen?"

Vul dit template in met suggestieve vragen en meetbare evaluatiepunten.`;

      const getAge = (dateOfBirth: string): number => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1;
        }
        
        return age;
      };

      const age = getAge(patientInfo.dateOfBirth);

      const userPrompt = `Patiënt: ${patientInfo.firstName}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

Maak een voorbereiding voor dit vervolgconsult volgens het template. Focus op voortgangsevaluatie en meetbare doelen.`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 1200,
          },
        }),
      });

      if (response.success && response.data?.content) {
        setFollowupData(prev => ({
          ...prev,
          sessionPreparation: response.data.content,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'session-planning']));
      } else {
        setError(response.error || 'Fout bij genereren van sessie voorbereiding');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van sessie voorbereiding');
      console.error('Session preparation generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const processSOEPRecording = async (transcription: AudioTranscription) => {
    setIsGenerating(true);
    setError(null);

    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult transcripties structureert volgens de SOEP methode:

S - Subjectief: wat zegt de patiënt (klachten, ervaring, gevoel)
O - Objectief: wat zie/meet je (observaties, testen, metingen)
E - Evaluatie: wat betekent dit (analyse, interpretatie, conclusie)
P - Plan: wat ga je doen (behandeling, huisoefeningen, vervolgafspraak)

Analyseer de transcriptie en structureer volgens SOEP. 
Identificeer eventuele rode vlagen en behandelvoortgang.
Gebruik Nederlandse fysiotherapie terminologie.`;

      const getAge = (dateOfBirth: string): number => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1;
        }
        
        return age;
      };

      const age = getAge(patientInfo.dateOfBirth);

      const userPrompt = `Vervolgconsult transcriptie:
${transcription.text}

Patiënt: ${patientInfo.firstName}, ${age} jaar, ${patientInfo.gender}
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

        setFollowupData(prev => ({
          ...prev,
          soepTranscript: transcription.text,
          soepStructure,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'soep-documentation']));
      } else {
        setError(response.error || 'Fout bij verwerken van SOEP documentatie');
      }
    } catch (error) {
      setError('Onverwachte fout bij verwerken van SOEP documentatie');
      console.error('SOEP processing error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProgressEvaluation = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die voortgangsanalyses maakt.

Analyseer de SOEP documentatie en maak een evaluatie van:
1. Behaalde doelen sinds vorige sessie
2. Resterende beperkingen/klachten
3. Behandelrespons en effectiviteit
4. Patiënt tevredenheid en motivatie
5. Functionele verbeteringen
6. Aanbevelingen voor vervolg

Gebruik Nederlandse fysiotherapie richtlijnen en ICF classificatie.`;

      const soepText = followupData.soepStructure?.fullStructuredText || followupData.soepTranscript;
      const getAge = (dateOfBirth: string): number => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1;
        }
        
        return age;
      };

      const age = getAge(patientInfo.dateOfBirth);

      const userPrompt = `SOEP documentatie:
${soepText}

Patiënt: ${patientInfo.firstName}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

Evalueer de voortgang en behandelrespons.`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 1500,
          },
        }),
      });

      if (response.success && response.data?.content) {
        setFollowupData(prev => ({
          ...prev,
          progressEvaluation: response.data.content,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'progress-evaluation']));
      } else {
        setError(response.error || 'Fout bij genereren van voortgangsanalyse');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van voortgangsanalyse');
      console.error('Progress evaluation generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlanAdjustment = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const systemPrompt = `Je bent een ervaren fysiotherapeut die behandelplannen aanpast.

Op basis van de voortgangsevaluatie en SOEP documentatie, genereer:
1. Aangepaste behandeldoelen
2. Nieuwe/gewijzigde interventies
3. Huisoefeningen programma
4. Patiënt educatie punten
5. Vervolgafspraken planning
6. Prognose update

Gebruik evidence-based behandelstrategieën en Nederlandse richtlijnen.`;

      const allInfo = `
SOEP documentatie:
${followupData.soepStructure?.fullStructuredText || followupData.soepTranscript}

Voortgangsanalyse:
${followupData.progressEvaluation}

Patiënt: ${patientInfo.firstName}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt: allInfo,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 1800,
          },
        }),
      });

      if (response.success && response.data?.content) {
        const content = response.data.content;
        
        setFollowupData(prev => ({
          ...prev,
          treatmentAdjustments: content,
          nextSessionPlan: extractSection(content, 'vervolgafspraken') || '',
          homeExercises: extractSection(content, 'huisoefeningen') || '',
          patientEducation: extractSection(content, 'educatie') || '',
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'plan-adjustment']));
      } else {
        setError(response.error || 'Fout bij genereren van plan aanpassing');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van plan aanpassing');
      console.error('Plan adjustment generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const extractSOEPSection = (content: string, sectionName: string): string => {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?${sectionName}[^\\n]*:?\\*?\\*?\\s*\\n([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][^\\n]*:?\\*?\\*?|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractSection = (content: string, sectionName: string): string => {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?.*${sectionName}[^\\n]*:?\\*?\\*?\\s*\\n([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][^\\n]*:?\\*?\\*?|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractRedFlags = (content: string): string[] => {
    const redFlagSection = extractSection(content, 'rode vlagen');
    if (!redFlagSection) return [];
    
    return redFlagSection
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const handleManualSOEPSubmit = () => {
    if (!manualNotes.subjective.trim() && !manualNotes.objective.trim() && 
        !manualNotes.evaluation.trim() && !manualNotes.plan.trim()) {
      setError('Vul tenminste één SOEP sectie in');
      return;
    }

    const soepStructure: SOEPStructure = {
      subjective: manualNotes.subjective,
      objective: manualNotes.objective,
      evaluation: manualNotes.evaluation,
      plan: manualNotes.plan,
      redFlags: [],
      fullStructuredText: `**Subjectief:**
${manualNotes.subjective}

**Objectief:**
${manualNotes.objective}

**Evaluatie:**
${manualNotes.evaluation}

**Plan:**
${manualNotes.plan}`,
    };

    setFollowupData(prev => ({
      ...prev,
      soepStructure,
      soepTranscript: 'Handmatig ingevoerd',
      updatedAt: new Date().toISOString(),
    }));
    setCompletedSteps(prev => new Set([...prev, 'soep-documentation']));
    setError(null);
  };

  const goToNextStep = () => {
    if (currentStepIndex < followupSteps.length - 1) {
      setCurrentStep(followupSteps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(followupSteps[currentStepIndex - 1].id);
    }
  };

  const goToStep = (step: FollowupStep) => {
    setCurrentStep(step);
  };

  const isStepCompleted = (stepId: FollowupStep): boolean => {
    return completedSteps.has(stepId);
  };

  const canProceedToNext = (): boolean => {
    return isStepCompleted(currentStep) && currentStepIndex < followupSteps.length - 1;
  };

  const canComplete = (): boolean => {
    return completedSteps.size === followupSteps.length;
  };

  const handleComplete = () => {
    if (canComplete()) {
      onComplete(followupData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'session-planning':
        return (
          <div className="space-y-6">
            {!followupData.sessionPreparation ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer sessie voorbereiding
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  Automatische voorbereiding voor vervolgconsult
                </p>
                <Button
                  onClick={generateSessionPreparation}
                  disabled={isGenerating || disabled}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <FileText size={20} className="mr-2" />
                      Genereer Voorbereiding
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <CollapsibleSection title="Sessie Voorbereiding" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Vervolgconsult voorbereiding</h4>
                    <CopyToClipboard text={followupData.sessionPreparation} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{followupData.sessionPreparation}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSessionPreparation}
                    disabled={isGenerating}
                    className="mt-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Opnieuw genereren
                  </Button>
                </div>
              </CollapsibleSection>
            )}
          </div>
        );

      case 'soep-documentation':
        return (
          <div className="space-y-6">
            <CollapsibleSection title="SOEP Documentatie" defaultOpen>
              <div className="space-y-4">
                <p className="text-hysio-deep-green-900/80">
                  Documenteer het vervolgconsult volgens de SOEP methode. Kies tussen audio opname of handmatige invoer.
                </p>
                
                {/* Audio Recording Option */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-hysio-deep-green mb-3 flex items-center gap-2">
                    <Mic size={18} />
                    Audio Opname
                  </h4>
                  <AudioRecorder
                    onRecordingComplete={(recording) => {
                      setFollowupData(prev => ({
                        ...prev,
                        soepRecording: recording,
                        updatedAt: new Date().toISOString(),
                      }));
                    }}
                    onTranscriptionComplete={async (transcription) => {
                      // Automatically process SOEP recording when transcription is complete
                      await processSOEPRecording(transcription);
                    }}
                    autoTranscribe={true}
                    transcriptionOptions={{
                      language: 'nl',
                      prompt: 'Vervolgconsult fysiotherapie volgens SOEP methode. Inclusief klachten, behandeling, oefeningen en vervolgplan.',
                      temperature: 0.0
                    }}
                    disabled={disabled || isGenerating}
                    maxDuration={1800000} // 30 minutes
                  />
                  
                  {/* Process Audio Button - Only show for uploaded files or failed auto-transcription */}
                  {followupData.soepRecording && !followupData.soepStructure && !isGenerating && (
                    <div className="mt-4 p-4 bg-hysio-mint/10 rounded-lg border border-hysio-mint/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-hysio-deep-green mb-1">
                            Audio bestand gereed
                          </h5>
                          <p className="text-sm text-hysio-deep-green-900/70">
                            Handmatig verwerken van audio naar gestructureerde SOEP documentatie
                          </p>
                        </div>
                        <Button
                          onClick={async () => {
                            // First transcribe the audio using the transcription API
                            setIsGenerating(true);
                            setError(null);
                            
                            try {
                              const formData = new FormData();
                              formData.append('audio', followupData.soepRecording!, 'recording.wav');
                              
                              const transcribeResponse = await fetch('/api/transcribe', {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!transcribeResponse.ok) {
                                throw new Error('Transcriptie mislukt');
                              }
                              
                              const transcriptionData = await transcribeResponse.json();
                              
                              if (transcriptionData.success && transcriptionData.data?.text) {
                                // Now process the transcription with AI
                                await processSOEPRecording({
                                  text: transcriptionData.data.text,
                                  duration: 0, // Duration will be determined by the audio
                                  confidence: transcriptionData.data.confidence || 1.0,
                                });
                              } else {
                                throw new Error(transcriptionData.error || 'Transcriptie mislukt');
                              }
                            } catch (error) {
                              setError(error instanceof Error ? error.message : 'Onverwachte fout bij transcriptie');
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          disabled={disabled || isGenerating}
                          size="lg"
                          className="gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verwerken...
                            </>
                          ) : (
                            <>
                              <Activity size={18} />
                              Verwerk Audio
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Entry Option */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-hysio-deep-green mb-3 flex items-center gap-2">
                    <Edit3 size={18} />
                    Handmatige Invoer
                  </h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjective" className="text-hysio-deep-green font-medium">
                          Subjectief (S)
                        </Label>
                        <Textarea
                          id="subjective"
                          placeholder="Wat zegt de patiënt? (klachten, ervaringen, gevoelens...)"
                          value={manualNotes.subjective}
                          onChange={(e) => setManualNotes(prev => ({ ...prev, subjective: e.target.value }))}
                          rows={4}
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective" className="text-hysio-deep-green font-medium">
                          Objectief (O)
                        </Label>
                        <Textarea
                          id="objective"
                          placeholder="Wat observeer/meet je? (bewegingen, tests, metingen...)"
                          value={manualNotes.objective}
                          onChange={(e) => setManualNotes(prev => ({ ...prev, objective: e.target.value }))}
                          rows={4}
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="evaluation" className="text-hysio-deep-green font-medium">
                          Evaluatie (E)
                        </Label>
                        <Textarea
                          id="evaluation"
                          placeholder="Wat betekent dit? (analyse, interpretatie, conclusie...)"
                          value={manualNotes.evaluation}
                          onChange={(e) => setManualNotes(prev => ({ ...prev, evaluation: e.target.value }))}
                          rows={4}
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan" className="text-hysio-deep-green font-medium">
                          Plan (P)
                        </Label>
                        <Textarea
                          id="plan"
                          placeholder="Wat ga je doen? (behandeling, oefeningen, vervolgafspraak...)"
                          value={manualNotes.plan}
                          onChange={(e) => setManualNotes(prev => ({ ...prev, plan: e.target.value }))}
                          rows={4}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleManualSOEPSubmit}
                      disabled={disabled}
                      className="w-full"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      SOEP Documentatie Opslaan
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {followupData.soepStructure && (
              <CollapsibleSection title="Gestructureerde SOEP" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">SOEP structuur</h4>
                    <CopyToClipboard text={followupData.soepStructure.fullStructuredText} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{followupData.soepStructure.fullStructuredText}</pre>
                  </div>
                </div>
              </CollapsibleSection>
            )}
          </div>
        );

      case 'progress-evaluation':
        return (
          <div className="space-y-6">
            {!followupData.progressEvaluation ? (
              <div className="text-center py-8">
                <TrendingUp size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer voortgangsanalyse
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  Evaluatie van behandelresultaten en doelbereik
                </p>
                <Button
                  onClick={generateProgressEvaluation}
                  disabled={isGenerating || disabled || !followupData.soepStructure}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} className="mr-2" />
                      Genereer Voortgangsanalyse
                    </>
                  )}
                </Button>
                {!followupData.soepStructure && (
                  <p className="text-sm text-amber-600 mt-2">
                    Voltooi eerst de SOEP documentatie
                  </p>
                )}
              </div>
            ) : (
              <CollapsibleSection title="Voortgangsanalyse" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Behandelvoortgang evaluatie</h4>
                    <CopyToClipboard text={followupData.progressEvaluation} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{followupData.progressEvaluation}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateProgressEvaluation}
                    disabled={isGenerating}
                    className="mt-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Opnieuw analyseren
                  </Button>
                </div>
              </CollapsibleSection>
            )}
          </div>
        );

      case 'plan-adjustment':
        return (
          <div className="space-y-6">
            {!followupData.treatmentAdjustments ? (
              <div className="text-center py-8">
                <Target size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer plan aanpassingen
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  Update behandelplan op basis van voortgangsanalyse
                </p>
                <Button
                  onClick={generatePlanAdjustment}
                  disabled={isGenerating || disabled || !followupData.progressEvaluation}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Target size={20} className="mr-2" />
                      Genereer Plan Aanpassingen
                    </>
                  )}
                </Button>
                {!followupData.progressEvaluation && (
                  <p className="text-sm text-amber-600 mt-2">
                    Voltooi eerst de voortgangsanalyse
                  </p>
                )}
              </div>
            ) : (
              <>
                <CollapsibleSection title="Behandelplan Aanpassingen" defaultOpen>
                  <div className="bg-hysio-cream/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-hysio-deep-green">Aangepast behandelplan</h4>
                      <CopyToClipboard text={followupData.treatmentAdjustments} />
                    </div>
                    <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                      <pre className="whitespace-pre-wrap font-inter">{followupData.treatmentAdjustments}</pre>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generatePlanAdjustment}
                      disabled={isGenerating}
                      className="mt-3"
                    >
                      <RotateCcw size={16} className="mr-1" />
                      Opnieuw genereren
                    </Button>
                  </div>
                </CollapsibleSection>

                {followupData.homeExercises && (
                  <CollapsibleSection title="Huisoefeningen">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none text-blue-800">
                        <pre className="whitespace-pre-wrap font-inter">{followupData.homeExercises}</pre>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {followupData.patientEducation && (
                  <CollapsibleSection title="Patiënt Educatie">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none text-green-800">
                        <pre className="whitespace-pre-wrap font-inter">{followupData.patientEducation}</pre>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('w-full max-w-6xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hysio-deep-green mb-2">
          Vervolgconsult - {patientInfo.firstName} {patientInfo.lastName}
        </h1>
        <p className="text-hysio-deep-green-900/70">
          SOEP gestructureerde vervolgconsult documentatie
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-hysio-deep-green">Voortgang</h2>
          <span className="text-sm text-hysio-deep-green-900/70">
            {completedSteps.size} van {followupSteps.length} stappen voltooid
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {followupSteps.map((step, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = currentStep === step.id;
            const isClickable = index === 0 || isStepCompleted(followupSteps[index - 1].id);
            
            return (
              <button
                key={step.id}
                onClick={() => isClickable && goToStep(step.id)}
                disabled={!isClickable}
                className={cn(
                  'p-3 rounded-lg text-left transition-all',
                  'border-2',
                  isCurrent && 'border-hysio-mint bg-hysio-mint/10',
                  isCompleted && !isCurrent && 'border-green-200 bg-green-50',
                  !isCurrent && !isCompleted && 'border-gray-200 bg-gray-50',
                  !isClickable && 'opacity-50 cursor-not-allowed',
                  isClickable && !isCurrent && 'hover:border-hysio-mint/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <step.icon size={16} className={cn(
                    isCompleted ? 'text-green-600' : 
                    isCurrent ? 'text-hysio-deep-green' : 'text-gray-400'
                  )} />
                  <span className={cn(
                    'text-xs font-medium',
                    isCompleted ? 'text-green-700' : 
                    isCurrent ? 'text-hysio-deep-green' : 'text-gray-500'
                  )}>
                    Stap {index + 1}
                  </span>
                  {isCompleted && (
                    <CheckCircle size={14} className="text-green-600 ml-auto" />
                  )}
                </div>
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isCompleted ? 'text-green-800' : 
                  isCurrent ? 'text-hysio-deep-green' : 'text-gray-600'
                )}>
                  {step.title}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  {step.estimatedTime}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={18} />
            <span className="font-medium">Fout opgetreden</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-700"
          >
            Sluiten
          </Button>
        </div>
      )}

      {/* Current Step Content */}
      <Card className="border-2 border-hysio-mint/20 mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-hysio-mint/20 rounded-full flex items-center justify-center">
              <currentStepConfig.icon size={24} className="text-hysio-deep-green" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-hysio-deep-green">
                {currentStepConfig.title}
              </CardTitle>
              <CardDescription className="text-hysio-deep-green-900/70">
                {currentStepConfig.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Red Flags Alert */}
      {followupData.redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-8">
          <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            Rode Vlagen Gedetecteerd
          </h4>
          <ul className="space-y-1">
            {followupData.redFlags.map((flag, index) => (
              <li key={index} className="text-red-700 text-sm">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button
          variant="secondary"
          onClick={currentStepIndex === 0 ? onBack : goToPreviousStep}
          disabled={disabled || isGenerating}
        >
          {currentStepIndex === 0 ? 'Terug naar patiëntgegevens' : 'Vorige stap'}
        </Button>
        
        <div className="flex gap-3">
          {canProceedToNext() && (
            <Button
              variant="outline"
              onClick={goToNextStep}
              disabled={disabled || isGenerating}
            >
              Volgende stap
              <ChevronRight size={16} className="ml-1" />
            </Button>
          )}
          
          {canComplete() && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleComplete}
              disabled={disabled || isGenerating}
            >
              <CheckCircle size={20} className="mr-2" />
              Voltooi Vervolgconsult
            </Button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-hysio-deep-green-900/60">
          SOEP documentatie voldoet aan Nederlandse fysiotherapie richtlijnen
        </p>
        <p className="text-xs text-hysio-deep-green-900/50 mt-1">
          Alle AI-gegenereerde content moet worden geverifieerd door een bevoegd fysiotherapeut
        </p>
      </div>
    </div>
  );
};

export { FollowupWorkflow };