import { PatientInfo, SessionState, IntakeData, FollowupData, AudioRecording } from '@/lib/types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
  code: string;
}

export interface IntegrityCheckResult {
  isIntact: boolean;
  issues: IntegrityIssue[];
  recommendations: string[];
}

export interface IntegrityIssue {
  type: 'missing_data' | 'corrupted_data' | 'inconsistent_data' | 'outdated_data';
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

class DataValidator {
  // Patient Info Validation
  static validatePatientInfo(patientInfo: PatientInfo): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!patientInfo.firstName?.trim()) {
      errors.push({
        field: 'firstName',
        message: 'Voornaam is verplicht',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING',
      });
    }

    if (!patientInfo.lastName?.trim()) {
      errors.push({
        field: 'lastName',
        message: 'Achternaam is verplicht',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING',
      });
    }

    if (!patientInfo.dateOfBirth?.trim()) {
      errors.push({
        field: 'dateOfBirth',
        message: 'Geboortedatum is verplicht',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING',
      });
    } else {
      // Date format validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(patientInfo.dateOfBirth)) {
        errors.push({
          field: 'dateOfBirth',
          message: 'Ongeldige datumformaat (gebruik JJJJ-MM-DD)',
          severity: 'error',
          code: 'INVALID_DATE_FORMAT',
        });
      } else {
        const birthDate = new Date(patientInfo.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (birthDate >= today) {
          errors.push({
            field: 'dateOfBirth',
            message: 'Geboortedatum kan niet in de toekomst liggen',
            severity: 'error',
            code: 'INVALID_BIRTH_DATE',
          });
        } else if (age > 120) {
          warnings.push({
            field: 'dateOfBirth',
            message: 'Leeftijd lijkt onrealistisch hoog, controleer geboortedatum',
            code: 'UNREALISTIC_AGE',
          });
        } else if (age < 0) {
          errors.push({
            field: 'dateOfBirth',
            message: 'Ongeldige geboortedatum',
            severity: 'error',
            code: 'INVALID_BIRTH_DATE',
          });
        }
      }
    }

    if (!patientInfo.phoneNumber?.trim()) {
      errors.push({
        field: 'phoneNumber',
        message: 'Telefoonnummer is verplicht',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING',
      });
    } else {
      // Dutch phone number validation
      const phoneRegex = /^(\+31|0)[1-9]\d{8}$/;
      const cleanPhone = patientInfo.phoneNumber.replace(/[\s\-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push({
          field: 'phoneNumber',
          message: 'Ongeldig Nederlands telefoonnummer',
          severity: 'error',
          code: 'INVALID_PHONE_FORMAT',
        });
      }
    }

    // Email validation (if provided)
    if (patientInfo.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientInfo.email)) {
        errors.push({
          field: 'email',
          message: 'Ongeldig e-mailadres',
          severity: 'error',
          code: 'INVALID_EMAIL_FORMAT',
        });
      }
    }

    // Chief complaint validation
    if (!patientInfo.chiefComplaint?.trim()) {
      warnings.push({
        field: 'chiefComplaint',
        message: 'Hoofdklacht niet ingevuld, dit wordt sterk aanbevolen',
        code: 'MISSING_CHIEF_COMPLAINT',
        suggestion: 'Voeg hoofdklacht toe voor betere documentatie',
      });
    } else if (patientInfo.chiefComplaint.length < 10) {
      warnings.push({
        field: 'chiefComplaint',
        message: 'Hoofdklacht lijkt erg kort, overweeg meer details toe te voegen',
        code: 'SHORT_CHIEF_COMPLAINT',
      });
    }

    // Insurance validation
    if (!patientInfo.insuranceProvider?.trim()) {
      warnings.push({
        field: 'insuranceProvider',
        message: 'Zorgverzekeraar niet opgegeven',
        code: 'MISSING_INSURANCE_INFO',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Session State Validation
  static validateSessionState(session: SessionState): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic session validation
    if (!session.id) {
      errors.push({
        field: 'id',
        message: 'Sessie ID ontbreekt',
        severity: 'error',
        code: 'MISSING_SESSION_ID',
      });
    }

    if (!session.type || !['intake', 'followup'].includes(session.type)) {
      errors.push({
        field: 'type',
        message: 'Ongeldig sessie type',
        severity: 'error',
        code: 'INVALID_SESSION_TYPE',
      });
    }

    if (!session.status || !['idle', 'in-progress', 'paused', 'completed', 'error'].includes(session.status)) {
      errors.push({
        field: 'status',
        message: 'Ongeldige sessie status',
        severity: 'error',
        code: 'INVALID_SESSION_STATUS',
      });
    }

    // Patient info validation
    if (!session.patientInfo) {
      errors.push({
        field: 'patientInfo',
        message: 'Patiëntgegevens ontbreken',
        severity: 'error',
        code: 'MISSING_PATIENT_INFO',
      });
    } else {
      const patientValidation = this.validatePatientInfo(session.patientInfo);
      errors.push(...patientValidation.errors);
      warnings.push(...patientValidation.warnings);
    }

    // Timestamps validation
    if (!session.startedAt && session.status !== 'idle') {
      errors.push({
        field: 'startedAt',
        message: 'Start tijd ontbreekt voor actieve sessie',
        severity: 'error',
        code: 'MISSING_START_TIME',
      });
    }

    if (session.completedAt && session.status !== 'completed') {
      warnings.push({
        field: 'completedAt',
        message: 'Sessie heeft voltooiing tijd maar status is niet "completed"',
        code: 'INCONSISTENT_COMPLETION_STATUS',
      });
    }

    // Data consistency checks
    if (session.type === 'intake' && !session.intakeData) {
      warnings.push({
        field: 'intakeData',
        message: 'Intake data ontbreekt voor intake sessie',
        code: 'MISSING_TYPE_DATA',
      });
    }

    if (session.type === 'followup' && !session.followupData) {
      warnings.push({
        field: 'followupData',
        message: 'Vervolgconsult data ontbreekt voor vervolgconsult sessie',
        code: 'MISSING_TYPE_DATA',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Intake Data Validation
  static validateIntakeData(intakeData: IntakeData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Patient info validation
    if (!intakeData.patientInfo) {
      errors.push({
        field: 'patientInfo',
        message: 'Patiëntgegevens ontbreken in intake data',
        severity: 'error',
        code: 'MISSING_PATIENT_INFO',
      });
    }

    // Content completeness checks
    if (!intakeData.preparation?.trim()) {
      warnings.push({
        field: 'preparation',
        message: 'Intake voorbereiding ontbreekt',
        code: 'MISSING_PREPARATION',
      });
    }

    if (!intakeData.anamnesisTranscript?.trim() && !intakeData.phsbStructure) {
      warnings.push({
        field: 'anamnesis',
        message: 'Anamnese informatie ontbreekt',
        code: 'MISSING_ANAMNESIS',
      });
    }

    if (!intakeData.examinationPlan?.trim()) {
      warnings.push({
        field: 'examinationPlan',
        message: 'Onderzoeksplan ontbreekt',
        code: 'MISSING_EXAMINATION_PLAN',
      });
    }

    if (!intakeData.clinicalConclusion?.trim()) {
      warnings.push({
        field: 'clinicalConclusion',
        message: 'Klinische conclusie ontbreekt',
        code: 'MISSING_CLINICAL_CONCLUSION',
      });
    }

    // Red flags validation
    if (intakeData.redFlags.length === 0) {
      warnings.push({
        field: 'redFlags',
        message: 'Geen rode vlagen geëvalueerd - controleer of dit correct is',
        code: 'NO_RED_FLAGS_EVALUATED',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Followup Data Validation
  static validateFollowupData(followupData: FollowupData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Patient info validation
    if (!followupData.patientInfo) {
      errors.push({
        field: 'patientInfo',
        message: 'Patiëntgegevens ontbreken in vervolgconsult data',
        severity: 'error',
        code: 'MISSING_PATIENT_INFO',
      });
    }

    // SOEP documentation check
    if (!followupData.soepTranscript?.trim() && !followupData.soepStructure) {
      warnings.push({
        field: 'soep',
        message: 'SOEP documentatie ontbreekt',
        code: 'MISSING_SOEP_DOCUMENTATION',
      });
    }

    if (!followupData.progressEvaluation?.trim()) {
      warnings.push({
        field: 'progressEvaluation',
        message: 'Voortgangsevaluatie ontbreekt',
        code: 'MISSING_PROGRESS_EVALUATION',
      });
    }

    if (!followupData.treatmentAdjustments?.trim()) {
      warnings.push({
        field: 'treatmentAdjustments',
        message: 'Behandelplan aanpassingen ontbreken',
        code: 'MISSING_TREATMENT_ADJUSTMENTS',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Audio Recording Validation
  static validateAudioRecording(recording: AudioRecording): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!recording.id) {
      errors.push({
        field: 'id',
        message: 'Audio opname ID ontbreekt',
        severity: 'error',
        code: 'MISSING_RECORDING_ID',
      });
    }

    if (!recording.blob) {
      errors.push({
        field: 'blob',
        message: 'Audio data ontbreekt',
        severity: 'error',
        code: 'MISSING_AUDIO_DATA',
      });
    } else {
      if (recording.blob.size === 0) {
        errors.push({
          field: 'blob',
          message: 'Audio bestand is leeg',
          severity: 'error',
          code: 'EMPTY_AUDIO_FILE',
        });
      } else if (recording.blob.size < 1000) {
        warnings.push({
          field: 'blob',
          message: 'Audio bestand is erg klein, mogelijk incomplete opname',
          code: 'SMALL_AUDIO_FILE',
        });
      }
    }

    if (!recording.duration || recording.duration <= 0) {
      warnings.push({
        field: 'duration',
        message: 'Audio duur is ongeldig of niet opgegeven',
        code: 'INVALID_DURATION',
      });
    } else {
      if (recording.duration < 1000) {
        warnings.push({
          field: 'duration',
          message: 'Audio opname is erg kort (< 1 seconde)',
          code: 'VERY_SHORT_RECORDING',
        });
      }
    }

    if (!recording.timestamp) {
      warnings.push({
        field: 'timestamp',
        message: 'Tijdstempel ontbreekt',
        code: 'MISSING_TIMESTAMP',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

class IntegrityChecker {
  // Check data integrity of a complete session
  static checkSessionIntegrity(session: SessionState): IntegrityCheckResult {
    const issues: IntegrityIssue[] = [];
    const recommendations: string[] = [];

    // Basic structure integrity
    this.checkBasicStructure(session, issues);

    // Timestamp consistency
    this.checkTimestampConsistency(session, issues);

    // Data completeness based on status
    this.checkDataCompleteness(session, issues, recommendations);

    // Cross-reference validation
    this.checkCrossReferences(session, issues);

    // Storage integrity
    this.checkStorageIntegrity(session, issues, recommendations);

    return {
      isIntact: issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length === 0,
      issues,
      recommendations,
    };
  }

  private static checkBasicStructure(session: SessionState, issues: IntegrityIssue[]) {
    if (!session.id || typeof session.id !== 'string') {
      issues.push({
        type: 'missing_data',
        field: 'id',
        message: 'Sessie ID is ongeldig of ontbreekt',
        severity: 'critical',
        autoFixable: false,
      });
    }

    if (!session.type || !['intake', 'followup'].includes(session.type)) {
      issues.push({
        type: 'corrupted_data',
        field: 'type',
        message: 'Sessie type is corrupt',
        severity: 'critical',
        autoFixable: false,
      });
    }

    if (!session.patientInfo) {
      issues.push({
        type: 'missing_data',
        field: 'patientInfo',
        message: 'Patiëntgegevens ontbreken volledig',
        severity: 'high',
        autoFixable: false,
      });
    }
  }

  private static checkTimestampConsistency(session: SessionState, issues: IntegrityIssue[]) {
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : 0;
    const pauseTime = session.pausedAt ? new Date(session.pausedAt).getTime() : 0;
    const completeTime = session.completedAt ? new Date(session.completedAt).getTime() : 0;
    const updateTime = session.updatedAt ? new Date(session.updatedAt).getTime() : 0;

    if (pauseTime && startTime && pauseTime < startTime) {
      issues.push({
        type: 'inconsistent_data',
        field: 'timestamps',
        message: 'Pauze tijd is eerder dan start tijd',
        severity: 'high',
        autoFixable: true,
      });
    }

    if (completeTime && startTime && completeTime < startTime) {
      issues.push({
        type: 'inconsistent_data',
        field: 'timestamps',
        message: 'Voltooiing tijd is eerder dan start tijd',
        severity: 'high',
        autoFixable: false,
      });
    }

    if (updateTime && startTime && updateTime < startTime) {
      issues.push({
        type: 'inconsistent_data',
        field: 'timestamps',
        message: 'Laatste wijziging is eerder dan start tijd',
        severity: 'medium',
        autoFixable: true,
      });
    }
  }

  private static checkDataCompleteness(
    session: SessionState, 
    issues: IntegrityIssue[], 
    recommendations: string[]
  ) {
    if (session.status === 'completed') {
      if (!session.completedAt) {
        issues.push({
          type: 'inconsistent_data',
          field: 'completedAt',
          message: 'Sessie gemarkeerd als voltooid maar voltooiing tijd ontbreekt',
          severity: 'medium',
          autoFixable: true,
        });
      }

      if (session.type === 'intake' && session.intakeData) {
        if (!session.intakeData.clinicalConclusion) {
          issues.push({
            type: 'missing_data',
            field: 'clinicalConclusion',
            message: 'Voltooide intake mist klinische conclusie',
            severity: 'high',
            autoFixable: false,
          });
        }
      }

      if (session.type === 'followup' && session.followupData) {
        if (!session.followupData.progressEvaluation) {
          issues.push({
            type: 'missing_data',
            field: 'progressEvaluation',
            message: 'Voltooid vervolgconsult mist voortgangsevaluatie',
            severity: 'medium',
            autoFixable: false,
          });
        }
      }
    }

    if (session.status === 'paused' && !session.pausedAt) {
      issues.push({
        type: 'inconsistent_data',
        field: 'pausedAt',
        message: 'Sessie gemarkeerd als gepauzeerd maar pauze tijd ontbreekt',
        severity: 'medium',
        autoFixable: true,
      });
    }
  }

  private static checkCrossReferences(session: SessionState, issues: IntegrityIssue[]) {
    // Check if patient info is consistent across session and data
    if (session.patientInfo && session.intakeData?.patientInfo) {
      if (session.patientInfo.firstName !== session.intakeData.patientInfo.firstName ||
          session.patientInfo.lastName !== session.intakeData.patientInfo.lastName) {
        issues.push({
          type: 'inconsistent_data',
          field: 'patientInfo',
          message: 'Patiëntgegevens komen niet overeen tussen sessie en intake data',
          severity: 'high',
          autoFixable: true,
        });
      }
    }

    if (session.patientInfo && session.followupData?.patientInfo) {
      if (session.patientInfo.firstName !== session.followupData.patientInfo.firstName ||
          session.patientInfo.lastName !== session.followupData.patientInfo.lastName) {
        issues.push({
          type: 'inconsistent_data',
          field: 'patientInfo',
          message: 'Patiëntgegevens komen niet overeen tussen sessie en vervolgconsult data',
          severity: 'high',
          autoFixable: true,
        });
      }
    }
  }

  private static checkStorageIntegrity(
    session: SessionState, 
    issues: IntegrityIssue[], 
    recommendations: string[]
  ) {
    // Check if last saved timestamp is recent enough
    if (session.lastSavedAt) {
      const lastSaved = new Date(session.lastSavedAt).getTime();
      const now = Date.now();
      const timeDiff = now - lastSaved;

      // If more than 1 hour since last save and session is active
      if (timeDiff > 3600000 && (session.status === 'in-progress' || session.status === 'paused')) {
        issues.push({
          type: 'outdated_data',
          field: 'lastSavedAt',
          message: 'Sessie is lang niet opgeslagen',
          severity: 'medium',
          autoFixable: true,
        });
        recommendations.push('Opslaan van sessie aanbevolen om gegevensverlies te voorkomen');
      }
    } else if (session.status !== 'idle') {
      issues.push({
        type: 'missing_data',
        field: 'lastSavedAt',
        message: 'Opslag tijdstempel ontbreekt voor actieve sessie',
        severity: 'low',
        autoFixable: true,
      });
    }

    // Check for audio recordings integrity
    if (session.intakeData?.anamnesisRecording) {
      const audioValidation = DataValidator.validateAudioRecording(session.intakeData.anamnesisRecording);
      audioValidation.errors.forEach(error => {
        issues.push({
          type: 'corrupted_data',
          field: `anamnesisRecording.${error.field}`,
          message: `Audio opname probleem: ${error.message}`,
          severity: error.severity === 'error' ? 'medium' : 'low',
          autoFixable: false,
        });
      });
    }
  }

  // Auto-fix method for fixable issues
  static autoFixSession(session: SessionState): SessionState {
    const fixed = { ...session };
    const now = new Date().toISOString();

    // Fix missing timestamps
    if (!fixed.updatedAt) {
      fixed.updatedAt = now;
    }

    if (!fixed.lastSavedAt && fixed.status !== 'idle') {
      fixed.lastSavedAt = now;
    }

    if (fixed.status === 'completed' && !fixed.completedAt) {
      fixed.completedAt = now;
    }

    if (fixed.status === 'paused' && !fixed.pausedAt) {
      fixed.pausedAt = now;
    }

    // Fix patient info consistency
    if (fixed.patientInfo && fixed.intakeData?.patientInfo) {
      fixed.intakeData.patientInfo = { ...fixed.patientInfo };
    }

    if (fixed.patientInfo && fixed.followupData?.patientInfo) {
      fixed.followupData.patientInfo = { ...fixed.patientInfo };
    }

    return fixed;
  }
}

export { DataValidator, IntegrityChecker };