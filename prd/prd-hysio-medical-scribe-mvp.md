# PRD: Hysio Medical Scribe MVP

## 1. Introduction/Overview

Hysio Medical Scribe is an AI-driven digital assistant specifically designed to support physiotherapists throughout their entire clinical workflow. The system functions as an intelligent, collaborative assistant that listens during both intake sessions and follow-up appointments, structures information, and generates comprehensive documentation.

The core problem this feature solves is the overwhelming administrative burden facing physiotherapists, who currently spend 30-40% of their working time on documentation and administrative tasks. This precious time should be dedicated to patient care, professional development, and practice growth.

**Goal**: Reduce administrative workload by up to 70% while improving the consistency and completeness of clinical documentation, allowing therapists to focus on what matters most - quality patient care.

## 2. Goals

1. **Primary Goal**: Automate 70% of documentation tasks for physiotherapy intakes and follow-up sessions
2. **Quality Goal**: Generate structured, complete reports that comply with Dutch physiotherapy guidelines (KNGF, DTF)
3. **Efficiency Goal**: Reduce documentation time from hours to minutes per session
4. **User Experience Goal**: Provide an intuitive, non-intrusive interface that enhances rather than disrupts the therapeutic process
5. **Compliance Goal**: Ensure all generated documentation meets professional standards and regulatory requirements

## 3. User Stories

### Primary User: Physiotherapist

**As a physiotherapist conducting a new patient intake, I want to:**
- Generate intake preparation questions and hypotheses before the patient arrives
- Have the system listen and automatically structure my anamnesis conversation into a professional PHSB format
- Receive personalized examination suggestions based on the anamnesis findings
- Get AI-generated diagnostic suggestions and clinical conclusions
- Export complete documentation directly to my EPD system

**As a physiotherapist during follow-up sessions, I want to:**
- Quickly document progress using the SOEP format without manual typing
- Access clinical knowledge through an AI assistant while treating patients
- Generate session reports that I can immediately copy to my patient management system

**As a practice owner, I want to:**
- Ensure consistent documentation quality across all therapists in my practice
- Reduce the time therapists spend on evening documentation
- Maintain complete audit trails for professional liability and quality assurance

### Secondary User: Patient

**As a patient, I want to:**
- Feel that my therapist is fully focused on me during sessions, not on typing notes
- Receive clear, structured information about my condition and treatment plan
- Have confidence that my information is accurately captured and professionally documented

## 4. Functional Requirements

### 4.1 Session Management
1. The system must allow users to choose between "New Intake" and "Follow-up Session" workflows
2. The system must capture basic patient information (first name, age, gender, main complaint)
3. The system must maintain session history with timestamps and status tracking
4. The system must support session resumption if interrupted

### 4.2 Intake Workflow (5-Step Process)

**Step 1: Pre-session Preparation**
5. The system must generate intake preparation based on basic patient data including:
   - Working hypothesis (probable diagnosis)
   - Differential diagnoses list
   - Targeted anamnesis questions following LOFTIG framework (Location, Onset, Frequency, Timeline, Intensity, Change)
   - Red flag screening questions specific to the complaint region (DTF protocol)

**Step 2: Anamnesis Recording and Processing**
6. The system must provide live audio recording with pause/stop functionality
7. The system must transcribe speech to text using ASR technology (OpenAI Whisper or equivalent)
8. The system must allow manual text input alongside voice recording
9. The system must generate structured PHSB anamnesis summary:
   - P (Patient Problem/Help Question)
   - H (History)
   - S (Disorders in body function and anatomy)
   - B (Limitations in activities or participation)
10. The system must highlight and flag any red flag indicators mentioned during anamnesis

**Step 3: Examination Planning**
11. The system must automatically generate personalized examination proposals based on anamnesis findings
12. The system must suggest specific orthopedic tests with rationale and test characteristics
13. The system must recommend relevant clinical measurements and assessments

**Step 4: Physical Examination Documentation**
14. The system must record examination findings through voice input
15. The system must process examination results and integrate with anamnesis data

**Step 5: Analysis and Clinical Conclusion**
16. The system must generate diagnostic suggestions with probability assessments
17. The system must provide differential diagnosis considerations
18. The system must create comprehensive clinical conclusion including:
    - Summary of key findings
    - Working diagnosis
    - Treatment indication assessment
    - Prognosis and evaluation timeline

### 4.3 Follow-up Session Workflow (SOEP Format)
19. The system must provide simplified interface for follow-up appointments
20. The system must automatically structure session content into SOEP format:
    - S (Subjective): Patient-reported progress and symptoms
    - O (Objective): Therapist observations and measurements
    - E (Evaluation): Progress assessment and clinical reasoning
    - P (Plan): Treatment adjustments and next steps

### 4.4 AI Assistant Integration
21. The system must provide integrated AI assistant for clinical queries during sessions
22. The assistant must be subtly present during intakes (small panel) and prominent during follow-up sessions
23. The system must support domain-specific physiotherapy knowledge queries
24. The assistant must provide evidence-based answers with source references when available

### 4.5 User Interface and Experience
25. The system must display a two-panel interface:
    - Left panel: Structured output and context information
    - Right panel: Input controls (microphone, text chat, AI assistant)
26. The system must provide collapsible sections for each output component
27. The system must allow inline editing of all generated content
28. The system must provide one-click copy functionality for each section

### 4.6 Data Management and Export
29. The system must save all session data automatically during workflow
30. The system must provide session history with search and filter capabilities
31. The system must support copy-to-clipboard functionality for EPD integration
32. The system must offer document export in common formats (PDF, Word)
33. The system must maintain data integrity with automatic backup during sessions

### 4.7 Audio Processing
34. The system must support live audio recording up to 60 minutes per session
35. The system must provide audio file upload capability for offline recordings
36. The system must handle audio processing interruptions gracefully
37. The system must provide visual feedback during recording (timer, status indicators)

## 5. Non-Goals (Out of Scope)

**For MVP Release:**
- Direct EPD integration via official APIs (manual copy-paste suffices for MVP)
- Mobile applications (iOS/Android) - web-responsive interface only
- Multi-language support beyond Dutch
- Red Flag Notice automated alerting system (basic detection and highlighting only)
- Patient communication modules (Edu-Pack, SmartMail)
- Advanced analytics and reporting dashboards
- Peer review and collaboration features
- Advanced treatment planning automation (Hysio Intervention)
- Real-time transcription display (batch processing after stop is acceptable)

## 6. Design Considerations

### 6.1 User Interface Design
- **Two-panel layout**: Left panel for structured output, right panel for input controls
- **Minimalist approach**: Clean, distraction-free interface following Hysio brand guidelines
- **Visual hierarchy**: Clear distinction between different workflow phases
- **Accessibility**: Compliance with WCAG 2.1 AA standards
- **Brand consistency**: Implementation of Hysio visual identity (mint green accents, Inter typography)

### 6.2 Workflow Design
- **Sequential but flexible**: Users can pause, add notes, and resume at any point
- **Context-aware**: UI adapts based on current workflow stage
- **Non-intrusive**: System operates in background during patient interaction
- **Therapist control**: All AI suggestions require human review and approval

### 6.3 Content and Language
- **Dutch language focus**: All interfaces and outputs in Dutch
- **Professional terminology**: Adherence to KNGF standards and physiotherapy conventions
- **B1 reading level**: Clear, accessible language for all user interfaces
- **Evidence-based content**: All suggestions based on current physiotherapy guidelines

## 7. Technical Considerations

### 7.1 Architecture Requirements
- **Web-based application**: Desktop-oriented interface integrated with Hysio platform
- **Modular design**: Architecture supports future feature additions
- **API-first approach**: All functionality available via REST endpoints for future integrations

### 7.2 AI and Machine Learning
- **Speech Recognition**: Integration with OpenAI Whisper API or Groq Whisper Large v3 Turbo
- **Language Model**: GPT-4 or equivalent for text generation and analysis
- **Domain Training**: System prompts optimized for physiotherapy workflow and Dutch medical terminology
- **Fallback Handling**: Graceful degradation when AI services are unavailable

### 7.3 Data Storage and Security
- **Session Management**: Secure server-side database for session persistence
- **User Isolation**: Data segregation ensuring therapists only access their own sessions
- **Audit Logging**: Complete activity logging for professional compliance
- **Data Retention**: Configurable data retention policies per practice requirements

### 7.4 Performance Requirements
- **Response Time**: AI processing completed within 5 seconds for typical inputs
- **Availability**: 99.5% uptime during business hours
- **Concurrent Users**: Support for 100+ simultaneous sessions
- **Audio Processing**: Support for audio files up to 1 hour duration

### 7.5 Integration Considerations
- **EPD Compatibility**: Export formats compatible with major Dutch physiotherapy EPDs
- **Authentication**: Integration with existing Hysio platform authentication
- **Future-Proofing**: Database schema supports planned feature extensions

## 8. Success Metrics

### 8.1 Primary Success Metrics
- **Time Savings**: 70% reduction in documentation time per session
- **User Adoption**: 80% of active Hysio Pro users engage with Medical Scribe within first month
- **Completion Rate**: 90% of started sessions reach completion
- **User Satisfaction**: Net Promoter Score (NPS) > 50 from physiotherapist users

### 8.2 Quality Metrics  
- **Documentation Quality**: 95% of generated reports require minimal manual editing
- **Clinical Accuracy**: AI suggestions align with professional assessment in 85% of cases
- **Error Rate**: < 5% of sessions experience technical issues or data loss
- **Compliance**: 100% of generated documents meet KNGF documentation standards

### 8.3 Engagement Metrics
- **Session Volume**: Average 15+ sessions per active user per month
- **Feature Utilization**: 80% usage rate for core features (voice recording, PHSB generation, SOEP creation)
- **Return Usage**: 90% of users who complete onboarding use the system regularly (>3 times/week)

### 8.4 Business Impact Metrics
- **Practice Efficiency**: Participating practices report 20% increase in patient appointment capacity
- **User Retention**: 85% monthly active user retention rate
- **Revenue Impact**: Medical Scribe users show 30% higher platform engagement than non-users

## 9. Open Questions

### 9.1 Technical Questions
1. **Audio Quality Requirements**: What minimum audio quality standards should be enforced for reliable transcription?
2. **Offline Capability**: Should the system support limited offline functionality for locations with poor internet connectivity?
3. **Integration Testing**: How will we test compatibility with major Dutch EPD systems during development?
4. **Performance Scaling**: What infrastructure scaling strategy will handle peak usage periods?

### 9.2 User Experience Questions
5. **Onboarding Strategy**: What is the optimal onboarding flow to ensure rapid user adoption?
6. **Error Handling**: How should the system communicate AI processing failures to users without disrupting patient care?
7. **Customization Level**: How much personalization should be allowed in AI prompt behavior per user preferences?

### 9.3 Compliance and Legal Questions
8. **GDPR Compliance**: What specific data handling procedures are required for patient information in AI processing?
9. **Professional Liability**: How does AI-assisted documentation affect therapist professional responsibility?
10. **Audit Requirements**: What logging and audit trail features are mandatory for healthcare documentation systems?

### 9.4 Business and Product Questions
11. **Pricing Strategy**: How will Medical Scribe pricing integrate with existing Hysio Pro subscription tiers?
12. **Market Feedback**: What pilot program structure will provide optimal user feedback during development?
13. **Success Criteria**: What minimum viable success metrics will justify proceeding to full feature rollout?
14. **Feature Prioritization**: Which advanced features (Red Flag Notice, Edu-Pack integration) should be prioritized for post-MVP development?

---

*This PRD serves as the foundation for developing Hysio Medical Scribe MVP. All requirements should be validated through user research and technical feasibility assessment before implementation begins.*