import { PatientInfo, SessionState, IntakeData, FollowupData } from '@/lib/types';

export interface PrivacySettings {
  dataRetentionDays: number;
  autoAnonymizeAfterDays: number;
  allowDataExport: boolean;
  requireConsentForStorage: boolean;
  enableAuditLogging: boolean;
  anonymizationLevel: 'basic' | 'standard' | 'strict';
}

export interface AnonymizationOptions {
  level: 'basic' | 'standard' | 'strict';
  preserveStructure: boolean;
  preserveTimestamps: boolean;
  preserveMedicalContent: boolean;
  customReplacements?: { [key: string]: string };
}

export interface AnonymizedData<T> {
  data: T;
  anonymizationMap: { [originalValue: string]: string };
  anonymizationLevel: string;
  timestamp: string;
  reversible: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  resourceType: 'session' | 'patient' | 'backup';
  resourceId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  success: boolean;
  errorMessage?: string;
}

export interface ConsentRecord {
  patientId: string;
  consentGiven: boolean;
  consentDate: string;
  consentType: 'storage' | 'processing' | 'export' | 'research';
  expiryDate?: string;
  withdrawnDate?: string;
  version: string;
}

class PrivacyManager {
  private static readonly DEFAULT_SETTINGS: PrivacySettings = {
    dataRetentionDays: 2555, // 7 years (medical records retention in NL)
    autoAnonymizeAfterDays: 365, // 1 year
    allowDataExport: true,
    requireConsentForStorage: true,
    enableAuditLogging: true,
    anonymizationLevel: 'standard',
  };

  private static readonly ANONYMIZATION_PATTERNS = {
    name: ['PATIENT_A', 'PATIENT_B', 'PATIENT_C', 'PATIENT_D', 'PATIENT_E'],
    email: ['patient1@example.com', 'patient2@example.com', 'patient3@example.com'],
    phone: ['06-XXXXXXXX', '0XX-XXXXXXX'],
    address: ['ADRES_GEANONIMISEERD', 'STRAATNAAM XX, XXXX XX STAD'],
    bsn: ['XXXXXXXXX'],
    insuranceNumber: ['POLISNUMMER_XXX'],
  };

  private static anonymizationCounter = new Map<string, number>();

  // Anonymize patient information
  static anonymizePatientInfo(
    patientInfo: PatientInfo,
    options: Partial<AnonymizationOptions> = {}
  ): AnonymizedData<PatientInfo> {
    const opts: AnonymizationOptions = {
      level: 'standard',
      preserveStructure: true,
      preserveTimestamps: true,
      preserveMedicalContent: true,
      ...options,
    };

    const anonymizationMap: { [key: string]: string } = {};
    const anonymized: PatientInfo = { ...patientInfo };

    // Generate consistent anonymous identifiers
    const patientId = this.generateAnonymousId('patient');

    switch (opts.level) {
      case 'basic':
        // Only anonymize direct identifiers
        anonymized.firstName = this.anonymizeValue(patientInfo.firstName, 'firstName', anonymizationMap);
        anonymized.lastName = this.anonymizeValue(patientInfo.lastName, 'lastName', anonymizationMap);
        anonymized.phoneNumber = this.anonymizeValue(patientInfo.phoneNumber, 'phone', anonymizationMap);
        if (patientInfo.email) {
          anonymized.email = this.anonymizeValue(patientInfo.email, 'email', anonymizationMap);
        }
        break;

      case 'standard':
        // Anonymize most personal data but preserve some structure
        anonymized.firstName = this.anonymizeValue(patientInfo.firstName, 'firstName', anonymizationMap);
        anonymized.lastName = this.anonymizeValue(patientInfo.lastName, 'lastName', anonymizationMap);
        anonymized.phoneNumber = this.anonymizeValue(patientInfo.phoneNumber, 'phone', anonymizationMap);
        anonymized.email = patientInfo.email ? this.anonymizeValue(patientInfo.email, 'email', anonymizationMap) : '';
        anonymized.address = patientInfo.address ? this.anonymizeValue(patientInfo.address, 'address', anonymizationMap) : '';
        anonymized.emergencyContact = patientInfo.emergencyContact ? 'NOODCONTACT_GEANONIMISEERD' : '';
        anonymized.emergencyPhone = patientInfo.emergencyPhone ? this.anonymizeValue(patientInfo.emergencyPhone, 'phone', anonymizationMap) : '';
        anonymized.insuranceNumber = patientInfo.insuranceNumber ? this.anonymizeValue(patientInfo.insuranceNumber, 'insuranceNumber', anonymizationMap) : '';
        
        // Preserve age category instead of exact birth date
        if (patientInfo.dateOfBirth) {
          const age = this.calculateAge(patientInfo.dateOfBirth);
          const ageCategory = this.getAgeCategory(age);
          anonymized.dateOfBirth = ageCategory;
        }
        break;

      case 'strict':
        // Maximum anonymization while preserving medical utility
        anonymized.firstName = patientId;
        anonymized.lastName = '';
        anonymized.dateOfBirth = opts.preserveTimestamps && patientInfo.dateOfBirth ? this.getAgeCategory(this.calculateAge(patientInfo.dateOfBirth)) : 'LEEFTIJD_GEANONIMISEERD';
        anonymized.phoneNumber = 'TELEFOON_GEANONIMISEERD';
        anonymized.email = 'EMAIL_GEANONIMISEERD';
        anonymized.address = 'ADRES_GEANONIMISEERD';
        anonymized.referralSource = patientInfo.referralSource ? 'VERWIJZER_GEANONIMISEERD' : '';
        anonymized.emergencyContact = 'NOODCONTACT_GEANONIMISEERD';
        anonymized.emergencyPhone = 'TELEFOON_GEANONIMISEERD';
        anonymized.insuranceProvider = patientInfo.insuranceProvider ? 'VERZEKERAAR_GEANONIMISEERD' : '';
        anonymized.insuranceNumber = 'POLISNUMMER_GEANONIMISEERD';
        break;
    }

    // Always preserve medical content if specified
    if (opts.preserveMedicalContent) {
      // Medical information is generally preserved for utility
      anonymized.chiefComplaint = patientInfo.chiefComplaint;
      anonymized.previousTreatment = patientInfo.previousTreatment;
      anonymized.currentMedication = patientInfo.currentMedication;
      anonymized.notes = patientInfo.notes;
    } else {
      // Anonymize medical content that might contain identifying information
      anonymized.chiefComplaint = this.anonymizeMedicalText(patientInfo.chiefComplaint);
      anonymized.previousTreatment = this.anonymizeMedicalText(patientInfo.previousTreatment);
      anonymized.currentMedication = this.anonymizeMedicalText(patientInfo.currentMedication);
      anonymized.notes = this.anonymizeMedicalText(patientInfo.notes);
    }

    return {
      data: anonymized,
      anonymizationMap,
      anonymizationLevel: opts.level,
      timestamp: new Date().toISOString(),
      reversible: opts.level === 'basic', // Only basic anonymization can be potentially reversed
    };
  }

  // Anonymize complete session
  static anonymizeSession(
    session: SessionState,
    options: Partial<AnonymizationOptions> = {}
  ): AnonymizedData<SessionState> {
    const anonymizedSession: SessionState = { ...session };
    let combinedAnonymizationMap: { [key: string]: string } = {};

    // Anonymize patient info
    if (session.patientInfo) {
      const anonymizedPatientInfo = this.anonymizePatientInfo(session.patientInfo, options);
      anonymizedSession.patientInfo = anonymizedPatientInfo.data;
      combinedAnonymizationMap = { ...combinedAnonymizationMap, ...anonymizedPatientInfo.anonymizationMap };
    }

    // Anonymize session-specific data
    if (session.intakeData) {
      const anonymizedIntakeData = this.anonymizeIntakeData(session.intakeData, options, combinedAnonymizationMap);
      anonymizedSession.intakeData = anonymizedIntakeData.data;
      combinedAnonymizationMap = { ...combinedAnonymizationMap, ...anonymizedIntakeData.anonymizationMap };
    }

    if (session.followupData) {
      const anonymizedFollowupData = this.anonymizeFollowupData(session.followupData, options, combinedAnonymizationMap);
      anonymizedSession.followupData = anonymizedFollowupData.data;
      combinedAnonymizationMap = { ...combinedAnonymizationMap, ...anonymizedFollowupData.anonymizationMap };
    }

    // Generate new session ID if strict anonymization
    if (options.level === 'strict') {
      anonymizedSession.id = this.generateAnonymousId('session');
    }

    return {
      data: anonymizedSession,
      anonymizationMap: combinedAnonymizationMap,
      anonymizationLevel: options.level || 'standard',
      timestamp: new Date().toISOString(),
      reversible: (options.level || 'standard') === 'basic',
    };
  }

  // Check data retention compliance
  static checkDataRetention(session: SessionState, settings: PrivacySettings = this.DEFAULT_SETTINGS): {
    shouldDelete: boolean;
    shouldAnonymize: boolean;
    daysUntilDeletion: number;
    recommendations: string[];
  } {
    const now = new Date();
    const sessionDate = new Date(session.startedAt || session.createdAt || '');
    const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    const shouldDelete = daysDiff > settings.dataRetentionDays;
    const shouldAnonymize = daysDiff > settings.autoAnonymizeAfterDays;
    const daysUntilDeletion = Math.max(0, settings.dataRetentionDays - daysDiff);

    const recommendations: string[] = [];

    if (shouldDelete) {
      recommendations.push('Deze sessie overschrijdt de bewaarperiode en moet worden verwijderd');
    } else if (shouldAnonymize) {
      recommendations.push('Deze sessie moet worden geanonimiseerd volgens het beleid');
    }

    if (daysDiff > settings.dataRetentionDays * 0.8) {
      recommendations.push('Sessie nadert einde van bewaarperiode - overweeg export indien nodig');
    }

    return {
      shouldDelete,
      shouldAnonymize,
      daysUntilDeletion,
      recommendations,
    };
  }

  // Consent management
  static checkConsent(patientId: string, consentType: ConsentRecord['consentType']): boolean {
    try {
      const consentKey = `hysio-consent-${patientId}-${consentType}`;
      const consentStr = localStorage.getItem(consentKey);
      
      if (!consentStr) return false;

      const consent: ConsentRecord = JSON.parse(consentStr);
      
      // Check if consent is still valid
      if (consent.withdrawnDate) return false;
      if (consent.expiryDate && new Date(consent.expiryDate) < new Date()) return false;

      return consent.consentGiven;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  static recordConsent(consent: ConsentRecord): boolean {
    try {
      const consentKey = `hysio-consent-${consent.patientId}-${consent.consentType}`;
      localStorage.setItem(consentKey, JSON.stringify(consent));
      
      // Log the consent action
      this.logAuditEvent('create', 'patient', consent.patientId, `Consent recorded for ${consent.consentType}`);
      
      return true;
    } catch (error) {
      console.error('Error recording consent:', error);
      return false;
    }
  }

  static withdrawConsent(patientId: string, consentType: ConsentRecord['consentType']): boolean {
    try {
      const consentKey = `hysio-consent-${patientId}-${consentType}`;
      const consentStr = localStorage.getItem(consentKey);
      
      if (consentStr) {
        const consent: ConsentRecord = JSON.parse(consentStr);
        consent.withdrawnDate = new Date().toISOString();
        localStorage.setItem(consentKey, JSON.stringify(consent));
        
        // Log the withdrawal
        this.logAuditEvent('update', 'patient', patientId, `Consent withdrawn for ${consentType}`);
      }

      return true;
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      return false;
    }
  }

  // Audit logging
  static logAuditEvent(
    action: AuditLogEntry['action'],
    resourceType: AuditLogEntry['resourceType'],
    resourceId: string,
    details: string,
    success: boolean = true,
    errorMessage?: string
  ): void {
    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: new Date().toISOString(),
        action,
        resourceType,
        resourceId,
        details,
        success,
        errorMessage,
        // In a real app, these would come from the authentication system
        userId: 'current-user-id',
        ipAddress: 'client-ip',
        userAgent: navigator.userAgent,
      };

      // Store in audit log
      const auditKey = 'hysio-audit-log';
      const existingLogStr = localStorage.getItem(auditKey);
      const existingLog: AuditLogEntry[] = existingLogStr ? JSON.parse(existingLogStr) : [];
      
      existingLog.push(auditEntry);
      
      // Keep only last 1000 entries to prevent storage overflow
      if (existingLog.length > 1000) {
        existingLog.splice(0, existingLog.length - 1000);
      }

      localStorage.setItem(auditKey, JSON.stringify(existingLog));
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Get audit log
  static getAuditLog(resourceId?: string, resourceType?: AuditLogEntry['resourceType']): AuditLogEntry[] {
    try {
      const auditKey = 'hysio-audit-log';
      const logStr = localStorage.getItem(auditKey);
      if (!logStr) return [];

      let log: AuditLogEntry[] = JSON.parse(logStr);

      // Filter if criteria provided
      if (resourceId) {
        log = log.filter(entry => entry.resourceId === resourceId);
      }
      if (resourceType) {
        log = log.filter(entry => entry.resourceType === resourceType);
      }

      // Sort by timestamp (newest first)
      return log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  // GDPR compliance utilities
  static performDataSubjectRequest(
    patientId: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability'
  ): {
    success: boolean;
    data?: any;
    message: string;
  } {
    try {
      switch (requestType) {
        case 'access':
          // Return all data related to patient
          const patientSessions = this.getPatientSessions(patientId);
          const auditLog = this.getAuditLog(patientId, 'patient');
          const consent = this.getPatientConsent(patientId);
          
          this.logAuditEvent('read', 'patient', patientId, 'Data access request fulfilled');
          
          return {
            success: true,
            data: { sessions: patientSessions, auditLog, consent },
            message: `Alle data voor patiënt ${patientId} geretourneerd`,
          };

        case 'erasure':
          // Delete all patient data
          const deletedSessions = this.deletePatientData(patientId);
          this.logAuditEvent('delete', 'patient', patientId, `Data erasure completed: ${deletedSessions} sessions deleted`);
          
          return {
            success: true,
            message: `Alle data voor patiënt ${patientId} verwijderd (${deletedSessions} sessies)`,
          };

        case 'portability':
          // Export data in structured format
          const exportData = this.exportPatientData(patientId);
          this.logAuditEvent('export', 'patient', patientId, 'Data portability request fulfilled');
          
          return {
            success: true,
            data: exportData,
            message: 'Data geëxporteerd in overdraagbaar formaat',
          };

        default:
          return {
            success: false,
            message: `Request type ${requestType} nog niet ondersteund`,
          };
      }
    } catch (error) {
      this.logAuditEvent('read', 'patient', patientId, `Data subject request failed: ${requestType}`, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        message: `Fout bij verwerken van verzoek: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      };
    }
  }

  // Private utility methods
  private static anonymizeValue(value: string, type: string, map: { [key: string]: string }): string {
    if (map[value]) return map[value]; // Use existing mapping

    let anonymized: string;
    
    switch (type) {
      case 'firstName':
      case 'lastName':
        anonymized = this.getAnonymousName();
        break;
      case 'phone':
        anonymized = this.ANONYMIZATION_PATTERNS.phone[0];
        break;
      case 'email':
        anonymized = this.getAnonymousEmail();
        break;
      case 'address':
        anonymized = this.ANONYMIZATION_PATTERNS.address[0];
        break;
      default:
        anonymized = 'GEANONIMISEERD';
    }

    map[value] = anonymized;
    return anonymized;
  }

  private static anonymizeMedicalText(text: string): string {
    if (!text) return text;

    // Replace potential identifying information in medical text
    let anonymized = text;
    
    // Remove potential names (simple pattern matching)
    anonymized = anonymized.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAAM_GEANONIMISEERD]');
    
    // Remove phone numbers
    anonymized = anonymized.replace(/\b\d{2,3}[-\s]?\d{6,8}\b/g, '[TELEFOON_GEANONIMISEERD]');
    
    // Remove email addresses
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_GEANONIMISEERD]');
    
    return anonymized;
  }

  private static anonymizeIntakeData(
    intakeData: IntakeData,
    options: Partial<AnonymizationOptions>,
    existingMap: { [key: string]: string }
  ): AnonymizedData<IntakeData> {
    const anonymized: IntakeData = { ...intakeData };
    const anonymizationMap = { ...existingMap };

    // Anonymize patient info reference
    if (intakeData.patientInfo) {
      const patientResult = this.anonymizePatientInfo(intakeData.patientInfo, options);
      anonymized.patientInfo = patientResult.data;
      Object.assign(anonymizationMap, patientResult.anonymizationMap);
    }

    // Anonymize text content if not preserving medical content
    if (!options.preserveMedicalContent) {
      anonymized.preparation = this.anonymizeMedicalText(intakeData.preparation);
      anonymized.anamnesisTranscript = this.anonymizeMedicalText(intakeData.anamnesisTranscript);
      anonymized.examinationPlan = this.anonymizeMedicalText(intakeData.examinationPlan);
      anonymized.examinationFindings = this.anonymizeMedicalText(intakeData.examinationFindings);
      anonymized.clinicalConclusion = this.anonymizeMedicalText(intakeData.clinicalConclusion);
      anonymized.notes = this.anonymizeMedicalText(intakeData.notes);
    }

    return {
      data: anonymized,
      anonymizationMap,
      anonymizationLevel: options.level || 'standard',
      timestamp: new Date().toISOString(),
      reversible: (options.level || 'standard') === 'basic',
    };
  }

  private static anonymizeFollowupData(
    followupData: FollowupData,
    options: Partial<AnonymizationOptions>,
    existingMap: { [key: string]: string }
  ): AnonymizedData<FollowupData> {
    const anonymized: FollowupData = { ...followupData };
    const anonymizationMap = { ...existingMap };

    // Anonymize patient info reference
    if (followupData.patientInfo) {
      const patientResult = this.anonymizePatientInfo(followupData.patientInfo, options);
      anonymized.patientInfo = patientResult.data;
      Object.assign(anonymizationMap, patientResult.anonymizationMap);
    }

    // Anonymize text content if not preserving medical content
    if (!options.preserveMedicalContent) {
      anonymized.sessionPreparation = this.anonymizeMedicalText(followupData.sessionPreparation);
      anonymized.soepTranscript = this.anonymizeMedicalText(followupData.soepTranscript);
      anonymized.progressEvaluation = this.anonymizeMedicalText(followupData.progressEvaluation);
      anonymized.treatmentAdjustments = this.anonymizeMedicalText(followupData.treatmentAdjustments);
      anonymized.notes = this.anonymizeMedicalText(followupData.notes);
    }

    return {
      data: anonymized,
      anonymizationMap,
      anonymizationLevel: options.level || 'standard',
      timestamp: new Date().toISOString(),
      reversible: (options.level || 'standard') === 'basic',
    };
  }

  private static generateAnonymousId(type: string): string {
    const counter = this.anonymizationCounter.get(type) || 0;
    this.anonymizationCounter.set(type, counter + 1);
    return `${type.toUpperCase()}_${String(counter + 1).padStart(5, '0')}`;
  }

  private static getAnonymousName(): string {
    const names = this.ANONYMIZATION_PATTERNS.name;
    return names[Math.floor(Math.random() * names.length)];
  }

  private static getAnonymousEmail(): string {
    const emails = this.ANONYMIZATION_PATTERNS.email;
    return emails[Math.floor(Math.random() * emails.length)];
  }

  private static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  private static getAgeCategory(age: number): string {
    if (age < 18) return 'MINDERJARIG';
    if (age < 30) return 'JONG_VOLWASSEN';
    if (age < 50) return 'VOLWASSEN';
    if (age < 65) return 'MIDDELBAAR';
    return 'SENIOR';
  }

  private static generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getPatientSessions(patientId: string): SessionState[] {
    // Implementation would search through all sessions
    // This is a simplified version
    try {
      const sessionsStr = localStorage.getItem('hysio-scribe-sessions');
      if (!sessionsStr) return [];
      
      const sessions: SessionState[] = JSON.parse(sessionsStr);
      return sessions.filter(session => 
        session.patientInfo?.firstName === patientId || 
        session.id === patientId ||
        `${session.patientInfo?.firstName}_${session.patientInfo?.lastName}` === patientId
      );
    } catch (error) {
      return [];
    }
  }

  private static getPatientConsent(patientId: string): ConsentRecord[] {
    const consents: ConsentRecord[] = [];
    const consentTypes: ConsentRecord['consentType'][] = ['storage', 'processing', 'export', 'research'];
    
    for (const type of consentTypes) {
      try {
        const consentKey = `hysio-consent-${patientId}-${type}`;
        const consentStr = localStorage.getItem(consentKey);
        if (consentStr) {
          consents.push(JSON.parse(consentStr));
        }
      } catch (error) {
        // Continue with other consent types
      }
    }
    
    return consents;
  }

  private static deletePatientData(patientId: string): number {
    let deletedCount = 0;
    
    try {
      // Delete sessions
      const sessionsStr = localStorage.getItem('hysio-scribe-sessions');
      if (sessionsStr) {
        const sessions: SessionState[] = JSON.parse(sessionsStr);
        const filteredSessions = sessions.filter(session => {
          const isPatientSession = session.patientInfo?.firstName === patientId || 
            session.id === patientId ||
            `${session.patientInfo?.firstName}_${session.patientInfo?.lastName}` === patientId;
          
          if (isPatientSession) deletedCount++;
          return !isPatientSession;
        });
        
        localStorage.setItem('hysio-scribe-sessions', JSON.stringify(filteredSessions));
      }

      // Delete consent records
      const consentTypes: ConsentRecord['consentType'][] = ['storage', 'processing', 'export', 'research'];
      for (const type of consentTypes) {
        localStorage.removeItem(`hysio-consent-${patientId}-${type}`);
      }
    } catch (error) {
      console.error('Error deleting patient data:', error);
    }

    return deletedCount;
  }

  private static exportPatientData(patientId: string): any {
    return {
      sessions: this.getPatientSessions(patientId),
      consent: this.getPatientConsent(patientId),
      auditLog: this.getAuditLog(patientId, 'patient'),
      exportDate: new Date().toISOString(),
      format: 'JSON',
      version: '1.0',
    };
  }
}

export { PrivacyManager };