# Implementatie van de Nieuwe Hysio Intake Workflow - Task List

## Relevant Files

- `src/components/scribe/intake-workflow.tsx` - Current implementation of the intake workflow that needs to be refactored according to the new PRD requirements
- `src/components/scribe/patient-info-form.tsx` - Basic patient info form that needs modification for the new initial preparation form
- `src/components/ui/audio-recorder.tsx` - Audio recording component that will be used in the input panels
- `src/components/assistant/assistant-integration.tsx` - Hysio Assistant chat component for the collapsible assistant in input panels
- `src/components/ui/collapsible-section.tsx` - Used for collapsible sections in the guidance panels
- `src/lib/utils/session-export.tsx` - Export functionality for the final clinical conclusion
- `src/app/scribe/page.tsx` - Main scribe page that orchestrates the workflow
- `src/components/scribe/intake-workflow.test.tsx` - Unit tests for the intake workflow component
- `src/components/ui/two-panel-layout.tsx` - New component for the consistent two-panel interface (needs creation)
- `src/components/ui/input-panel.tsx` - Reusable input panel component (needs creation)

### Notes

- The current implementation uses a single-page stepper approach but needs to be refactored to use the three-phase approach with distinct two-panel layouts
- Export functionality already exists but needs to ensure anonymous output
- Audio recording and transcription infrastructure is already in place

## Tasks

- [x] 1.0 Create Initial Patient Preparation Form
  - [x] 1.1 Modify patient-info-form.tsx to collect simplified data (voorletter, geboortejaar, geslacht man/vrouw, hoofdklacht)
  - [x] 1.2 Update form validation to use new simplified fields
  - [x] 1.3 Create modal/popup presentation for the initial form
  - [x] 1.4 Add form submission handler that triggers the main workflow
  - [x] 1.5 Test the simplified patient form integration

- [x] 2.0 Build Phase 1: Anamnese Two-Panel Interface
  - [x] 2.1 Create reusable TwoPanelLayout component with left guidance panel and right input panel
  - [x] 2.2 Create reusable InputPanel component with Live Recorder, Audio Upload, Manual Input, and collapsible Hysio Assistant
  - [x] 2.3 Build left panel "Genereer Intakevoorbereiding" button and AI preparation display logic
  - [x] 2.4 Implement "Verwerk Anamnese" functionality to replace left panel with PHSB card
  - [x] 2.5 Create collapsible sections for PHSB card with copy-to-clipboard functionality
  - [x] 2.6 Add navigation button "Ga naar Onderzoek" when anamnese is complete
  - [x] 2.7 Make preparation collapsible under PHSB results as specified

- [x] 3.0 Build Phase 2: Physical Examination Two-Panel Interface  
  - [x] 3.1 Create identical two-panel interface for examination phase using same TwoPanelLayout
  - [x] 3.2 Reuse InputPanel component with same audio/text input functionality
  - [x] 3.3 Implement left panel "Genereer Onderzoeksvoorstel" button and AI examination proposal display
  - [x] 3.4 Build "Verwerk Onderzoek" functionality to replace left panel with examination conclusion
  - [x] 3.5 Make examination proposal collapsible under examination results
  - [x] 3.6 Add navigation button "Ga naar Klinische Conclusie" when examination is complete

- [x] 4.0 Create Phase 3: Full-Screen Clinical Conclusion
  - [x] 4.1 Design full-screen single panel layout breaking away from two-panel approach
  - [x] 4.2 Combine anamnese and examination data to generate comprehensive clinical conclusion
  - [x] 4.3 Create professional layout for displaying complete clinical conclusion
  - [x] 4.4 Add prominent "Exporteer als Word" and "Exporteer als PDF" buttons
  - [x] 4.5 Implement auto-generation of clinical conclusion when phase 3 loads

- [x] 5.0 Integrate Export Functionality and Anonymous Output
  - [x] 5.1 Modify session export to ensure complete anonymization (no personal data, addresses, etc.)
  - [x] 5.2 Include generated anamnese card, examination conclusion, and clinical conclusion in export
  - [x] 5.3 Exclude raw transcriptions from export, only include structured results
  - [x] 5.4 Test PDF export functionality with anonymous professional formatting
  - [x] 5.5 Test Word export functionality with anonymous professional formatting
  - [x] 5.6 Verify export contains all necessary clinical information without patient identifiers