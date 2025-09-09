import { SessionExporter, ExportOptions, ExportResult } from './session-export';
import type { IntakeData, PatientInfo } from '@/lib/types';

/**
 * Enhanced export service for the new Hysio Intake workflow
 * Defaults to anonymous output and structured content only
 */
export class AnonymousExportService {
  
  /**
   * Export intake data as anonymous PDF report
   */
  static async exportIntakeAsPDF(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ): Promise<ExportResult> {
    const sessionState = this.createSessionFromIntakeData(intakeData, patientInfo);
    
    const options: ExportOptions = {
      format: 'pdf',
      includePatientInfo: true,
      includeAudioTranscripts: false, // Exclude raw transcripts
      includeTimestamps: false,
      anonymize: true, // Always anonymize
    };
    
    return await SessionExporter.exportSession(sessionState, options);
  }
  
  /**
   * Export intake data as anonymous Word document
   */
  static async exportIntakeAsWord(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ): Promise<ExportResult> {
    const sessionState = this.createSessionFromIntakeData(intakeData, patientInfo);
    
    const options: ExportOptions = {
      format: 'docx',
      includePatientInfo: true,
      includeAudioTranscripts: false, // Exclude raw transcripts
      includeTimestamps: false,
      anonymize: true, // Always anonymize
    };
    
    return await SessionExporter.exportSession(sessionState, options);
  }
  
  /**
   * Export intake data as anonymous HTML report
   */
  static async exportIntakeAsHTML(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ): Promise<ExportResult> {
    const sessionState = this.createSessionFromIntakeData(intakeData, patientInfo);
    
    const options: ExportOptions = {
      format: 'html',
      includePatientInfo: true,
      includeAudioTranscripts: false, // Exclude raw transcripts
      includeTimestamps: false,
      anonymize: true, // Always anonymize
    };
    
    return await SessionExporter.exportSession(sessionState, options);
  }
  
  /**
   * Generate anonymous clinical report content
   */
  static generateAnonymousReport(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`HYSIO MEDICAL SCRIBE - INTAKE RAPPORT
    
Patiënt: GEANONIMISEERD
Leeftijd: ca. ${new Date().getFullYear() - parseInt(patientInfo.birthYear)} jaar
Geslacht: ${patientInfo.gender}
Datum: ${new Date().toLocaleDateString('nl-NL')}

═══════════════════════════════════════════════════════════════`);
    
    // Chief Complaint
    sections.push(`HOOFDKLACHT

${patientInfo.chiefComplaint}

───────────────────────────────────────────────────────────────`);
    
    // Intake Preparation (if available)
    if (intakeData.preparation) {
      sections.push(`INTAKE VOORBEREIDING

${intakeData.preparation}

───────────────────────────────────────────────────────────────`);
    }
    
    // Anamnesis (PHSB Structure)
    if (intakeData.phsbStructure) {
      sections.push(`FYSIOROADMAP ANAMNESE

${intakeData.phsbStructure.fullStructuredText}

───────────────────────────────────────────────────────────────`);
    }
    
    // Examination Plan (if available)
    if (intakeData.examinationPlan) {
      sections.push(`ONDERZOEKSVOORSTEL

${intakeData.examinationPlan}

───────────────────────────────────────────────────────────────`);
    }
    
    // Examination Findings
    if (intakeData.examinationFindings) {
      sections.push(`ONDERZOEKSBEVINDINGEN

${intakeData.examinationFindings}

───────────────────────────────────────────────────────────────`);
    }
    
    // Clinical Conclusion
    if (intakeData.clinicalConclusion) {
      sections.push(`KLINISCHE CONCLUSIE

${intakeData.clinicalConclusion}

───────────────────────────────────────────────────────────────`);
    }
    
    // Red Flags (if any)
    if (intakeData.redFlags && intakeData.redFlags.length > 0) {
      sections.push(`RODE VLAGEN

${intakeData.redFlags.map(flag => `• ${flag}`).join('\n')}

───────────────────────────────────────────────────────────────`);
    }
    
    // Footer
    sections.push(`
═══════════════════════════════════════════════════════════════

Gegenereerd door Hysio Medical Scribe
Export datum: ${new Date().toLocaleString('nl-NL')}

BELANGRIJK: Dit document is gegenereerd met AI-ondersteuning en moet 
worden geverifieerd door een bevoegd fysiotherapeut voordat het wordt 
gebruikt voor medische besluitvorming.

Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)
Alle patiëntgegevens zijn geanonimiseerd voor privacy bescherming.`);
    
    return sections.join('\n');
  }
  
  /**
   * Create a session state object from intake data for export compatibility
   */
  private static createSessionFromIntakeData(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ) {
    return {
      id: 'temp-export-session',
      type: 'intake' as const,
      status: 'completed',
      patientInfo,
      intakeData,
      followupData: null,
      startedAt: intakeData.createdAt,
      completedAt: intakeData.updatedAt,
      updatedAt: intakeData.updatedAt,
      lastSavedAt: intakeData.updatedAt,
      pausedAt: null,
      sessionDuration: 0,
    };
  }
  
  /**
   * Download exported file
   */
  static downloadFile(result: ExportResult): void {
    SessionExporter.downloadExportedFile(result);
  }
  
  /**
   * Validate intake data for export
   */
  static validateIntakeData(
    intakeData: IntakeData,
    patientInfo: PatientInfo
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!patientInfo.initials?.trim()) {
      errors.push('Patiënt initialen zijn vereist');
    }
    
    if (!patientInfo.birthYear?.trim()) {
      errors.push('Geboortejaar is vereist');
    }
    
    if (!patientInfo.gender) {
      errors.push('Geslacht is vereist');
    }
    
    if (!patientInfo.chiefComplaint?.trim()) {
      errors.push('Hoofdklacht is vereist');
    }
    
    if (!intakeData.clinicalConclusion?.trim()) {
      errors.push('Klinische conclusie is vereist voor export');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}