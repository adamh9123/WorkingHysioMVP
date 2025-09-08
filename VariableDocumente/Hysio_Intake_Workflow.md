# Hysio Intake Workflow - Technische Documentatie

## 1. Overzicht & Doel

De Hysio Intake Workflow is het kernproces binnen de Hysio Medical Scribe applicatie voor het begeleiden van fysiotherapeuten bij het uitvoeren van een volledige nieuwe patiënt intake. Het proces transformeert ruwe audio-opnames en handmatige notities naar een gestructureerde, professionele fysiotherapie intake volgens de Nederlandse KNGF/DTF richtlijnen.

**Hoofddoel**: Een fysiotherapeut begeleiden van een nieuwe patiënt tot een volledige klinische conclusie via drie gestructureerde fasen: Anamnese (PHSB-methodiek) → Lichamelijk Onderzoek → Klinische Conclusie.

**Implementatie**: `NewIntakeWorkflow` component (`src/components/scribe/new-intake-workflow.tsx`)

## 2. Stap-voor-Stap User Journey (Gedetailleerd)

### Fase 1: Anamnese

De anamnesefase volgt een drie-staps proces van voorbereiding, opname/verwerking, en review.

#### Stap 1.1: Initiële Staat & Voorbereiding

**Doel**: De anamnesessie voorbereiden door context te scheppen voor het gesprek.

**State bij binnenkomst**:
- `currentPhase: 'anamnesis'`
- `anamnesisState: 'initial'`
- `intakePreparation: ''` (leeg)

**UI Layout & Componenten**:

**Links Panel** (`TwoPanelLayout` linkerpaneel):
- **Anamnesekaart** (`PHSBResultsPanel`): Ingeklapt, leeg, wacht op verwerking
  - Titel: "PHSB Anamnesekaart"
  - Status: Grijs, uitgeschakeld
  - Inhoud: Leeg placeholder met PHSB-structuur preview

- **Intake Voorbereiding** (`CollapsibleSection`): Uitgeklapt, actief
  - Titel: "Intake Voorbereiding (Referentie)"
  - Content: Leeg tekstveld voor voorbereidingsnotities
  - Button: "Genereer Voorbereiding" (primaire actie)

**Rechts Panel** (`TwoPanelLayout` rechterpaneel):
- **Live Opname** (`NewAnamnesisInputPanel` > `CollapsibleSection`): Uitgeklapt, actief
  - `AudioRecorder` component met Nederlandse transcriptie-instellingen
  - Upload optie voor bestaande audio bestanden
  - Status indicator en timer

- **Handmatige Notities** (`CollapsibleSection`): Uitgeklapt, actief
  - Grote `Textarea` voor handmatige input
  - Placeholder: "Voer hier handmatige anamnese notities in..."
  - Real-time character counting

- **Hysio Assistant** (`CollapsibleSection`): Ingeklapt, passief
  - `AssistantIntegration` component voor AI-ondersteuning
  - Toegankelijk maar niet prominent in deze fase

**Interacties**:
1. **Genereer Voorbereiding**: 
   - API call naar `/api/generate-content`
   - System prompt: Fysiotherapie voorbereiding voor nieuwe intake
   - Vult `intakePreparation` state
   - Loading state: `isGeneratingPreparation: true`

2. **Audio Opname**:
   - Start/stop/pause recording via `AudioRecorder`
   - Transcriptie instellingen: `language: 'nl'`, specifieke prompt voor fysiotherapie
   - Opgeslagen in `anamnesisRecording` state

3. **Handmatige Notities**:
   - Direct tekstinput via `onManualNotesChange`
   - Opgeslagen in `anamnesisNotes` state

**State Transities**: Geen automatische transities in deze stap.

#### Stap 1.2: Anamnese Vastleggen & Verwerken

**Doel**: Het anamnesegesprek vastleggen en omzetten naar gestructureerde PHSB-data.

**State voor verwerking**:
- Audio data in `anamnesisRecording` OF text in `anamnesisNotes`
- `canProcess = true` (als er data beschikbaar is)

**UI Layout & Componenten** (ongewijzigd van 1.1):
De layout blijft identiek, maar de "Verwerk Anamnese" button wordt actief.

**Interacties**:
1. **Verwerk Anamnese** (`handleProcessAnamnesis`):
   - Trigger: Klik op "Verwerk Anamnese" button
   - Loading state: `isProcessingAnamnesis: true`
   - Proces:
     1. **Transcriptie** (indien audio): `transcribeAudio()` met Nederlandse prompt
     2. **Combineer data**: `[transcriptionText, anamnesisNotes].filter(Boolean).join('\n\n')`
     3. **PHSB Generatie**: API call naar `API_ENDPOINTS.GENERATE_CONTENT`
        - System prompt: "Je bent een ervaren fysiotherapeut die PHSB anamnese kaarten maakt"
        - User prompt: Bevat patiënt context + anamnese input + PHSB template
     4. **Parsing**: `parsePHSBText()` functie extraheert secties via regex patterns
     5. **State update**: `setPhsbResults()`, `setAnamnesisState('anamnesis-processed')`

**API Calls**:
- **Transcriptie**: `transcribeAudio(blob, 'nl', 'fysiotherapie anamnese prompt')`
- **PHSB Generatie**: `apiCall(API_ENDPOINTS.GENERATE_CONTENT, { systemPrompt, userPrompt })`

**PHSB Parsing Logic**:
```javascript
// Patterns voor P, H, S, B secties
{
  key: 'patientNeeds',
  patterns: [/\*\*P\s*-\s*Patiënt\s*Probleem\/Hulpvraag:?\*\*([\s\S]*?)/i]
},
{
  key: 'limitations', 
  patterns: [/\*\*B\s*-\s*Beperkingen\s*in\s*activiteiten\s*en\s*participatie:?\*\*([\s\S]*?)/i]
}
```

#### Stap 1.3: Resultaat & Review

**Doel**: Het beoordelen, bewerken en valideren van de verwerkte anamnesegegevens.

**State na verwerking**:
- `anamnesisState: 'anamnesis-processed'`
- `phsbResults: PHSBStructure` (gevuld met P, H, S, B secties)

**UI Transformatie**:

**Links Panel** (nu prominent):
- **Anamnesekaart** (`PHSBResultsPanel`): Uitgeklapt, gevuld, actief
  - Header: "PHSB Anamnesekaart" met status indicator (groen vinkje)
  - **P sectie**: Patiënt Probleem/Hulpvraag
    - Bewerkbare content via inline editing
    - Copy button per sectie (`CopyToClipboard`)
  - **H sectie**: Historie
    - Volledig bewerkbaar, real-time updates
  - **S sectie**: Stoornissen in lichaamsfuncties
    - Structured content met medische terminologie
  - **B sectie**: Beperkingen in activiteiten en participatie
    - Focus op ADL, werk, sport limitaties
  - **Toggle modes**: Compact vs. volledige weergave
  - **Global actions**: Copy all, export, edit

**Rechts Panel** (nu ingeklapt):
- **Live Opname** (`CollapsibleSection`): Ingeklapt, disabled
- **Handmatige Notities**: Ingeklapt, content bewaard
- **Hysio Assistant**: Ingeklapt maar toegankelijk

**Interacties**:
1. **Sectie Bewerking**:
   - Inline text editing voor elke PHSB sectie
   - Auto-save functionaliteit
   - Real-time validation

2. **Copy Functionaliteit**:
   - Per-sectie copy via `CopyToClipboard` component
   - Volledige kaart copy optie
   - Formatted output voor EPD integratie

3. **Weergave Modes**:
   - Compact view: Alleen koppen en eerste regels
   - Full view: Complete content zichtbaar
   - Toggle via UI control

**State Transities**:
- Automatische markering: `completedPhases` krijgt 'anamnesis'
- Phase navigation: `WorkflowStepper` wordt bijgewerkt
- Global navigation: Full-width "Ga naar Onderzoek" bar verdwijnt (verwijderd in recente update)

**Navigatie naar Fase 2**:
- Via `WorkflowStepper` klik op "Onderzoek" fase
- Via programmatische navigatie `setCurrentPhase('examination')`

### Fase 2: Onderzoek

De onderzoeksfase volgt een vergelijkbare structuur maar met specifieke focus op lichamelijk onderzoek.

#### Stap 2.1: Initiële Staat & Onderzoeksplan

**Doel**: Een gestructureerd onderzoeksplan genereren op basis van anamnesebevindingen.

**State bij binnenkomst**:
- `currentPhase: 'examination'`
- `examinationState: 'initial'`
- `examinationProposal: ''` (leeg)

**UI Layout & Componenten**:

**Links Panel**:
- **Onderzoeksbevindingen** (`ExaminationResultsPanel`): Ingeklapt, leeg
  - Wacht op verwerking van onderzoeksdata
  - Placeholder voor gestructureerde bevindingen

- **Anamnese Resultaten** (read-only): Compact weergave
  - PHSB resultaten uit fase 1 ter referentie
  - Niet bewerkbaar in deze fase

**Rechts Panel**:
- **Onderzoeksplan** (`CollapsibleSection`): Uitgeklapt, prominent
  - Auto-gegenereerd voorstel op basis van anamnese
  - "Genereer Onderzoeksplan" button
  - Bewerkbaar tekstveld na generatie

- **Live Opname** (`CollapsibleSection`): Uitgeklapt, voor onderzoek-audio
  - Transcriptie instellingen voor lichamelijk onderzoek
  - Prompt: "fysiotherapie lichamelijk onderzoek"

- **Handmatige Notities**: Voor onderzoeksobservaties

**Interacties**:
1. **Genereer Onderzoeksplan** (`handleGenerateExaminationProposal`):
   - API call met anamnese context: `phsbResults?.fullStructuredText`
   - System prompt: "Je bent een ervaren fysiotherapeut die onderzoeksplannen maakt"
   - Genereert gestructureerd plan met:
     - Klinimetrie (NPRS, ROM, kracht)
     - Specifieke bewegingsonderzoeken  
     - Functionele testen
     - Provocatietesten
     - Aandachtspunten

#### Stap 2.2: Onderzoek Uitvoeren & Verwerken

**Doel**: Onderzoeksresultaten vastleggen en structureren.

**Proces**:
1. **Data Collectie**: Audio opname van onderzoek + handmatige metingen
2. **Verwerk Onderzoek** (`handleProcessExamination`):
   - Transcriptie van onderzoeks-audio
   - Combinatie met handmatige notaties
   - API call naar structurering service
   - Resultaat opgeslagen in `examinationFindings`

**State Transities**:
- `examinationState: 'examination-processed'`
- `completedPhases` wordt uitgebreid met 'examination'

#### Stap 2.3: Onderzoeksresultaten Review

**UI na verwerking**:

**Links Panel** (nu actief):
- **Onderzoeksbevindingen** (`ExaminationResultsPanel`): Uitgeklapt, gevuld
  - Gestructureerde bevindingen per categorie:
    - Observaties & inspectie
    - ROM metingen (actief/passief)
    - Krachtonderzoek
    - Functionele testen
    - Specifieke tests & provocaties
  - Bewerkbare content met copy functionaliteit
  - Export opties voor EPD

**Navigatie naar Fase 3**:
- Via `WorkflowStepper` naar "Klinische Conclusie"

### Fase 3: Klinische Conclusie

#### Stap 3.1: Conclusie Generatie

**Doel**: Een geïntegreerde klinische conclusie genereren op basis van anamnese en onderzoek.

**State bij binnenkomst**:
- `currentPhase: 'clinical-conclusion'`
- Beschikbare data: `phsbResults` en `examinationFindings`

**UI Layout**:
- **Volledige breedte layout** voor conclusie weergave
- **Genereer Conclusie** button prominent zichtbaar

**Interacties**:
1. **Genereer Klinische Conclusie**:
   - API call met complete data set:
     - Anamnese: `phsbResults?.fullStructuredText`
     - Onderzoek: `examinationFindings`
     - Patiënt context: `patientInfo`
   - System prompt: Gecombineerde analyse voor conclusie
   - Genereert:
     - Diagnose/hypothese
     - Behandelplan
     - Prognose
     - Doelstellingen
     - Adviezen

#### Stap 3.2: Conclusie Review & Finalisatie

**UI na generatie**:
- **Conclusie weergave** (`ClinicalConclusionView`): Volledig scherm
- **Bewerkbare content** voor fine-tuning
- **Export opties**: PDF, EPD format, print
- **Finale acties**: Save, export, complete workflow

**Voltooiing**:
- `completedPhases` krijgt alle drie fasen
- `onComplete` callback met volledige `IntakeData`
- Navigatie naar completion screen

## 3. Globale Componenten

### WorkflowStepper

**Locatie**: `src/components/ui/workflow-stepper.tsx`

**Functionaliteit**:
- **Visuele voortgang**: 3 fases met iconen (FileText, Stethoscope, CheckCircle)
- **Status weergave**: Current, completed, pending states
- **Navigatie**: Klikbare fases (alleen completed + current)
- **Progress bar**: Visuele completion indicator

**State integratie**:
- `currentPhase`: Bepaalt actieve fase
- `completedPhases`: Array van voltooide fases
- `onPhaseClick`: Handler voor navigatie tussen fases

**Design updates** (recent):
- Compactere, horizontale layout
- Kleinere iconen (14px vs 20px)
- Subtielere kleuren en borders
- Vereenvoudigde progress bar

### Navigation Patterns

**Phase Navigation**:
- Primair via `WorkflowStepper` component
- Programmatisch via `setCurrentPhase()`
- Validation: alleen naar completed fases navigeren

**Global Navigation** (removed):
- Fixed bottom "Ga naar Onderzoek" bar werd verwijderd
- Reden: Dubbele navigatie, global page-wide navigation al aanwezig

## 4. State Management Overzicht

### Primary State Variables

**Phase Management**:
```typescript
const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('anamnesis');
const [completedPhases, setCompletedPhases] = useState<WorkflowPhase[]>([]);
```

**Anamnesis State**:
```typescript
const [anamnesisState, setAnamnesisState] = useState<AnamnesisState>('initial');
const [intakePreparation, setIntakePreparation] = useState<string>('');
const [anamnesisRecording, setAnamnesisRecording] = useState<AudioRecording | null>(null);
const [anamnesisNotes, setAnamnesisNotes] = useState<string>('');
const [phsbResults, setPhsbResults] = useState<PHSBStructure | null>(null);
```

**Examination State**:
```typescript
const [examinationState, setExaminationState] = useState<ExaminationState>('initial');
const [examinationProposal, setExaminationProposal] = useState<string>('');
const [examinationRecording, setExaminationRecording] = useState<AudioRecording | null>(null);
const [examinationNotes, setExaminationNotes] = useState<string>('');
const [examinationFindings, setExaminationFindings] = useState<string>('');
```

**Clinical Conclusion State**:
```typescript
const [clinicalConclusion, setClinicalConclusion] = useState<string>('');
```

**Loading States** (per actie):
```typescript
const [isGeneratingPreparation, setIsGeneratingPreparation] = useState(false);
const [isProcessingAnamnesis, setIsProcessingAnamnesis] = useState(false);
const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
const [isProcessingExamination, setIsProcessingExamination] = useState(false);
const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);
const [isExporting, setIsExporting] = useState(false);
```

### State Flow & Dependencies

**Initialization**:
- Props: `initialData` kan pre-populate state (voor session recovery)
- Effect hook laadt bestaande data indien beschikbaar

**Cross-Phase Dependencies**:
- Examination phase gebruikt `phsbResults` voor context
- Clinical conclusion gebruikt beide `phsbResults` en `examinationFindings`
- Navigation blocked tot fase completion

**Data Persistence**:
- Alle state wordt doorgegeven via `onComplete(intakeData)` callback
- Session management via parent component (`ScribePage`)
- Auto-save functionaliteit beschikbaar via `useSessionState` hook

### Error Handling

**API Error States**:
- Per API call dedicated error handling
- User feedback via error messages
- Graceful degradation bij service failures

**Validation**:
- Data presence validation voor processing
- Audio file type en size validation
- Required field validation per fase

## 5. API Integration & Data Flow

### API Endpoints

**Transcription**: `transcribeAudio(blob, language, prompt)`
**Content Generation**: `API_ENDPOINTS.GENERATE_CONTENT`

### Data Structures

**PHSBStructure**:
```typescript
interface PHSBStructure {
  patientNeeds: string;    // P - Patiënt probleem
  history: string;         // H - Historie
  disorders: string;       // S - Stoornissen
  limitations: string;     // B - Beperkingen  
  redFlags: string[];
  fullStructuredText: string;
}
```

**IntakeData** (final output):
- Volledige samenvatting van alle drie fases
- Gestructureerde data voor EPD export
- Timestamps en metadata

## 6. Performance & UX Considerations

### Loading States
- Granulaire loading indicators per actie
- Non-blocking UI tijdens processing
- Progress feedback voor langere operaties

### Responsive Design
- `TwoPanelLayout` aanpasbaar voor verschillende schermformaten
- Mobile-first collapsible sections
- Touch-friendly interface elementen

### Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- High contrast mode compatibility
- Focus management tijdens state transities

## 7. Technische Implementatie Details

### Component Architecture
- **Compositie pattern**: Complexe UI opgebouwd uit kleinere componenten
- **Props drilling vermijden**: State management via React hooks
- **Separation of concerns**: Business logic gescheiden van UI logic

### Code Organization
- **Single Responsibility**: Elke component heeft een duidelijke functie
- **Reusable Components**: `CollapsibleSection`, `CopyToClipboard`, etc.
- **Type Safety**: Comprehensive TypeScript interfaces

### Bundle Size Optimization
- **Lazy loading**: Heavy components zoals export utilities
- **Code splitting**: Per-fase component loading
- **Tree shaking**: Unused code elimination

Dit document vormt de complete technische specificatie van de Hysio Intake Workflow en dient als single source of truth voor ontwikkelaars, product owners, en stakeholders die de werking van het systeem moeten begrijpen.