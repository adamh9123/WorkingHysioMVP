# Hysio Consult Workflow - Technische Documentatie

## 1. Overzicht & Doel

De Hysio Consult Workflow is het gestroomlijnde proces binnen de Hysio Medical Scribe applicatie voor het razendsnel documenteren van vervolgconsulten volgens de SOEP-methodiek (Subjectief, Objectief, Evaluatie, Plan). Het workflow volgt een "opnemen, stoppen, klaar" filosofie waarbij fysiotherapeuten in één vloeiende beweging van audio-opname naar complete SOEP-documentatie gaan.

**Hoofddoel**: Vervolgconsulten efficiënt vastleggen en structureren in SOEP-format voor directe integratie in het EPD, met minimale administratieve last.

**Componenten**:
- **Primair**: `StreamlinedFollowupWorkflow` (`src/components/scribe/streamlined-followup-workflow.tsx`)
- **Resultaat**: `SOEPResultPage` (`src/components/scribe/soep-result-page.tsx`)

## 2. Stap-voor-Stap User Journey (Gedetailleerd)

### Stap 1: Initiële Staat & Voorbereiding

**Doel**: De sessie starten en voorbereiden met AI-gegenereerde consultvorbereiding.

**State bij initialisatie**:
```typescript
const [sessionPreparation, setSessionPreparation] = useState<string>('');
const [isGeneratingPreparation, setIsGeneratingPreparation] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [manualNotes, setManualNotes] = useState('');
const [soepResult, setSOEPResult] = useState<SOEPStructure | null>(null);
```

**UI Layout & Componenten**:

De interface gebruikt een **twee-paneel indeling** met dynamische content:

**Linker Panel - Sessie Voorbereiding**:
- **Component**: `Card` met header "Sessie Voorbereiding"
- **Inhoud**: 
  - AI-gegenereerde vervolgconsult voorbereiding
  - Template format: "📂 Voorbereiding Zitting – [Naam], [Leeftijd] jaar"
  - Secties:
    - 1️⃣ Focus & Evaluatie
    - 2️⃣ Subjectieve Anamnese (S)  
    - 3️⃣ Rode Vlaggen Her-screening
    - 4️⃣ Objectief Onderzoek (O)

**Rechter Panel - Input Controls**:
- **Component**: `Card` met header "Consult Documentatie"
- **Audio Opname Sectie**:
  - `useAudioRecorder` hook integratie
  - Start/Stop/Pause controls
  - Real-time timer weergave
  - Maximale opnametijd: 30 minuten
  - File upload optie als alternatief

- **Handmatige Notities Sectie**:
  - Grote `Textarea` (6 rijen)
  - Placeholder: "Typ hier uw observaties, meetresultaten, behandelnotities..."
  - Real-time synchronisatie met audio opname

**Automatische Voorbereiding Generatie**:

*Opmerking: Automatische generatie bij mount is uitgeschakeld om server errors te voorkomen*

```typescript
// Disabled automatic generation
// React.useEffect(() => {
//   const timer = setTimeout(() => {
//     generateSessionPreparation().catch(err => {
//       console.error('Failed to generate session preparation:', err);
//     });
//   }, 500);
//   return () => clearTimeout(timer);
// }, [generateSessionPreparation]);
```

**Handmatige Generatie via Button**:
- **Trigger**: "Genereer Voorbereiding" button
- **API Call**: `generateSessionPreparation()`
- **System Prompt**: Template-gebaseerde vervolgconsult voorbereiding
- **User Prompt**: Patiënt details + hoofdklacht context

**Interacties in Stap 1**:

1. **Voorbereiding Genereren** (`generateSessionPreparation`):
   ```typescript
   const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult voorbereidingen maakt volgens het Hysio Medical Scribe protocol.`
   ```
   - Gebruikt exact template format
   - Incorporeert patiënt data: `patientInfo.initials`, leeftijd, geslacht, hoofdklacht
   - Loading state: `isGeneratingPreparation: true`
   - Fout handling met user feedback

2. **Audio Opname Setup**:
   - **Recorder configuratie**: 
     - Max duration: 1800000ms (30 minuten)
     - Error handling via callback
     - Blob output naar `setAudioBlob`

3. **Timer Management**:
   - Real-time timer tijdens opname: `setRecordingTime(prev => prev + 1)`
   - Interval clearing bij stop/pause
   - Visual feedback: rood met pulse animatie

### Stap 2: Consult Vastleggen & Verwerken  

**Doel**: Het vervolgconsult vastleggen via audio en/of tekst, en direct verwerken naar SOEP-structuur.

**UI State tijdens opname**:
- **Recording Controls**: Dynamische button set
  - **Niet opgenomen**: "Start Opname" (primaire button)
  - **Aan het opnemen**: "Stop Opname" + "Pauzeren/Hervatten"
  - **Timer weergave**: `formatDuration(recordingTime)` met "/15:00 max"

**Audio Recording Interface**:
```tsx
// Recording Timer visuele feedback
{isRecording && (
  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className={cn(
      'w-3 h-3 rounded-full bg-red-500',
      isPaused ? 'animate-none' : 'animate-pulse'
    )} />
    <span className="text-lg font-mono font-bold text-red-700">
      {formatDuration(recordingTime)}
    </span>
  </div>
)}
```

**Audio Playback na opname**:
- **Playback controls**: Play/pause button + native audio controls
- **Audio URL management**: Automatische cleanup via `useEffect`
- **Visual container**: Mint-gekleurde container met border

**File Upload Alternatief**:
- **Drag & drop zone**: Dashed border styling
- **File type validation**: `!file.type.startsWith('audio/')`
- **Size limits**: Standard browser limits
- **Reset functionality**: `event.target.value = ''`

**Manual Notes Input**:
- **Concurrent typing**: Tijdens opname mogelijk
- **Real-time updates**: Direct state synchronization
- **Content combination**: Beide inputs worden gecombineerd in processing

**Processing Trigger**:
- **Button state**: "Verwerk in SOEP" 
- **Enable conditions**: `audioBlob || manualNotes.trim()`
- **Disable conditions**: `isRecording || isProcessingSOEP`
- **Visual feedback**: Spinner + "SOEP wordt verwerkt..."

**Interacties in Stap 2**:

1. **Audio Recording** (`useAudioRecorder` hook):
   - **Start**: `recorderControls.startRecording()`
   - **Stop**: `recorderControls.stopRecording()`  
   - **Pause/Resume**: Toggle via `recorderControls.pauseRecording/resumeRecording()`
   - **Completion callback**: Auto-URL creation, state updates

2. **File Upload** (`handleFileUpload`):
   - **Validation**: Audio type + reasonable size
   - **State updates**: `setAudioBlob(file)`, URL creation
   - **UI reset**: Input field clearing

3. **SOEP Processing** (`processSOEP`):

**Proces flow**:
```typescript
// 1. Validation
if (!audioBlob && !manualNotes.trim()) {
  setError('Maak een audio-opname of voer handmatige notities in');
  return;
}

// 2. Transcription (if audio exists)
if (audioBlob) {
  const transcribeResult = await transcribeAudio(audioBlob, {
    language: 'nl',
    prompt: 'Vervolgconsult fysiotherapie volgens SOEP methode'
  });
}

// 3. Content Combination
const combinedInput = [transcriptionText, manualNotes].filter(Boolean).join('\n\n');

// 4. SOEP Structuring API Call
const systemPrompt = `Je bent een ervaren fysiotherapeut die vervolgconsult transcripties structureert volgens de SOEP methode`;

// 5. Response Parsing
const soepStructure: SOEPStructure = {
  subjective: extractSOEPSection(response.data.content, 'Subjectief'),
  objective: extractSOEPSection(response.data.content, 'Objectief'), 
  evaluation: extractSOEPSection(response.data.content, 'Evaluatie'),
  plan: extractSOEPSection(response.data.content, 'Plan'),
  redFlags: extractRedFlags(response.data.content),
  fullStructuredText: response.data.content
};
```

**API Calls in Stap 2**:
- **Transcription**: `transcribeAudio(blob, options)` met Nederlandse SOEP prompt
- **SOEP Structuring**: `apiCall(API_ENDPOINTS.GENERATE_CONTENT)` met gespecialiseerde system prompt

**Parsing Logic**:
```typescript
// SOEP Section Extraction
const extractSOEPSection = (content: string, sectionName: string): string => {
  const regex = new RegExp(`(?:^|\\n)\\*?\\*?${sectionName}[^\\n]*:?\\*?\\*?\\s*\\n([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][^\\n]*:?\\*?\\*?|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
};

// Red Flags Extraction  
const extractRedFlags = (content: string): string[] => {
  const redFlagSection = extractSOEPSection(content, 'rode vlagen');
  return redFlagSection
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0);
};
```

### Stap 3: Resultaat & Directe Acties

**Doel**: SOEP-documentatie presenteren met directe actie mogelijkheden.

**State na processing**:
- `soepResult: SOEPStructure` (volledig gevuld)
- `isProcessingSOEP: false`
- UI toont resultaat sectie

**UI Transformation - SOEP Result Section**:

**Container**: `Card` met groene styling (`border-2 border-green-200 bg-green-50/50`)

**Header**:
- **Titel**: "SOEP Documentatie Gereed" met FileText icon
- **Beschrijving**: "Uw consult is succesvol verwerkt volgens de SOEP-methode"

**Content Display**:
```tsx
<div className="bg-white p-4 rounded-lg border border-green-200">
  <div className="flex justify-between items-start mb-2">
    <h4 className="font-medium text-green-800">Gestructureerde SOEP</h4>
    <div className="flex items-center gap-2">
      <Button onClick={handleExportSOEP}>Export</Button>
      <CopyToClipboard text={soepResult.fullStructuredText} />
    </div>
  </div>
  <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed">
    {soepResult.fullStructuredText.length > 500 
      ? `${soepResult.fullStructuredText.substring(0, 500)}...`
      : soepResult.fullStructuredText
    }
  </pre>
</div>
```

**Action Buttons**:
1. **"Bekijk Volledige SOEP"** (primair):
   - **Functie**: `viewSOEPResult()` 
   - **Actie**: `onComplete(soepResult)` → navigatie naar `SOEPResultPage`
   - **Styling**: Primary button, full-width in flex container

2. **"Nieuw Consult"** (secondary):
   - **Functie**: Complete state reset
   - **Acties**:
     - `setSOEPResult(null)`
     - `setAudioBlob(null)` + URL cleanup
     - `setManualNotes('')`
     - `setRecordingTime(0)`

**Export Functionality**:
```typescript
const handleExportSOEP = async () => {
  const { SOEPExporter } = await import('@/lib/utils/soep-export');
  
  await SOEPExporter.exportAndDownload({
    patientInfo,
    soepData: soepResult,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, 'html');
};
```

**Interacties in Stap 3**:

1. **Copy to Clipboard**: 
   - Via `CopyToClipboard` component
   - Volledige SOEP text in geformatteerde structuur

2. **Export Document**:
   - **Lazy loading**: Dynamic import van export utilities
   - **Format**: HTML export voor EPD compatibiliteit
   - **Data**: Complete patiënt info + SOEP structuur + timestamps

3. **View Full SOEP**: 
   - **Navigatie**: Naar dedicated `SOEPResultPage`
   - **Data transfer**: Via `onComplete(soepResult)` callback
   - **Context**: Behoud van patiënt informatie

4. **Reset for New Consult**:
   - **Complete cleanup**: Alle audio en text data
   - **Memory management**: URL.revokeObjectURL voor audio
   - **UI reset**: Terug naar stap 1 state

### Stap 4: Gedetailleerde SOEP Review (SOEPResultPage)

**Doel**: Volledige SOEP-documentatie reviewen, bewerken en finaliseren.

**Component**: `SOEPResultPage` (`src/components/scribe/soep-result-page.tsx`)

**State bij binnenkomst**:
```typescript
const [editableSOEP, setEditableSOEP] = useState<SOEPStructure>(soepData);
const [isEditing, setIsEditing] = useState(false);
const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
const [hasChanges, setHasChanges] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
```

**UI Layout - Sectioned SOEP Display**:

**SOEP Sections Configuration**:
```typescript
const soepSections: SOEPSection[] = [
  {
    id: 'subjective',
    title: 'Subjectief (S)',
    description: 'Wat de patiënt vertelt - klachten, ervaringen, gevoelens',
    icon: User,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'objective', 
    title: 'Objectief (O)',
    description: 'Wat u observeert en meet - bevindingen, tests, metingen',
    icon: Eye,
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  // ... etc voor Evaluatie en Plan
];
```

**Per-Section Display**:
- **Collapsible cards** per SOEP sectie
- **Color-coded**: Elke sectie heeft eigen kleurschema
- **Edit mode**: Inline editing via `Textarea`
- **Copy functionality**: Per sectie én volledig document
- **Visual indicators**: Icons per sectie type

**Global Actions**:
- **Edit Toggle**: Schakel tussen view en edit mode
- **Save Changes**: Persistent storage van wijzigingen  
- **Export Options**: Multiple formats (PDF, HTML, plain text)
- **View Modal**: Full-screen SOEP weergave
- **Back Navigation**: Terug naar workflow

**Interacties in Stap 4**:

1. **Section Editing**:
   - **Inline editing**: Click-to-edit per SOEP sectie
   - **Auto-save**: Real-time state updates
   - **Change tracking**: `hasChanges` state monitoring

2. **Collapse/Expand**:
   - **State management**: `collapsedSections` Set voor efficiëntie
   - **Persistence**: UI state behoud tijdens edits

3. **Copy Operations**:
   - **Per-section copy**: Individuele SOEP secties
   - **Full document copy**: Complete gestructureerde output
   - **Format options**: Plain text vs. geformatteerd

4. **Export & Finalization**:
   - **Export formats**: HTML, PDF export opties
   - **EPD Integration**: Formatted output voor EPD systemen
   - **Final callback**: `onComplete(editedSoepData)` voor workflow completion

**Final Completion Flow**:
```typescript
const handleSOEPResultComplete = (editedSoepData: SOEPStructure) => {
  // Create FollowupData object  
  const followupData: FollowupData = {
    patientInfo: patientInfo!,
    sessionPreparation: '',
    soepRecording: null,
    soepTranscript: '',
    soepStructure: editedSoepData,
    // ... additional fields
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  handleWorkflowComplete(followupData);
};
```

## 3. State Management Overzicht

### Primary State Variables

**Session Management**:
```typescript
const [sessionPreparation, setSessionPreparation] = useState<string>('');
const [isGeneratingPreparation, setIsGeneratingPreparation] = useState(false);
```

**Audio Recording State**:
```typescript
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [audioUrl, setAudioUrl] = useState<string | null>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
```

**Manual Input State**:
```typescript
const [manualNotes, setManualNotes] = useState('');
```

**Processing State**:
```typescript
const [isProcessingSOEP, setIsProcessingSOEP] = useState(false);
const [soepResult, setSOEPResult] = useState<SOEPStructure | null>(null);
```

**Error Handling**:
```typescript
const [error, setError] = useState<string | null>(null);
```

**Audio Recorder Integration**:
```typescript
const [recorderState, recorderControls] = useAudioRecorder({
  onRecordingComplete: (blob, duration) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  },
  onError: (error) => setError(error),
  maxDuration: 1800000, // 30 minutes
});
```

### State Flow & Data Management

**Linear Flow Pattern**:
1. **Initialization** → Prep Generation (optional)
2. **Audio/Text Input** → Combined data collection  
3. **Processing** → SOEP structure generation
4. **Results** → Display + immediate actions
5. **Detail Review** → Full edit capability

**Memory Management**:
- **Audio URL cleanup**: Automatic URL.revokeObjectURL in useEffect cleanup
- **Blob management**: Explicit state clearing on reset
- **Timer cleanup**: Interval clearing to prevent memory leaks

**Error States**:
- **API errors**: Per-operation error handling with user feedback
- **Validation errors**: Input validation with clear messaging
- **Recovery**: Clear error state on successful operations

## 4. Component Architecture

### Primary Components

**StreamlinedFollowupWorkflow** (Main):
- **Responsibility**: Complete workflow orchestration
- **State Management**: All primary state variables
- **API Integration**: Transcription + SOEP generation
- **UI Layout**: Two-panel responsive design

**SOEPResultPage** (Detail View):
- **Responsibility**: Detailed SOEP review and editing
- **State Management**: Editing states + UI preferences
- **Export Integration**: Multiple format exports
- **Navigation**: Back to workflow + completion

### Reusable Components

**useAudioRecorder Hook**:
- **Custom hook**: Encapsulates recording logic
- **Configuration**: Max duration, error handling, completion callbacks
- **State exposure**: `isRecording`, `isPaused` states
- **Controls**: Start, stop, pause, resume methods

**CopyToClipboard**:
- **Utility component**: Consistent copy functionality
- **Usage**: Per-section and full-document copying
- **Feedback**: Visual confirmation of copy action

**Format Utilities**:
- `formatDuration(milliseconds)`: Human-readable time format
- **Export utilities**: Lazy-loaded for performance
- **SOEP formatting**: Structured output generation

## 5. API Integration & Data Processing

### API Endpoints

**Session Preparation**:
- **Endpoint**: `API_ENDPOINTS.GENERATE_CONTENT`
- **Method**: POST  
- **Payload**: System prompt + user prompt with patient context
- **Model**: GPT-4o with temperature 0.7 voor creativity
- **Max tokens**: 1200 voor complete preparation

**Audio Transcription**:
- **Function**: `transcribeAudio(blob, options)`
- **Options**: 
  - `language: 'nl'`
  - `prompt: 'Vervolgconsult fysiotherapie volgens SOEP methode'`
  - `temperature: 0.0` voor accuracy

**SOEP Processing**:  
- **Endpoint**: `API_ENDPOINTS.GENERATE_CONTENT`
- **Method**: POST
- **Model**: GPT-4o with temperature 0.6 (balanced creativity/accuracy)
- **Max tokens**: 2000 voor complete SOEP structure

### Data Structures

**SOEPStructure** (Core Data Model):
```typescript
interface SOEPStructure {
  subjective: string;        // S - Wat de patiënt zegt
  objective: string;         // O - Wat je observeert/meet  
  evaluation: string;        // E - Je analyse/interpretatie
  plan: string;              // P - Behandelplan/actieplan
  redFlags: string[];        // Geïdentificeerde rode vlagen
  fullStructuredText: string; // Complete geformatteerde tekst
}
```

**FollowupData** (Final Output):
```typescript
interface FollowupData {
  patientInfo: PatientInfo;
  sessionPreparation: string;
  soepRecording: AudioRecording | null;
  soepTranscript: string;
  soepStructure: SOEPStructure;
  progressEvaluation: string;
  treatmentAdjustments: string; 
  nextSessionPlan: string;
  homeExercises: string;
  patientEducation: string;
  redFlags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Content Processing Pipeline

**Input Aggregation**:
```typescript
// Combine all input sources
const combinedInput = [transcriptionText, manualNotes]
  .filter(Boolean)
  .join('\n\n');
```

**Context Enrichment**:
```typescript  
// Add patient context to processing
const userPrompt = `Vervolgconsult informatie:
${combinedInput}

Patiënt: ${patientInfo.initials}, ${age} jaar, ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}`;
```

**Structured Output Parsing**:
- **Regex-based extraction**: Per SOEP sectie parsing
- **Fallback handling**: Empty string defaults voor missing secties  
- **Red flags extraction**: Special processing voor safety indicators

## 6. User Experience & Performance

### Performance Optimizations

**Lazy Loading**:
```typescript
// Export utilities loaded on-demand
const { SOEPExporter } = await import('@/lib/utils/soep-export');
```

**Memory Management**:
- **Audio URL cleanup**: Prevents memory leaks
- **State resets**: Complete cleanup on new consult
- **Timer management**: Proper interval cleanup

**Loading States**:
- **Granular feedback**: Per-operation loading indicators
- **Non-blocking UI**: Async operations don't freeze interface
- **Progress indication**: Timer during recording, spinner during processing

### User Experience Features

**"Opnemen, Stoppen, Klaar" Philosophy**:
- **Minimal clicks**: Start recording → Stop → Process → Done
- **Concurrent input**: Audio + manual notes simultaneously  
- **Immediate results**: Direct SOEP generation after processing

**Error Recovery**:
- **Graceful degradation**: Manual notes if audio fails
- **Clear messaging**: Specific error messages met actionable advice
- **Retry mechanisms**: Re-generate preparation, re-process SOEP

**Responsive Design**:
- **Two-panel layout**: Adapts to screen sizes
- **Touch-friendly**: Large buttons, adequate spacing
- **Mobile optimization**: Vertical stacking on small screens

### Accessibility Features

**Audio Interface**:
- **Visual feedback**: Timer, status indicators tijdens recording
- **Alternative input**: Manual notes als audio niet beschikbaar
- **Playback controls**: Review recorded audio before processing

**Content Display**:
- **High contrast**: Green success states, clear section boundaries
- **Readable typography**: Font-inter voor medical content
- **Structured layout**: Duidelijke content hierarchy

## 7. Integration with Main Application

### Navigation Flow

**Entry Point**: Via `ScribePage` component
- **Session Type Selection** → "Followup" → **Patient Info** → **StreamlinedFollowupWorkflow**

**Exit Points**:
- **Back**: Return to patient info (`onBack` callback)
- **Complete**: Navigate to completion screen via `onComplete`

**State Management Integration**:
- **Session persistence**: Via parent `useSessionState` hook
- **Auto-save**: Session data maintained during workflow
- **Recovery**: Resume interrupted sessions

### Data Flow Integration

**Input**: `PatientInfo` from patient form
**Output**: `SOEPStructure` → converted to `FollowupData` → completion callback

**Parent Component Handling**:
```typescript
// In ScribePage.tsx  
const handleSOEPComplete = (soepData: SOEPStructure) => {
  setSOEPResultData(soepData);
  setCurrentStep('soep-result'); // Navigate to detail view
};

const handleSOEPResultComplete = (editedSoepData: SOEPStructure) => {
  const followupData: FollowupData = { /* conversion logic */ };
  handleWorkflowComplete(followupData); // Final completion
};
```

### Session Management

**Auto-Save Integration**:
- **Session state**: Managed by parent `useSessionState` hook
- **Persistence**: 30-second intervals voor data backup
- **Recovery**: Resume capability na unexpected interruption

**Completion Tracking**:
- **Duration**: Session timing via parent state
- **Status**: Active/paused/completed states
- **Metadata**: Timestamps, session type, completion status

## 8. Technical Implementation Details

### Code Organization

**Single Responsibility**:
- **StreamlinedFollowupWorkflow**: Workflow orchestration + data collection
- **SOEPResultPage**: Data presentation + editing
- **useAudioRecorder**: Audio recording abstraction

**Error Boundary Integration**:
- **Component-level**: Individual error states per operation
- **Global fallback**: Parent error boundary voor catastrophic failures

**Type Safety**:
- **Comprehensive interfaces**: All data structures fully typed
- **Runtime validation**: API response validation
- **Null safety**: Careful null/undefined handling

### Known Issues & Limitations

**Minor Bug** (Line 689 in StreamlinedFollowupWorkflow):
```typescript  
// Undefined variable reference
setTranscription(''); // Should be removed or properly defined
```

**API Dependencies**:
- **External services**: Transcription en content generation services
- **Rate limiting**: No built-in rate limiting voor API calls
- **Offline capability**: No offline mode voor audio processing

**Browser Compatibility**:
- **Audio recording**: Requires getUserMedia API support
- **File handling**: Modern File API requirements
- **Audio playback**: Standard HTML5 audio support needed

## 9. Future Enhancements

### Planned Improvements

**Enhanced Audio Processing**:
- **Noise reduction**: Pre-processing voor beter transcription
- **Speaker identification**: Multi-speaker scenario support
- **Audio quality validation**: Check opname quality before processing

**SOEP Template Customization**:
- **Personalized templates**: Per-therapist SOEP formatting preferences  
- **Specialty modifications**: Specialized templates voor verschillende fysiotherapie specialismen
- **Organizational branding**: Custom headers, footers, formatting

**Integration Capabilities**:
- **Direct EPD integration**: API connections naar major EPD systems
- **FHIR compatibility**: Healthcare data exchange standards
- **Voice commands**: Hands-free operation durante consult

Dit document definieert de complete technische architectuur en gebruikerservaring van de Hysio Consult Workflow en dient als definitieve referentie voor alle stakeholders die het systeem begrijpen of ermee werken.