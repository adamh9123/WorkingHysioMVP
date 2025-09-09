import * as React from 'react';
import { cn } from '@/utils';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
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
  Stethoscope,
  Target,
  Download,
  FileDown,
  Lightbulb
} from 'lucide-react';
import { IntakeData, PatientInfo, AudioTranscription } from '@/lib/types';
import { apiCall, API_ENDPOINTS } from '@/lib/api';
import { transcribeAudio } from '@/lib/api/transcription';
import { AssistantIntegration } from '@/components/assistant/assistant-integration';
import { SessionExporter } from '@/lib/utils/session-export';
import { PHSBResultsPanel } from '@/components/ui/phsb-results-panel';

// Utility function to parse FysioRoadmap structured text into sections
const parseFysioRoadmapText = (fullText: string) => {
  const sections = {
    patientNeeds: '',
    history: '',
    disorders: '',
    limitations: '',
    redFlags: [] as string[]
  };

  // Split the text into lines
  const lines = fullText.split('\n');
  let currentSection = '';
  let sectionContent: string[] = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Check for section headers
    if (trimmedLine.includes('Patiëntbehoeften') || trimmedLine.includes('**Patiëntbehoeften**')) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection as keyof typeof sections] = sectionContent.join('\n').trim();
      }
      currentSection = 'patientNeeds';
      sectionContent = [];
    } else if (trimmedLine.includes('Historie') || trimmedLine.includes('**Historie**')) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection as keyof typeof sections] = sectionContent.join('\n').trim();
      }
      currentSection = 'history';
      sectionContent = [];
    } else if (trimmedLine.includes('Stoornissen') || trimmedLine.includes('**Stoornissen**')) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection as keyof typeof sections] = sectionContent.join('\n').trim();
      }
      currentSection = 'disorders';
      sectionContent = [];
    } else if (trimmedLine.includes('Beperkingen') || trimmedLine.includes('**Beperkingen**')) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection as keyof typeof sections] = sectionContent.join('\n').trim();
      }
      currentSection = 'limitations';
      sectionContent = [];
    } else if (trimmedLine.includes('[RODE VLAG:')) {
      // Extract red flags
      const redFlag = trimmedLine.replace(/\[RODE VLAG:\s*/, '').replace(/\]/, '');
      if (redFlag) {
        sections.redFlags.push(redFlag);
      }
    } else if (currentSection && trimmedLine) {
      // Skip empty lines and section headers, collect content
      if (!trimmedLine.startsWith('**') || !trimmedLine.endsWith('**')) {
        sectionContent.push(line);
      }
    }
  });

  // Don't forget the last section
  if (currentSection && sectionContent.length > 0) {
    sections[currentSection as keyof typeof sections] = sectionContent.join('\n').trim();
  }

  return sections;
};

export type IntakeStep = 
  | 'preparation' 
  | 'anamnesis' 
  | 'examination-planning' 
  | 'physical-examination' 
  | 'conclusion';

export interface IntakeWorkflowProps {
  patientInfo: PatientInfo;
  onComplete: (intakeData: IntakeData) => void;
  onBack: () => void;
  initialData?: Partial<IntakeData>;
  disabled?: boolean;
  className?: string;
}

interface StepConfig {
  id: IntakeStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  estimatedTime: string;
}

const intakeSteps: StepConfig[] = [
  {
    id: 'preparation',
    title: 'Intake Voorbereiding',
    description: 'Genereer automatische intake voorbereiding op basis van patiëntgegevens',
    icon: FileText,
    estimatedTime: '5 min',
  },
  {
    id: 'anamnesis',
    title: 'Anamnese (PHSB)',
    description: 'Gestructureerde anamnese opname volgens PHSB methode',
    icon: Mic,
    estimatedTime: '15-20 min',
  },
  {
    id: 'examination-planning',
    title: 'Onderzoeksplanning',
    description: 'AI-ondersteunde onderzoeksvoorstel op basis van anamnese',
    icon: Target,
    estimatedTime: '5 min',
  },
  {
    id: 'physical-examination',
    title: 'Lichamelijk Onderzoek',
    description: 'Opname bevindingen lichamelijk onderzoek',
    icon: Stethoscope,
    estimatedTime: '10-15 min',
  },
  {
    id: 'conclusion',
    title: 'Klinische Conclusie',
    description: 'Diagnose, behandelplan en rode vlagen analyse',
    icon: CheckCircle,
    estimatedTime: '5-10 min',
  },
];

const IntakeWorkflow: React.FC<IntakeWorkflowProps> = ({
  patientInfo,
  onComplete,
  onBack,
  initialData = {},
  disabled = false,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState<IntakeStep>('preparation');
  const [completedSteps, setCompletedSteps] = React.useState<Set<IntakeStep>>(new Set());
  const [intakeData, setIntakeData] = React.useState<IntakeData>({
    patientInfo,
    preparation: initialData.preparation || '',
    anamnesisRecording: initialData.anamnesisRecording || null,
    anamnesisTranscript: initialData.anamnesisTranscript || '',
    phsbStructure: initialData.phsbStructure || null,
    examinationPlan: initialData.examinationPlan || '',
    examinationRecording: initialData.examinationRecording || null,
    examinationFindings: initialData.examinationFindings || '',
    clinicalConclusion: initialData.clinicalConclusion || '',
    diagnosis: initialData.diagnosis || '',
    treatmentPlan: initialData.treatmentPlan || '',
    redFlags: initialData.redFlags || [],
    recommendations: initialData.recommendations || '',
    followUpPlan: initialData.followUpPlan || '',
    notes: initialData.notes || '',
    createdAt: initialData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = React.useState<string>(initialData.anamnesisAdditionalNotes || '');
  const [isExporting, setIsExporting] = React.useState(false);

  const currentStepIndex = intakeSteps.findIndex(step => step.id === currentStep);
  const currentStepConfig = intakeSteps[currentStepIndex];

  const generatePreparation = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Updated preparation prompt according to Step 1 requirements
      const systemPrompt = `Je bent een ervaren fysiotherapeut die intake voorbereidingen maakt volgens STAP 1: Voorbereiding Intake.

De voorbereiding intake bestaat uit vier overzichtelijke sub-stappen:

**Substap 1: Hypothesevorming over betrokken structuren en differentiaaldiagnoses**
Analyseer de input (leeftijd en klacht) en formuleer relevante hypotheses gebaseerd op prevalentie en richtlijnen.

Outputformaat:
👤 [Naam], [leeftijd] jaar – [klacht]

Hypothese primaire structuur:
- Primair vermoeden: [structuur/diagnose]

Mogelijke differentiaaldiagnoses:
- [Diagnose 1]
- [Diagnose 2]
- [Diagnose 3]
- [Diagnose 4]
- [Diagnose 5]
Bronnen: KNGF-richtlijnen, ZorgTopics, OrthoXpert.

**Substap 2: Voorbereiding van suggestieve intakevragen (op maat)**
Gericht op leeftijd, regio en primaire klacht – conform LOFTIG- en CEGS-structuur.

🔹 Algemeen:
- Ontstaan, verloop, aard van de pijn vragen

🔹 Regiospecifiek:
- [Regio-specifieke vragen gebaseerd op klacht]

🔹 LOFTIG vragen:
- Locatie, Ontstaan, Frequentie, Tijdgebondenheid, Intensiteit, Geschiedenis

🔹 CEGS vragen:
- Cognitief, Emotioneel, Gedrag, Sociaal

Vermeld bij vragen waarom deze gesteld worden (bijv. voor uitsluiten neurologische klacht).

**Substap 3: Rode vlaggen volgens DTF-richtlijn**
Systematische uitvraag van ernstige onderliggende pathologie:
🔴 Rode vlaggen-screening verplicht:
- Onverklaarbaar gewichtsverlies
- Hevige pijn 's nachts/in rust
- Recent trauma
- Neurologische tekenen
- Systemische symptomen
- Medicatie of behandeling elders

**Substap 4: Voorstel relevant aanvullend onderzoek**
Op basis van hypotheses, leeftijd, ernst van klachten:
📌 Aanvullend onderzoek (mogelijk indicatief):
- [Specifieke onderzoeken voor de regio]
- Klinimetrie aanbevolen: [relevante schalen]
- [Eventueel aanvullende diagnostiek]

Houd rekening met Nederlandse fysiotherapie richtlijnen (KNGF) en gebruik wetenschappelijke kennis.`;

      const patientAge = patientInfo.dateOfBirth ? new Date().getFullYear() - new Date(patientInfo.dateOfBirth).getFullYear() : 'Onbekend';
      const userPrompt = `Patiënt: ${patientInfo.firstName} ${patientInfo.lastName}
Leeftijd: ${patientAge} jaar
Hoofdklacht: ${patientInfo.chiefComplaint}
Eerdere behandeling: ${patientInfo.previousTreatment || 'Geen'}
Verwijzer: ${patientInfo.referralSource || 'Onbekend'}
Medicatie: ${patientInfo.currentMedication || 'Geen'}

Genereer een complete, evidence-based intakevoorbereiding volgens bovenstaande structuur.`;

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
        setIntakeData(prev => ({
          ...prev,
          preparation: response.data.content,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'preparation']));
      } else {
        setError(response.error || 'Fout bij genereren van voorbereiding');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van voorbereiding');
      console.error('Preparation generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const processAnamnesisRecording = async (transcription: AudioTranscription, additionalNotes?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use the updated PHSB structuring prompt from Step 2
      const systemPrompt = `Je bent een ervaren fysiotherapeut die anamnese transcripties structureert volgens de FysioRoadmap Anamnesekaart-formaat uit het Professionele Dossiervoering voor Fysiotherapeuten Document.

Structureer de anamnese volgens deze vier duidelijke blokken:

**Patiëntbehoeften**
- Motivatie en hulpvraag: [Beschrijf de reden van komst en wens van de patiënt]
- Doelen en verwachtingen patiënt: [Concrete doelen die de patiënt wil bereichen]

**Historie**  
- Ontstaansmoment: [Wanneer en hoe de klachten zijn begonnen]
- Verloop van de klachten: [Hoe de klachten zich hebben ontwikkeld]
- Eerdere behandeling: [Wat de patiënt al heeft geprobeerd]

**Stoornissen**
- Pijn: [Details over pijn: NPRS, locatie, type]
- Mobiliteit: [Bewegingsbeperkingen]
- Kracht: [Ervaren of gemeten krachtverlies]
- Stabiliteit: [Gevoel van instabiliteit]

**Beperkingen**
- Functionele beperkingen ADL: [Problemen met algemene dagelijkse levensverrichtingen]
- Beperkingen werk: [Problemen in de werksituatie]
- Beperkingen sport: [Problemen met sportactiviteiten]

**KRITIEKE FORMATTERINGSREGEL:**
Vermijd onnodige, herhalende kopjes in de uitvoertekst. Schrijf DIRECT de inhoud zonder de dikgedrukte kopjes te herhalen.

VOORBEELD CORRECT:
- In plaats van "• Beperkingen sport: Tennissen momenteel onmogelijk vanwege pijn."
- Schrijf: "Tennissen momenteel onmogelijk vanwege pijn."

**Belangrijke instructies:**
- Gebruik informatie uit zowel het transcript als aanvullende notities  
- Voeg GEEN nieuwe informatie toe en vul NIET suggestief in
- Markeer rode vlagen duidelijk met [RODE VLAG: ...]
- Schrijf beknopt en professioneel - bespaart leeswerk en verhoogt scansnelheid
- Indien klinimetrische gegevens beschikbaar (NPRS, PSK, SPADI), verwerk deze automatisch (NPRS in Stoornissen, PSK in Beperkingen)
- Geef voorrang aan audio transcriptie, maar vul aan met handmatige notities waar relevant`;

      const combinedContent = additionalNotes 
        ? `Anamnese transcriptie:
${transcription.text}

Aanvullende handmatige notities:
${additionalNotes}` 
        : `Anamnese transcriptie:
${transcription.text}`;

      const userPrompt = `${combinedContent}

Patiëntgegevens:
${patientInfo.firstName} ${patientInfo.lastName}, hoofdklacht: ${patientInfo.chiefComplaint}

Genereer een gestructureerde FysioRoadmap Anamnesekaart volgens bovenstaande indeling.`;

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
        // Parse the fullStructuredText into individual sections
        const parsedSections = parseFysioRoadmapText(response.data.content);
        
        const phsbStructure = {
          patientNeeds: parsedSections.patientNeeds,
          history: parsedSections.history,
          disorders: parsedSections.disorders,
          limitations: parsedSections.limitations,
          redFlags: parsedSections.redFlags,
          fullStructuredText: response.data.content,
        };

        setIntakeData(prev => ({
          ...prev,
          anamnesisTranscript: transcription.text,
          anamnesisAdditionalNotes: additionalNotes,
          phsbStructure,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'anamnesis']));
      } else {
        setError(response.error || 'Fout bij verwerken van anamnese');
      }
    } catch (error) {
      setError('Onverwachte fout bij verwerken van anamnese');
      console.error('Anamnesis processing error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExaminationPlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use the updated examination planning prompt from Step 3
      const systemPrompt = `Je bent een ervaren fysiotherapeut die onderzoeksplannen maakt op basis van anamnese bevindingen volgens Stap 3: Onderzoeksvoorstel Opstellen.

Maak een gedetailleerd onderzoeksplan met drie onderdelen:

**Deel 1: Basisonderzoek (verplicht voor elke patiënt)**
🔍 Inspectie: Observatie algemene houding, huid en zwelling, spieratrofie
✋ Palpatie: Botstructuren, spiergroepen, peesaanhechtingen, ligamenten
🤸 Actief Bewegingsonderzoek (AROM): Volledige ROM, bewegingskwaliteit
🤚 Passief Bewegingsonderzoek (PROM): ROM vergelijking, eindgevoel

**Deel 2: Specifieke Tests**
Selecteer tests op basis van vermoedelijke structuren en pathologieën
- Per test: naam, indicatie/pathologie, korte uitvoering, reden voor selectie
- Patroonherkenning: wat uitslagen kunnen betekenen

**Deel 3: Klinimetrische Meetinstrumenten**
Gevalideerde instrumenten: NPRS, PSK, regio-specifieke schalen

Baseer onderzoekskeuzes op actuele KNGF-richtlijnen, ZorgTopics en OrthoXpert protocollen.`;

      const anamnesisText = intakeData.phsbStructure?.fullStructuredText || intakeData.anamnesisTranscript;
      const userPrompt = `Op basis van de volgende anamnese bevindingen:

${anamnesisText}

Hoofdklacht: ${patientInfo.chiefComplaint}
Patiënt: ${patientInfo.firstName} ${patientInfo.lastName}`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 1800,
          },
        }),
      });

      if (response.success && response.data?.content) {
        setIntakeData(prev => ({
          ...prev,
          examinationPlan: response.data.content,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'examination-planning']));
      } else {
        setError(response.error || 'Fout bij genereren van onderzoeksplan');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van onderzoeksplan');
      console.error('Examination plan generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const processExaminationFindings = async (transcription: AudioTranscription) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Updated system prompt for examination findings processing (Step 4 related)
      const systemPrompt = `Je bent een ervaren fysiotherapeut die bevindingen van lichamelijk onderzoek structureert voor diagnostische analyse.

Analyseer de onderzoeksbevindingen en structureer deze systematisch in:

1. **Inspectie bevindingen**
   - Algemene houding, antalgische houdingen, compensaties
   - Huid, zwelling, spieratrofie, asymmetrie

2. **Palpatie bevindingen**
   - Botstructuren, anatomische punten
   - Spiergroepen, pees aanhechtingen, ligamenten
   - Drukpijn, zwelling, warmte

3. **Actieve bewegingen (AROM)**
   - ROM metingen, bewegingskwaliteit
   - Pijnprovocatie, compensaties

4. **Passieve bewegingen (PROM)**
   - ROM vergelijking met actief
   - Eindgevoel (hard, zacht, elastisch, pijnlijk)

5. **Weerstandstests**
   - Kracht, pijn bij weerstand
   - Specifieke spier/peesgroep testen

6. **Specifieke tests**
   - Testresultaten (positief/negatief)
   - Interpretatie en klinische relevantie

7. **Functionele tests**
   - ADL-gerelateerde bewegingen
   - Sport/werk-specifieke testen

8. **Belangrijke bevindingen en afwijkingen**
   - Significante bevindingen voor diagnostiek
   - Rode vlagen of afwijkende bevindingen

Gebruik professionele fysiotherapie terminologie en noteer normaalwaarden waar relevant.`;

      const userPrompt = `Onderzoeksbevindingen transcriptie:
${transcription.text}

Onderzoeksplan dat gevolgd werd:
${intakeData.examinationPlan}

Patiënt: ${patientInfo.firstName} ${patientInfo.lastName}`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          options: {
            model: 'gpt-4o',
            temperature: 0.6,
            max_tokens: 1800,
          },
        }),
      });

      if (response.success && response.data?.content) {
        setIntakeData(prev => ({
          ...prev,
          examinationFindings: response.data.content,
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'physical-examination']));
      } else {
        setError(response.error || 'Fout bij verwerken van onderzoeksbevindingen');
      }
    } catch (error) {
      setError('Onverwachte fout bij verwerken van onderzoeksbevindingen');
      console.error('Examination findings processing error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClinicalConclusion = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use the updated clinical conclusion prompt from Step 5
      const systemPrompt = `Je bent een ervaren fysiotherapeut die de definitieve klinische conclusie opstelt volgens Stap 5: Klinische Conclusie.

Maak een complete conclusie volgens dit format:

**📌 Primaire klacht**
- Samenvattende beschrijving van hoofdklacht en duur

**🔍 Primaire diagnose**
- Diagnose (Waarschijnlijkheid: %)
- Onderbouwing gebaseerd op klinische testen en bevindingen
- Passend bij leeftijd en klachtpatroon volgens richtlijnen

**⚠️ Differentiaaldiagnoses (alternatieve hypotheses)**
1. Diagnose 1 (%): onderbouwing en bevindingen
2. Diagnose 2 (%): onderbouwing en bevindingen

**🔬 Aanvullend onderzoek (bij indicatie/twijfel)**
- Indien geïndiceerd: echografie, MRI, röntgen
- Wanneer en waarom geïndiceerd

**🎯 Geadviseerd behandelverloop (korte vooruitblik)**
- Verwacht herstelverloop: tijdsinschatting
- Initiële behandeling gericht op: behandeldoelen
- Progressie naar: vervolgdoelen

**📏 Klinimetrische evaluatie**
- Baseline meetwaardes vastgesteld
- Evaluatiemoment gepland na aantal behandelingen

**📚 Onderbouwing en gebruikte richtlijnen**
- KNGF-richtlijn, ZorgTopics, OrthoXpert-protocol

**Samenvattend:**
Korte conclusie met behandelindicatie, verwachte prognose en geplande evaluatie

**Vereisten:**
- Professionele taal geschikt voor EPD
- Juridisch sluitend geformuleerd
- Evidence-based en voldoet aan verslagleggingsrichtlijnen
- Altijd vermelden: "Altijd nazien door een bevoegd fysiotherapeut."`;

      const allFindings = `
Anamnese (FysioRoadmap):
${intakeData.phsbStructure?.fullStructuredText || intakeData.anamnesisTranscript}

Onderzoeksbevindingen:
${intakeData.examinationFindings}

Patiëntprofiel:
${patientInfo.firstName} ${patientInfo.lastName}
Hoofdklacht: ${patientInfo.chiefComplaint}
Eerdere behandeling: ${patientInfo.previousTreatment || 'Geen'}
Medicatie: ${patientInfo.currentMedication || 'Geen'}
Datum: ${new Date().toLocaleDateString('nl-NL')}`;

      const response = await apiCall(API_ENDPOINTS.GENERATE_CONTENT, {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userPrompt: allFindings,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 2200,
          },
        }),
      });

      if (response.success && response.data?.content) {
        // Extract sections from the generated content
        const content = response.data.content;
        
        setIntakeData(prev => ({
          ...prev,
          clinicalConclusion: content,
          diagnosis: extractSection(content, 'diagnose') || '',
          treatmentPlan: extractSection(content, 'behandelplan') || '',
          redFlags: extractRedFlags(content),
          recommendations: extractSection(content, 'aanbevelingen') || '',
          followUpPlan: extractSection(content, 'vervolgafspraken') || '',
          updatedAt: new Date().toISOString(),
        }));
        setCompletedSteps(prev => new Set([...prev, 'conclusion']));
      } else {
        setError(response.error || 'Fout bij genereren van klinische conclusie');
      }
    } catch (error) {
      setError('Onverwachte fout bij genereren van klinische conclusie');
      console.error('Clinical conclusion generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const extractSection = (content: string, sectionName: string): string => {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?${sectionName}[^\\n]*:?\\*?\\*?\\s*\\n([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][^\\n]*:?\\*?\\*?|$)`, 'i');
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

  const goToNextStep = () => {
    if (currentStepIndex < intakeSteps.length - 1) {
      setCurrentStep(intakeSteps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(intakeSteps[currentStepIndex - 1].id);
    }
  };

  const goToStep = (step: IntakeStep) => {
    setCurrentStep(step);
  };

  const isStepCompleted = (stepId: IntakeStep): boolean => {
    return completedSteps.has(stepId);
  };

  const canProceedToNext = (): boolean => {
    return isStepCompleted(currentStep) && currentStepIndex < intakeSteps.length - 1;
  };

  const canComplete = (): boolean => {
    return completedSteps.size === intakeSteps.length;
  };

  const handleComplete = () => {
    if (canComplete()) {
      onComplete(intakeData);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    setError(null);

    try {
      // Create a session object for export
      const sessionForExport = {
        id: `intake-${Date.now()}`,
        type: 'intake' as const,
        patientInfo,
        intakeData,
        status: 'completed',
        startedAt: intakeData.createdAt,
        completedAt: new Date().toISOString(),
        lastSavedAt: intakeData.updatedAt,
        updatedAt: intakeData.updatedAt,
      };

      const result = await SessionExporter.exportSession(sessionForExport, {
        format,
        includePatientInfo: true,
        includeAudioTranscripts: true,
        includeTimestamps: true,
        anonymize: false,
      });

      if (result.success) {
        SessionExporter.downloadExportedFile(result);
      } else {
        setError(`Export mislukt: ${result.error}`);
      }
    } catch (error) {
      setError(`Onverwachte fout bij exporteren: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'preparation':
        return (
          <div className="space-y-6">
            {!intakeData.preparation ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer intake voorbereiding
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  Automatische voorbereiding op basis van patiëntgegevens
                </p>
                <Button
                  onClick={generatePreparation}
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
              <CollapsibleSection title="Intake Voorbereiding" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Gegenereerde voorbereiding</h4>
                    <CopyToClipboard text={intakeData.preparation} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{intakeData.preparation}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generatePreparation}
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

      case 'anamnesis':
        // If PHSB structure is processed, show the new two-panel layout
        if (intakeData.phsbStructure) {
          return (
            <div className="min-h-screen bg-hysio-off-white -m-6 p-6 pb-32">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  {/* LEFT PANEL - FysioRoadmap Anamnesekaart */}
                  <div className="bg-white rounded-lg border border-hysio-mint/20 shadow-sm p-6">
                    <PHSBResultsPanel
                      phsbData={intakeData.phsbStructure}
                      onDataChange={(updatedData) => {
                        setIntakeData(prev => ({
                          ...prev,
                          phsbStructure: updatedData,
                          updatedAt: new Date().toISOString(),
                        }));
                      }}
                      enableEditing={true}
                      showSources={false}
                      className="h-full"
                    />
                  </div>

                  {/* RIGHT PANEL - Context and Input */}
                  <div className="space-y-6">
                    {/* Collapsible Anamnese Invoer */}
                    <CollapsibleSection title="Anamnese Invoer" defaultOpen={false}>
                      <div className="space-y-4">
                        <p className="text-hysio-deep-green-900/80 text-sm">
                          Herbewerk of voeg aanvullende input toe aan de anamnese.
                        </p>
                        
                        {/* Text input for additional notes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-hysio-deep-green">
                            Aanvullende notities
                          </label>
                          <textarea
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            placeholder="Voeg aanvullende notities toe..."
                            disabled={disabled || isGenerating}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y text-sm"
                          />
                        </div>

                        {/* Audio recording component (compact) */}
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Audio opname</h5>
                          <AudioRecorder
                            onRecordingComplete={(blob, duration) => {
                              const recording = {
                                id: Date.now().toString(),
                                blob,
                                duration,
                                timestamp: new Date().toISOString(),
                                phase: 'anamnesis' as const,
                              };
                              setIntakeData(prev => ({
                                ...prev,
                                anamnesisRecording: recording,
                                updatedAt: new Date().toISOString(),
                              }));
                            }}
                            onTranscriptionComplete={(transcription) => processAnamnesisRecording(transcription, additionalNotes)}
                            onError={(error) => setError(error)}
                            autoTranscribe={false}
                            transcriptionOptions={{
                              language: 'nl',
                              prompt: 'Dit is een fysiotherapie anamnese gesprek in het Nederlands. Transcribeer accuraat alle medische termen en patiënt uitspraken.',
                              temperature: 0.0,
                            }}
                            disabled={disabled || isGenerating}
                            maxDuration={1800000}
                          />
                        </div>

                        {/* Reprocess button */}
                        <Button
                          onClick={async () => {
                            const textOnlyTranscription = {
                              text: intakeData.anamnesisTranscript,
                              timestamp: new Date().toISOString(),
                            };
                            await processAnamnesisRecording(textOnlyTranscription, additionalNotes);
                          }}
                          disabled={isGenerating}
                          size="sm"
                          className="w-full bg-hysio-mint hover:bg-hysio-mint/90 text-white"
                        >
                          <RotateCcw size={16} className="mr-2" />
                          Opnieuw verwerken
                        </Button>
                      </div>
                    </CollapsibleSection>

                    {/* Intake Voorbereiding */}
                    {intakeData.preparation && (
                      <CollapsibleSection title="Intake Voorbereiding (Referentie)" defaultOpen={false}>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-amber-800 flex items-center gap-2">
                              <Lightbulb size={16} />
                              AI-gegenereerde voorbereiding
                            </h4>
                            <CopyToClipboard text={intakeData.preparation} />
                          </div>
                          <div className="prose prose-sm max-w-none text-amber-900">
                            <pre className="whitespace-pre-wrap font-inter text-xs">{intakeData.preparation}</pre>
                          </div>
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Hysio Assistant */}
                    <div className="bg-white rounded-lg border border-hysio-mint/20 shadow-sm">
                      <AssistantIntegration
                        isCollapsed={false}
                        className="border-0 shadow-none"
                      />
                    </div>

                    {/* Source Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Gebruikte bronnen</h4>
                      <div className="space-y-2">
                        {intakeData.anamnesisTranscript && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mic size={16} className="text-blue-600" />
                            <span>Audio transcriptie</span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(intakeData.anamnesisTranscript.length / 100)} karakters)
                            </span>
                          </div>
                        )}
                        {intakeData.anamnesisAdditionalNotes?.trim() && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Edit3 size={16} className="text-green-600" />
                            <span>Handmatige notities</span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(intakeData.anamnesisAdditionalNotes.length / 100)} karakters)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full-width "Ga naar Onderzoek" button */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-hysio-mint/20 p-6 shadow-lg z-50">
                  <div className="max-w-7xl mx-auto">
                    <Button
                      onClick={goToNextStep}
                      disabled={disabled || isGenerating}
                      size="lg"
                      className="w-full bg-hysio-deep-green hover:bg-hysio-deep-green/90 text-white py-4 text-xl font-semibold"
                    >
                      <Target size={24} className="mr-3" />
                      Ga naar Onderzoek
                      <ChevronRight size={24} className="ml-3" />
                    </Button>
                    <p className="text-center text-sm text-hysio-deep-green-900/60 mt-2">
                      FysioRoadmap anamnese voltooid - Ga door naar de onderzoeksfase
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Pre-processing state - show input interface
        return (
          <div className="space-y-6">
            <CollapsibleSection title="Anamnese Opname (FysioRoadmap)" defaultOpen>
              <div className="space-y-4">
                <p className="text-hysio-deep-green-900/80">
                  Neem de anamnese op volgens de FysioRoadmap methode of upload een audiobestand. U kunt ook handmatige notities toevoegen die gecombineerd worden met de audio transcriptie.
                </p>
                
                {/* Text input for additional notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-hysio-deep-green">
                    Aanvullende notities (optioneel)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Voer hier handmatige notities in die gecombineerd worden met de audio transcriptie..."
                    disabled={disabled || isGenerating}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y"
                  />
                  <p className="text-xs text-gray-500">
                    Deze notities worden automatisch gecombineerd met de audio transcriptie bij het genereren van de FysioRoadmap anamnesekaart.
                  </p>
                  
                  {/* Button to process only text notes */}
                  {additionalNotes.trim() && !intakeData.anamnesisRecording && !intakeData.phsbStructure && (
                    <div className="pt-2">
                      <Button
                        onClick={async () => {
                          const textOnlyTranscription = {
                            text: '',
                            timestamp: new Date().toISOString(),
                          };
                          await processAnamnesisRecording(textOnlyTranscription, additionalNotes);
                        }}
                        size="sm"
                        variant="outline"
                        disabled={isGenerating}
                        className="text-hysio-deep-green border-hysio-deep-green hover:bg-hysio-deep-green hover:text-white"
                      >
                        <Edit3 size={16} className="mr-2" />
                        Verwerk alleen tekst notities
                      </Button>
                    </div>
                  )}
                </div>

                <AudioRecorder
                  onRecordingComplete={(blob, duration) => {
                    const recording = {
                      id: Date.now().toString(),
                      blob,
                      duration,
                      timestamp: new Date().toISOString(),
                      phase: 'anamnesis' as const,
                    };
                    setIntakeData(prev => ({
                      ...prev,
                      anamnesisRecording: recording,
                      updatedAt: new Date().toISOString(),
                    }));
                  }}
                  onTranscriptionComplete={(transcription) => processAnamnesisRecording(transcription, additionalNotes)}
                  onError={(error) => setError(error)}
                  autoTranscribe={false} // Disable auto-transcribe to give user control
                  transcriptionOptions={{
                    language: 'nl',
                    prompt: 'Dit is een fysiotherapie anamnese gesprek in het Nederlands. Transcribeer accuraat alle medische termen en patiënt uitspraken.',
                    temperature: 0.0,
                  }}
                  disabled={disabled || isGenerating}
                  maxDuration={1800000} // 30 minutes
                />
              </div>
            </CollapsibleSection>

            {/* Audio Status and Process Button */}
            {intakeData.anamnesisRecording && (
              <CollapsibleSection title="Audio Status" defaultOpen>
                <div className="space-y-4">
                  {/* Audio Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Mic size={18} />
                      Audio beschikbaar
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Duur: {formatDuration(intakeData.anamnesisRecording.duration / 1000)}
                    </p>
                    <p className="text-xs text-blue-600 mb-2">
                      Opgenomen op: {new Date(intakeData.anamnesisRecording.timestamp).toLocaleString('nl-NL')}
                    </p>
                    <p className="text-xs text-blue-600">
                      Type: {intakeData.anamnesisRecording.blob.type} | Grootte: {Math.round(intakeData.anamnesisRecording.blob.size / 1024)}KB
                    </p>
                  </div>

                  {/* Process Audio Button */}
                  {!intakeData.phsbStructure ? (
                    <div className="text-center">
                      <Button
                        onClick={async () => {
                          if (intakeData.anamnesisRecording) {
                            setIsGenerating(true);
                            setError(null);
                            try {
                              const transcriptionResult = await transcribeAudio(intakeData.anamnesisRecording.blob, {
                                language: 'nl',
                                prompt: 'Dit is een fysiotherapie anamnese gesprek in het Nederlands. Transcribeer accuraat alle medische termen en patiënt uitspraken.',
                                temperature: 0.0,
                              });
                              
                              if (transcriptionResult.success && transcriptionResult.transcript) {
                                const transcriptionData = {
                                  text: transcriptionResult.transcript,
                                  duration: transcriptionResult.duration || intakeData.anamnesisRecording.duration,
                                  timestamp: new Date().toISOString(),
                                };
                                await processAnamnesisRecording(transcriptionData, additionalNotes);
                              } else {
                                setError(transcriptionResult.error || 'Fout bij transcriberen van audio');
                              }
                            } catch (error) {
                              console.error('Audio processing error:', error);
                              setError(`Onverwachte fout bij verwerken van audio: ${error instanceof Error ? error.message : String(error)}`);
                            } finally {
                              setIsGenerating(false);
                            }
                          }
                        }}
                        size="lg"
                        disabled={isGenerating || !intakeData.anamnesisRecording}
                        className="bg-hysio-mint hover:bg-hysio-mint/90"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Audio wordt verwerkt...
                          </>
                        ) : (
                          <>
                            <Play size={20} className="mr-2" />
                            Verwerk Audio naar FysioRoadmap
                          </>
                        )}
                      </Button>
                      <div className="text-sm text-hysio-deep-green-900/70 mt-2">
                        <p>Transcribeert en structureert de audio volgens FysioRoadmap methode</p>
                        {additionalNotes.trim() && (
                          <p className="text-hysio-mint font-medium">Inclusief handmatige notities</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle size={18} />
                        <span className="font-medium">Audio succesvol verwerkt naar FysioRoadmap</span>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}
          </div>
        );

      case 'examination-planning':
        return (
          <div className="space-y-6">
            {!intakeData.examinationPlan ? (
              <div className="text-center py-8">
                <Target size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer onderzoeksplan
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  AI-ondersteund onderzoeksvoorstel op basis van anamnese
                </p>
                <Button
                  onClick={generateExaminationPlan}
                  disabled={isGenerating || disabled || !intakeData.phsbStructure}
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
                      Genereer Onderzoeksplan
                    </>
                  )}
                </Button>
                {!intakeData.phsbStructure && (
                  <p className="text-sm text-amber-600 mt-2">
                    Voltooi eerst de anamnese stap
                  </p>
                )}
              </div>
            ) : (
              <CollapsibleSection title="Onderzoeksplan" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Gegenereerd onderzoeksplan</h4>
                    <CopyToClipboard text={intakeData.examinationPlan} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{intakeData.examinationPlan}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateExaminationPlan}
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

      case 'physical-examination':
        return (
          <div className="space-y-6">
            <CollapsibleSection title="Lichamelijk Onderzoek" defaultOpen>
              <div className="space-y-4">
                <p className="text-hysio-deep-green-900/80">
                  Neem de bevindingen van het lichamelijk onderzoek op. Volg het onderzoeksplan.
                </p>
                <AudioRecorder
                  onRecordingComplete={(blob, duration) => {
                    const recording = {
                      id: Date.now().toString(),
                      blob,
                      duration,
                      timestamp: new Date().toISOString(),
                      phase: 'examination' as const,
                    };
                    setIntakeData(prev => ({
                      ...prev,
                      examinationRecording: recording,
                      updatedAt: new Date().toISOString(),
                    }));
                  }}
                  onTranscriptionComplete={processExaminationFindings}
                  onError={(error) => setError(error)}
                  autoTranscribe={false} // Disable auto-transcribe for manual control
                  transcriptionOptions={{
                    language: 'nl',
                    prompt: 'Dit is een fysiotherapie lichamelijk onderzoek in het Nederlands. Transcribeer accuraat alle test resultaten, bevindingen en medische observaties.',
                    temperature: 0.0,
                  }}
                  disabled={disabled || isGenerating}
                  maxDuration={1800000} // 30 minutes
                />
              </div>
            </CollapsibleSection>

            {/* Audio Status and Process Button for Physical Examination */}
            {intakeData.examinationRecording && (
              <CollapsibleSection title="Audio Status - Lichamelijk Onderzoek" defaultOpen>
                <div className="space-y-4">
                  {/* Audio Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Stethoscope size={18} />
                      Audio beschikbaar - Onderzoeksbevindingen
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Duur: {formatDuration(intakeData.examinationRecording.duration / 1000)}
                    </p>
                    <p className="text-xs text-blue-600 mb-2">
                      Opgenomen op: {new Date(intakeData.examinationRecording.timestamp).toLocaleString('nl-NL')}
                    </p>
                    <p className="text-xs text-blue-600">
                      Type: {intakeData.examinationRecording.blob.type} | Grootte: {Math.round(intakeData.examinationRecording.blob.size / 1024)}KB
                    </p>
                  </div>

                  {/* Process Audio Button */}
                  {!intakeData.examinationFindings ? (
                    <div className="text-center">
                      <Button
                        onClick={async () => {
                          if (intakeData.examinationRecording) {
                            setIsGenerating(true);
                            setError(null);
                            try {
                              const transcriptionResult = await transcribeAudio(intakeData.examinationRecording.blob, {
                                language: 'nl',
                                prompt: 'Dit is een fysiotherapie lichamelijk onderzoek in het Nederlands. Transcribeer accuraat alle test resultaten, bevindingen en medische observaties.',
                                temperature: 0.0,
                              });
                              
                              if (transcriptionResult.success && transcriptionResult.transcript) {
                                const transcriptionData = {
                                  text: transcriptionResult.transcript,
                                  duration: transcriptionResult.duration || intakeData.examinationRecording.duration,
                                  timestamp: new Date().toISOString(),
                                };
                                await processExaminationFindings(transcriptionData);
                              } else {
                                setError(transcriptionResult.error || 'Fout bij transcriberen van onderzoeksaudio');
                              }
                            } catch (error) {
                              console.error('Examination audio processing error:', error);
                              setError(`Onverwachte fout bij verwerken van onderzoeksaudio: ${error instanceof Error ? error.message : String(error)}`);
                            } finally {
                              setIsGenerating(false);
                            }
                          }
                        }}
                        size="lg"
                        disabled={isGenerating || !intakeData.examinationRecording}
                        className="bg-hysio-mint hover:bg-hysio-mint/90"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Onderzoeksaudio wordt verwerkt...
                          </>
                        ) : (
                          <>
                            <Stethoscope size={20} className="mr-2" />
                            Verwerk Audio naar Bevindingen
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-hysio-deep-green-900/70 mt-2">
                        Transcribeert en structureert de onderzoeksbevindingen
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle size={18} />
                        <span className="font-medium">Audio succesvol verwerkt naar onderzoeksbevindingen</span>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {intakeData.examinationFindings && (
              <CollapsibleSection title="Onderzoeksbevindingen" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Gestructureerde bevindingen</h4>
                    <CopyToClipboard text={intakeData.examinationFindings} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{intakeData.examinationFindings}</pre>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {intakeData.examinationPlan && (
              <CollapsibleSection title="Onderzoeksplan (referentie)">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <pre className="whitespace-pre-wrap font-inter">{intakeData.examinationPlan}</pre>
                  </div>
                </div>
              </CollapsibleSection>
            )}
          </div>
        );

      case 'conclusion':
        return (
          <div className="space-y-6">
            {!intakeData.clinicalConclusion ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-hysio-mint mb-4" />
                <h3 className="text-lg font-medium text-hysio-deep-green mb-2">
                  Genereer klinische conclusie
                </h3>
                <p className="text-hysio-deep-green-900/70 mb-6">
                  Complete conclusie met diagnose, behandelplan en rode vlagen analyse
                </p>
                <Button
                  onClick={generateClinicalConclusion}
                  disabled={isGenerating || disabled || !intakeData.examinationFindings}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} className="mr-2" />
                      Genereer Conclusie
                    </>
                  )}
                </Button>
                {!intakeData.examinationFindings && (
                  <p className="text-sm text-amber-600 mt-2">
                    Voltooi eerst het lichamelijk onderzoek
                  </p>
                )}
              </div>
            ) : (
              <CollapsibleSection title="Klinische Conclusie" defaultOpen>
                <div className="bg-hysio-cream/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-hysio-deep-green">Complete conclusie</h4>
                    <CopyToClipboard text={intakeData.clinicalConclusion} />
                  </div>
                  <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
                    <pre className="whitespace-pre-wrap font-inter">{intakeData.clinicalConclusion}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateClinicalConclusion}
                    disabled={isGenerating}
                    className="mt-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Opnieuw genereren
                  </Button>
                </div>
              </CollapsibleSection>
            )}

            {intakeData.redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} />
                  Rode Vlagen Gedetecteerd
                </h4>
                <ul className="space-y-1">
                  {intakeData.redFlags.map((flag, index) => (
                    <li key={index} className="text-red-700 text-sm">
                      • {flag}
                    </li>
                  ))}
                </ul>
              </div>
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
          Intake Workflow - {patientInfo.firstName} {patientInfo.lastName}
        </h1>
        <p className="text-hysio-deep-green-900/70">
          5-staps gestructureerde intake volgens Nederlandse fysiotherapie richtlijnen
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-hysio-deep-green">Voortgang</h2>
          <span className="text-sm text-hysio-deep-green-900/70">
            {completedSteps.size} van {intakeSteps.length} stappen voltooid
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {intakeSteps.map((step, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = currentStep === step.id;
            const isClickable = index === 0 || isStepCompleted(intakeSteps[index - 1].id);
            
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

      {/* Export Section - Show when workflow is complete */}
      {completedSteps.size === intakeSteps.length && (
        <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-4 flex items-center gap-2">
            <Download size={20} />
            Intake exporteren
          </h3>
          <p className="text-green-700 mb-4">
            Uw intake is voltooid! U kunt het nu exporteren als PDF of Word-document.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={16} className="mr-2" />
                  Exporteer als PDF
                </>
              )}
            </Button>
            <Button
              onClick={() => handleExport('docx')}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={16} className="mr-2" />
                  Exporteer als Word
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button
          variant="secondary"
          onClick={currentStepIndex === 0 ? onBack : goToPreviousStep}
          disabled={disabled || isGenerating || isExporting}
        >
          {currentStepIndex === 0 ? 'Terug naar patiëntgegevens' : 'Vorige stap'}
        </Button>
        
        <div className="flex gap-3">
          {canProceedToNext() && (
            <Button
              variant="outline"
              onClick={goToNextStep}
              disabled={disabled || isGenerating || isExporting}
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
              disabled={disabled || isGenerating || isExporting}
            >
              <CheckCircle size={20} className="mr-2" />
              Voltooi Intake
            </Button>
          )}
        </div>
      </div>

      {/* Hysio Assistant Integration - Hide when in processed anamnesis state */}
      {!(currentStep === 'anamnesis' && intakeData.phsbStructure) && (
        <div className="mt-8">
          <AssistantIntegration
            isCollapsed={currentStep === 'anamnesis' || currentStep === 'preparation'}
            className="w-full"
          />
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-hysio-deep-green-900/60">
          Intake workflow voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)
        </p>
        <p className="text-xs text-hysio-deep-green-900/50 mt-1">
          Alle AI-gegenereerde content moet worden geverifieerd door een bevoegd fysiotherapeut
        </p>
      </div>
    </div>
  );
};

export { IntakeWorkflow };