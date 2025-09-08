import { SessionState, IntakeData, FollowupData } from '@/lib/types';
import { DataValidator, IntegrityChecker } from './data-validation';

export interface BackupMetadata {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'auto' | 'manual' | 'critical';
  reason: string;
  size: number;
  checksum: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  session: SessionState;
  version: string;
}

export interface RecoveryOptions {
  validateIntegrity: boolean;
  autoFix: boolean;
  preserveOriginal: boolean;
  mergeStrategy: 'keep_latest' | 'keep_backup' | 'merge_both';
}

export interface RecoveryResult {
  success: boolean;
  recoveredSession?: SessionState;
  backupsFound: number;
  validBackups: number;
  issues: string[];
  recommendations: string[];
}

class BackupManager {
  private static readonly BACKUP_VERSION = '1.0';
  private static readonly MAX_BACKUPS_PER_SESSION = 10;
  private static readonly BACKUP_KEY_PREFIX = 'hysio-backup-';
  private static readonly INDEX_KEY = 'hysio-backup-index';

  // Automatic backup triggers
  private static readonly AUTO_BACKUP_TRIGGERS = {
    TIME_INTERVAL: 300000, // 5 minutes
    SIGNIFICANT_CHANGES: ['status', 'currentStep'],
    CRITICAL_POINTS: [
      'anamnesis_complete',
      'examination_complete',
      'conclusion_complete',
      'soep_complete',
      'session_paused',
      'session_completed'
    ],
  };

  // Create backup
  static createBackup(
    session: SessionState, 
    type: 'auto' | 'manual' | 'critical' = 'auto',
    reason: string = 'Automated backup'
  ): BackupData | null {
    try {
      const timestamp = new Date().toISOString();
      const sessionData = JSON.stringify(session);
      const checksum = this.generateChecksum(sessionData);
      
      const metadata: BackupMetadata = {
        id: this.generateBackupId(),
        sessionId: session.id,
        timestamp,
        type,
        reason,
        size: sessionData.length,
        checksum,
      };

      const backupData: BackupData = {
        metadata,
        session: { ...session },
        version: this.BACKUP_VERSION,
      };

      // Store backup
      const backupKey = this.getBackupKey(metadata.id);
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Update backup index
      this.updateBackupIndex(metadata);

      // Clean old backups
      this.cleanupOldBackups(session.id);

      return backupData;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  // Restore from backup
  static restoreFromBackup(
    backupId: string, 
    options: Partial<RecoveryOptions> = {}
  ): RecoveryResult {
    const recoveryOptions: RecoveryOptions = {
      validateIntegrity: true,
      autoFix: true,
      preserveOriginal: true,
      mergeStrategy: 'keep_latest',
      ...options,
    };

    try {
      const backupKey = this.getBackupKey(backupId);
      const backupDataStr = localStorage.getItem(backupKey);
      
      if (!backupDataStr) {
        return {
          success: false,
          backupsFound: 0,
          validBackups: 0,
          issues: ['Backup niet gevonden'],
          recommendations: ['Controleer backup ID of zoek naar andere beschikbare backups'],
        };
      }

      const backupData: BackupData = JSON.parse(backupDataStr);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Validate backup integrity
      if (recoveryOptions.validateIntegrity) {
        const currentChecksum = this.generateChecksum(JSON.stringify(backupData.session));
        if (currentChecksum !== backupData.metadata.checksum) {
          issues.push('Backup integriteit compromised - checksum mismatch');
          if (!recoveryOptions.autoFix) {
            return {
              success: false,
              backupsFound: 1,
              validBackups: 0,
              issues,
              recommendations: ['Probeer een ander backup of schakel auto-fix in'],
            };
          }
        }
      }

      // Validate session data integrity
      const integrityCheck = IntegrityChecker.checkSessionIntegrity(backupData.session);
      if (!integrityCheck.isIntact) {
        const criticalIssues = integrityCheck.issues.filter(
          issue => issue.severity === 'critical' || issue.severity === 'high'
        );
        
        if (criticalIssues.length > 0) {
          issues.push(`Backup bevat ${criticalIssues.length} kritieke data problemen`);
          recommendations.push(...integrityCheck.recommendations);
        }

        if (recoveryOptions.autoFix) {
          backupData.session = IntegrityChecker.autoFixSession(backupData.session);
          recommendations.push('Automatische reparaties toegepast op backup data');
        }
      }

      return {
        success: true,
        recoveredSession: backupData.session,
        backupsFound: 1,
        validBackups: 1,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        backupsFound: 1,
        validBackups: 0,
        issues: [`Fout bij herstellen backup: ${error instanceof Error ? error.message : 'Onbekende fout'}`],
        recommendations: ['Controleer backup data integriteit of probeer een ander backup'],
      };
    }
  }

  // Auto-recovery for interrupted sessions
  static autoRecoverSession(sessionId: string): RecoveryResult {
    const backups = this.getSessionBackups(sessionId);
    
    if (backups.length === 0) {
      return {
        success: false,
        backupsFound: 0,
        validBackups: 0,
        issues: ['Geen backups gevonden voor sessie'],
        recommendations: ['Sessie mogelijk volledig verloren - start nieuwe sessie'],
      };
    }

    // Sort backups by timestamp (newest first)
    const sortedBackups = backups.sort((a, b) => 
      new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
    );

    let validBackups = 0;
    const allIssues: string[] = [];
    const allRecommendations: string[] = [];

    // Try to recover from the most recent valid backup
    for (const backup of sortedBackups) {
      try {
        const backupDataStr = localStorage.getItem(this.getBackupKey(backup.metadata.id));
        if (!backupDataStr) continue;

        const backupData: BackupData = JSON.parse(backupDataStr);
        
        // Validate backup
        const currentChecksum = this.generateChecksum(JSON.stringify(backupData.session));
        if (currentChecksum === backup.metadata.checksum) {
          validBackups++;
          
          // Check data integrity
          const integrityCheck = IntegrityChecker.checkSessionIntegrity(backupData.session);
          const criticalIssues = integrityCheck.issues.filter(
            issue => issue.severity === 'critical' || issue.severity === 'high'
          );

          if (criticalIssues.length === 0) {
            // This backup is good to use
            const recoveredSession = IntegrityChecker.autoFixSession(backupData.session);
            
            return {
              success: true,
              recoveredSession,
              backupsFound: backups.length,
              validBackups,
              issues: allIssues,
              recommendations: [
                `Sessie hersteld van backup gemaakt op ${new Date(backup.metadata.timestamp).toLocaleString('nl-NL')}`,
                'Controleer herstelde data en sla opnieuw op',
                ...allRecommendations,
              ],
            };
          } else {
            allIssues.push(`Backup ${backup.metadata.id} heeft kritieke problemen`);
          }
        } else {
          allIssues.push(`Backup ${backup.metadata.id} heeft integriteit problemen`);
        }
      } catch (error) {
        allIssues.push(`Backup ${backup.metadata.id} kan niet gelezen worden`);
      }
    }

    return {
      success: false,
      backupsFound: backups.length,
      validBackups,
      issues: ['Geen valide backups gevonden', ...allIssues],
      recommendations: [
        'Alle beschikbare backups hebben problemen',
        'Overweeg handmatige data herstel of start nieuwe sessie',
        ...allRecommendations,
      ],
    };
  }

  // Get all backups for a session
  static getSessionBackups(sessionId: string): BackupMetadata[] {
    try {
      const indexStr = localStorage.getItem(this.INDEX_KEY);
      if (!indexStr) return [];

      const index: BackupMetadata[] = JSON.parse(indexStr);
      return index.filter(backup => backup.sessionId === sessionId);
    } catch (error) {
      console.error('Failed to get session backups:', error);
      return [];
    }
  }

  // Get all backups
  static getAllBackups(): BackupMetadata[] {
    try {
      const indexStr = localStorage.getItem(this.INDEX_KEY);
      return indexStr ? JSON.parse(indexStr) : [];
    } catch (error) {
      console.error('Failed to get all backups:', error);
      return [];
    }
  }

  // Delete backup
  static deleteBackup(backupId: string): boolean {
    try {
      // Remove backup data
      const backupKey = this.getBackupKey(backupId);
      localStorage.removeItem(backupKey);

      // Update index
      const indexStr = localStorage.getItem(this.INDEX_KEY);
      if (indexStr) {
        const index: BackupMetadata[] = JSON.parse(indexStr);
        const updatedIndex = index.filter(backup => backup.id !== backupId);
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(updatedIndex));
      }

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  // Check if session needs backup
  static shouldCreateBackup(
    session: SessionState, 
    lastBackupTime?: string,
    changeType?: string
  ): { shouldBackup: boolean; reason: string; type: 'auto' | 'critical' } {
    // Critical backup triggers
    if (changeType && this.AUTO_BACKUP_TRIGGERS.CRITICAL_POINTS.includes(changeType)) {
      return { 
        shouldBackup: true, 
        reason: `Kritiek punt bereikt: ${changeType}`, 
        type: 'critical' 
      };
    }

    // Status change triggers
    if (changeType && this.AUTO_BACKUP_TRIGGERS.SIGNIFICANT_CHANGES.includes(changeType)) {
      return { 
        shouldBackup: true, 
        reason: `Significante wijziging: ${changeType}`, 
        type: 'auto' 
      };
    }

    // Time-based backup
    if (lastBackupTime) {
      const timeSinceLastBackup = Date.now() - new Date(lastBackupTime).getTime();
      if (timeSinceLastBackup > this.AUTO_BACKUP_TRIGGERS.TIME_INTERVAL) {
        return { 
          shouldBackup: true, 
          reason: 'Tijd interval bereikt', 
          type: 'auto' 
        };
      }
    } else if (session.status === 'in-progress') {
      return { 
        shouldBackup: true, 
        reason: 'Eerste backup voor actieve sessie', 
        type: 'auto' 
      };
    }

    return { shouldBackup: false, reason: '', type: 'auto' };
  }

  // Emergency session recovery - scan for any recoverable data
  static emergencyRecovery(): { sessions: SessionState[]; issues: string[] } {
    const recoveredSessions: SessionState[] = [];
    const issues: string[] = [];

    try {
      // Scan localStorage for any backup data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.BACKUP_KEY_PREFIX)) {
          try {
            const backupDataStr = localStorage.getItem(key);
            if (backupDataStr) {
              const backupData: BackupData = JSON.parse(backupDataStr);
              
              // Validate and fix if possible
              const integrityCheck = IntegrityChecker.checkSessionIntegrity(backupData.session);
              const criticalIssues = integrityCheck.issues.filter(
                issue => issue.severity === 'critical'
              );

              if (criticalIssues.length === 0) {
                const fixedSession = IntegrityChecker.autoFixSession(backupData.session);
                recoveredSessions.push(fixedSession);
              } else {
                issues.push(`Backup ${backupData.metadata.id} heeft kritieke problemen`);
              }
            }
          } catch (error) {
            issues.push(`Kan backup data niet lezen van key: ${key}`);
          }
        }
      }

      // Also scan for main session data
      const mainStorageKey = 'hysio-scribe-sessions';
      const sessionsStr = localStorage.getItem(mainStorageKey);
      if (sessionsStr) {
        try {
          const sessions: SessionState[] = JSON.parse(sessionsStr);
          for (const session of sessions) {
            const integrityCheck = IntegrityChecker.checkSessionIntegrity(session);
            const criticalIssues = integrityCheck.issues.filter(
              issue => issue.severity === 'critical'
            );

            if (criticalIssues.length === 0) {
              const fixedSession = IntegrityChecker.autoFixSession(session);
              // Avoid duplicates
              if (!recoveredSessions.find(s => s.id === fixedSession.id)) {
                recoveredSessions.push(fixedSession);
              }
            }
          }
        } catch (error) {
          issues.push('Kan hoofdsessie data niet lezen');
        }
      }

    } catch (error) {
      issues.push(`Fout tijdens emergency recovery: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }

    return { sessions: recoveredSessions, issues };
  }

  // Utility methods
  private static generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getBackupKey(backupId: string): string {
    return `${this.BACKUP_KEY_PREFIX}${backupId}`;
  }

  private static generateChecksum(data: string): string {
    // Simple checksum - in production, use a proper hashing algorithm
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private static updateBackupIndex(metadata: BackupMetadata): void {
    try {
      const indexStr = localStorage.getItem(this.INDEX_KEY);
      const index: BackupMetadata[] = indexStr ? JSON.parse(indexStr) : [];
      
      // Add new backup to index
      index.push(metadata);
      
      // Sort by timestamp (newest first)
      index.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update backup index:', error);
    }
  }

  private static cleanupOldBackups(sessionId: string): void {
    try {
      const sessionBackups = this.getSessionBackups(sessionId);
      
      if (sessionBackups.length > this.MAX_BACKUPS_PER_SESSION) {
        // Sort by timestamp and keep only the most recent ones
        const sortedBackups = sessionBackups.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Delete excess backups
        const backupsToDelete = sortedBackups.slice(this.MAX_BACKUPS_PER_SESSION);
        for (const backup of backupsToDelete) {
          this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }
}

// Recovery UI Hook
export const useRecoveryManager = () => {
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryResults, setRecoveryResults] = React.useState<RecoveryResult | null>(null);

  const performRecovery = async (sessionId: string, options?: Partial<RecoveryOptions>) => {
    setIsRecovering(true);
    try {
      const result = BackupManager.autoRecoverSession(sessionId);
      setRecoveryResults(result);
      return result;
    } finally {
      setIsRecovering(false);
    }
  };

  const performEmergencyRecovery = () => {
    setIsRecovering(true);
    try {
      const result = BackupManager.emergencyRecovery();
      const recoveryResult: RecoveryResult = {
        success: result.sessions.length > 0,
        backupsFound: result.sessions.length,
        validBackups: result.sessions.length,
        issues: result.issues,
        recommendations: result.sessions.length > 0 
          ? [`${result.sessions.length} sessies hersteld`]
          : ['Geen herstelbare sessies gevonden'],
      };
      setRecoveryResults(recoveryResult);
      return { sessions: result.sessions, recoveryResult };
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    isRecovering,
    recoveryResults,
    performRecovery,
    performEmergencyRecovery,
    clearResults: () => setRecoveryResults(null),
  };
};

export { BackupManager };