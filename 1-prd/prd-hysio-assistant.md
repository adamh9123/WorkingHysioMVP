# Product Requirements Document: Hysio Assistant

## 1. Introduction/Overview

Hysio Assistant is an AI-powered chat co-pilot specifically designed for physiotherapists in the Netherlands. It serves as an intelligent knowledge base and sparring partner that supports licensed physiotherapists in clinical reasoning, guideline consultation, and structured thinking. The assistant integrates seamlessly into the Hysio Medical Scribe platform while also functioning as a standalone chat interface.

**Problem Statement:** Physiotherapists need quick access to evidence-informed information, clinical reasoning support, and structured guidance during their practice, but existing solutions are either too generic or lack integration with their workflow.

**Goal:** Provide physiotherapists with instant, contextual AI support that enhances their clinical decision-making while maintaining safety boundaries and professional standards.

## 2. Goals

1. **Speed**: Provide immediate answers to clinical and professional questions
2. **Consistency**: Deliver evidence-informed information aligned with Dutch physiotherapy standards (KNGF guidelines)
3. **Safety**: Function as advisory support without replacing clinical decision-making
4. **Integration**: Seamless integration into existing Hysio Medical Scribe workflow
5. **User Experience**: Intuitive chat interface following Hysio brand guidelines
6. **Compliance**: Full GDPR compliance with mandatory clinical disclaimers

## 3. User Stories

### Primary User Stories
1. **As a licensed physiotherapist**, I want to quickly ask clinical questions during patient consultations so that I can make more informed decisions without interrupting my workflow.

2. **As a practice owner**, I want my team to have consistent access to evidence-based information so that our practice maintains high standards across all therapists.

3. **As a student physiotherapist**, I want to learn from AI-guided clinical reasoning so that I can develop my professional skills under supervision.

4. **As a physiotherapist during intake**, I want to consult the assistant about differential diagnoses so that I can structure my examination more effectively.

5. **As a therapist writing patient education**, I want to generate clear, simple explanations so that I can improve patient understanding and compliance.

## 4. Functional Requirements

### 4.1 Core Chat Functionality
1. The system must provide a real-time chat interface powered by OpenAI GPT-4o
2. The system must maintain conversation context within a session
3. The system must support markdown formatting in responses (headers, lists, bold text)
4. The system must implement streaming responses for real-time user experience
5. The system must save conversation history per user with option to delete

### 4.2 System Prompt & AI Behavior
6. The system must use the specified Hysio Assistant system prompt for all interactions
7. The system must automatically append the mandatory disclaimer "**Altijd nazien door een bevoegd fysiotherapeut.**" to all clinical responses
8. The system must refuse unsafe, illegal, or unethical requests
9. The system must prioritize anonymized patient information and GDPR compliance
10. The system must provide evidence-informed responses specific to Dutch physiotherapy context

### 4.3 Standalone Chat Interface
11. The system must provide a dedicated `/assistant` route accessible from main navigation
12. The system must display a sidebar with "New Conversation" button and conversation history
13. The system must show an empty state with welcome message and 4 example questions:
    - "Wat zijn de rode vlaggen bij lage rugpijn?"
    - "Differentiaaldiagnose anterieure kniepijn hardloper 25 jaar"
    - "Uitleg SAPS voor patiënt"
    - "Behandelopties subacromiaal pijnsyndroom"
14. The system must display user messages right-aligned and AI responses left-aligned with Hysio avatar
15. The system must provide a textarea input with "Stel je vraag aan Hysio Assistant..." placeholder
16. The system must include a send button with arrow icon in Sky 500 (#0EA5E9) accent color

### 4.4 Medical Scribe Integration
17. The system must integrate as a collapsible component in the right panel of Medical Scribe
18. The system must appear below the notes chatbox and microphone controls
19. The system must remain collapsed by default during intake workflows
20. The system must be expandable during normal consultations
21. The system must maintain complete separation from medical record generation (SOEP/PHSB)
22. The system must be accessible throughout all Medical Scribe workflow steps (preparation, anamnesis, examination planning, physical examination, conclusion)

### 4.5 Design & Branding
23. The system must follow Hysio brand guidelines with Inter typography
24. The system must use the specified color palette (Off-White background, Deep Green text, Sky 500 accents)
25. The system must implement clean design with rounded corners and adequate whitespace
26. The system must use outline icons with 2px stroke and rounded corners
27. The system must ensure all clinical responses display the mandatory disclaimer prominently

### 4.6 Session & Data Management
28. The system must save conversations to database per authenticated user
29. The system must provide functionality to delete individual conversations
30. The system must not store or request personally identifiable patient information
31. The system must clear conversation context when starting a new conversation

### 4.7 API & Technical Integration
32. The system must integrate with existing Hysio authentication system
33. The system must use OpenAI GPT-4o model exclusively
34. The system must implement proper error handling for API failures
35. The system must provide loading states during AI response generation

## 5. Non-Goals (Out of Scope)

1. **Medical Diagnosis**: The assistant will not provide definitive diagnoses or replace clinical examination
2. **Prescription Authority**: No medication recommendations or medical certificate generation
3. **Patient Data Storage**: No storage of identifiable patient information
4. **External Database Integration**: No PubMed or external research database connectivity (future Hysio Research module)
5. **Voice Integration**: Text-only interface (no voice recognition/synthesis)
6. **Multi-language Support**: Dutch language only for MVP
7. **Advanced Analytics**: No conversation analytics or performance metrics in MVP
8. **Third-party Integrations**: No integration with external EMR systems

## 6. Design Considerations

### 6.1 Brand Compliance
- **Typography**: Inter font family (Regular 400, Semi-Bold 600, Bold 700)
- **Colors**: 
  - Background: Off-White (#F8F8F5)
  - Text: Deep Green 900 (#003728)
  - Primary: Mint (#A5E1C5)
  - Assistant Accent: Sky 500 (#0EA5E9)
- **Layout**: Clean, minimalist design with generous whitespace

### 6.2 User Experience
- **Responsive Design**: Must work on desktop and tablet devices
- **Accessibility**: Keyboard navigation and screen reader compatibility
- **Performance**: Sub-3-second response times for chat interactions
- **Visual Hierarchy**: Clear distinction between user and AI messages

## 7. Technical Considerations

### 7.1 Architecture
- **Frontend**: React/TypeScript components integrated into existing Hysio codebase
- **Backend**: Node.js API endpoints for OpenAI integration
- **Database**: Conversation storage using existing Hysio database infrastructure
- **Authentication**: Leverage existing Hysio user management system

### 7.2 Dependencies
- **OpenAI API**: GPT-4o model access with proper API key management
- **Real-time Updates**: WebSocket or Server-Sent Events for streaming responses
- **State Management**: Context management for chat conversations
- **Routing**: Integration with existing Next.js routing system

### 7.3 Security & Compliance
- **GDPR Compliance**: Data processing agreement with OpenAI required
- **PII Filtering**: Backend validation to prevent personal data transmission
- **Rate Limiting**: Prevent API abuse with usage limits per user
- **Audit Logging**: Track usage for compliance and monitoring

## 8. Success Metrics

### 8.1 Usage Metrics
- **Adoption Rate**: 70% of active Hysio users try the assistant within first month
- **Engagement**: Average 5+ messages per conversation session
- **Retention**: 40% of users return to use assistant within one week
- **Integration Usage**: 30% of Medical Scribe sessions include assistant usage

### 8.2 Quality Metrics
- **Response Accuracy**: 95% of responses include proper clinical disclaimers
- **User Satisfaction**: 4.5+ star rating in user feedback
- **Performance**: 95% of responses delivered within 5 seconds
- **Error Rate**: <1% API failure rate

### 8.3 Safety Metrics
- **Compliance**: 100% of clinical responses include mandatory disclaimer
- **Privacy**: 0 incidents of PII data transmission to OpenAI
- **Boundary Adherence**: 0 instances of diagnostic or prescriptive advice

## 9. Open Questions

1. **Conversation Limits**: Should there be a maximum message limit per conversation or per user per day?
2. **Export Functionality**: Should users be able to export conversation transcripts for reference?
3. **Collaboration Features**: Future consideration for sharing conversations between team members?
4. **Mobile App Integration**: Timeline for mobile app integration if applicable?
5. **Usage Analytics**: What specific usage patterns should be tracked for product improvement?
6. **Cost Management**: How should OpenAI API costs be monitored and potentially limited per user?
7. **Offline Capability**: Any requirements for offline or cached responses for common questions?

## 10. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- OpenAI API integration
- Basic chat interface
- System prompt implementation
- Authentication integration

### Phase 2: Standalone Interface (Week 2-3)
- Complete standalone chat page
- Conversation history
- Example questions
- Brand styling

### Phase 3: Medical Scribe Integration (Week 3-4)
- Collapsible component in Medical Scribe
- Workflow integration
- Context separation
- Testing across all workflow steps

### Phase 4: Polish & Launch (Week 4)
- Performance optimization
- Error handling
- User testing
- Documentation and training materials