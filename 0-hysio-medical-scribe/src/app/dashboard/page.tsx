'use client';

import * as React from 'react';
import { SessionHistory } from '@/components/session/session-history';
import { useSessionState } from '@/hooks/useSessionState';
import { SessionExporter } from '@/lib/utils/session-export';
import { BackupManager } from '@/lib/utils/backup-recovery';
import { PrivacyManager } from '@/lib/utils/privacy-handler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, 
  Plus, 
 
  Shield, 
  Download,
  AlertCircle,
  CheckCircle,
  Settings,
  FileText,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const router = useRouter();
  const sessionState = useSessionState();
  
  const [sessions, setSessions] = React.useState(sessionState.getSavedSessions());
  const [stats, setStats] = React.useState({
    totalSessions: 0,
    completedSessions: 0,
    activeSessions: 0,
    totalBackups: 0,
  });

  // Update sessions and stats
  React.useEffect(() => {
    const savedSessions = sessionState.getSavedSessions();
    setSessions(savedSessions);
    
    const totalSessions = savedSessions.length;
    const completedSessions = savedSessions.filter(s => s.status === 'completed').length;
    const activeSessions = savedSessions.filter(s => s.status === 'in-progress' || s.status === 'paused').length;
    const totalBackups = BackupManager.getAllBackups().length;
    
    setStats({
      totalSessions,
      completedSessions,
      activeSessions,
      totalBackups,
    });
  }, []);

  const handleSessionLoad = (sessionId: string) => {
    const success = sessionState.loadSession(sessionId);
    if (success) {
      router.push('/scribe');
    } else {
      alert('Fout bij laden van sessie');
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    if (confirm('Weet u zeker dat u deze sessie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      sessionState.deleteSession(sessionId);
      
      // Log the deletion for audit purposes
      PrivacyManager.logAuditEvent('delete', 'session', sessionId, 'Session deleted by user');
      
      // Update local state
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      
      alert('Sessie succesvol verwijderd');
    }
  };

  const handleSessionExport = async (sessionId: string, format: 'pdf' | 'docx' | 'txt') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      alert('Sessie niet gevonden');
      return;
    }

    try {
      const result = await SessionExporter.exportSession(session, { format });
      if (result.success) {
        SessionExporter.downloadExportedFile(result);
        
        // Log the export
        PrivacyManager.logAuditEvent('export', 'session', sessionId, `Session exported as ${format}`);
        
        if (result.error) {
          alert(`Export voltooid, maar met waarschuwing: ${result.error}`);
        }
      } else {
        alert(`Export mislukt: ${result.error}`);
      }
    } catch (error) {
      alert(`Export fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const handleDataCleanup = () => {
    if (confirm('Dit zal alle oude sessies en backups opschonen volgens het privacy beleid. Doorgaan?')) {
      let cleanedSessions = 0;
      let cleanedBackups = 0;
      
      // Check each session for retention compliance
      sessions.forEach(session => {
        const retentionCheck = PrivacyManager.checkDataRetention(session);
        
        if (retentionCheck.shouldDelete) {
          sessionState.deleteSession(session.id);
          cleanedSessions++;
        } else if (retentionCheck.shouldAnonymize) {
          // In a real application, you would implement anonymization here
          console.log(`Session ${session.id} should be anonymized`);
        }
      });

      // Clean old backups
      const allBackups = BackupManager.getAllBackups();
      allBackups.forEach(backup => {
        const backupAge = Date.now() - new Date(backup.timestamp).getTime();
        const maxBackupAge = 365 * 24 * 60 * 60 * 1000; // 1 year
        
        if (backupAge > maxBackupAge) {
          BackupManager.deleteBackup(backup.id);
          cleanedBackups++;
        }
      });

      alert(`Cleanup voltooid: ${cleanedSessions} sessies en ${cleanedBackups} backups verwijderd`);
      
      // Refresh data
      const updatedSessions = sessionState.getSavedSessions();
      setSessions(updatedSessions);
    }
  };

  const handleEmergencyRecovery = () => {
    if (confirm('Dit zal proberen alle herstelbare sessies te vinden. Doorgaan?')) {
      const recovery = BackupManager.emergencyRecovery();
      
      if (recovery.sessions.length > 0) {
        // In a real application, you would present these sessions to the user for selection
        alert(`${recovery.sessions.length} sessies hersteld. Check de sessie lijst.`);
        setSessions(sessionState.getSavedSessions());
      } else {
        alert('Geen herstelbare sessies gevonden.');
      }
      
      if (recovery.issues.length > 0) {
        console.log('Recovery issues:', recovery.issues);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-surface border-b border-border-muted p-4 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-border-primary/15 rounded-full flex items-center justify-center">
              <Home size={20} className="text-text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-secondary">
                Dashboard
              </h1>
              <p className="text-sm text-text-muted">
                Overzicht van uw medische scribe sessies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => router.push('/scribe')}
              size="lg"
            >
              <Plus size={18} className="mr-2" />
              Nieuwe Sessie
            </Button>
            
            <Button
              variant="outline"
              onClick={() => console.log('Settings page coming soon')}
            >
              <Settings size={18} className="mr-2" />
              Instellingen
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Sessies</CardTitle>
              <FileText size={16} className="text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Alle opgeslagen sessies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voltooid</CardTitle>
              <CheckCircle size={16} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                Afgesloten sessies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actief</CardTitle>
              <Activity size={16} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                Lopende/gepauzeerde sessies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backups</CardTitle>
              <Shield size={16} className="text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">
                Beschikbare backups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Snelle Acties
            </CardTitle>
            <CardDescription>
              Beheer uw data en instellingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleDataCleanup}
                className="flex items-center gap-2"
              >
                <AlertCircle size={16} />
                Data Opschoning
              </Button>
              
              <Button
                variant="outline"
                onClick={handleEmergencyRecovery}
                className="flex items-center gap-2"
              >
                <Shield size={16} />
                Emergency Recovery
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const sessions = sessionState.getSavedSessions();
                  const exportData = {
                    sessions,
                    backups: BackupManager.getAllBackups(),
                    exportDate: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `hysio-data-export-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Alle Data Exporteren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Alert */}
        {stats.activeSessions > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Activity size={18} />
              <span className="font-medium">Actieve Sessies</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {stats.activeSessions}
              </Badge>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              U heeft {stats.activeSessions} actieve of gepauzeerde sessie(s). 
              Klik op een sessie in de lijst om verder te gaan.
            </p>
          </div>
        )}

        {/* Session History */}
        <SessionHistory
          sessions={sessions}
          onSessionLoad={handleSessionLoad}
          onSessionDelete={handleSessionDelete}
          onSessionExport={handleSessionExport}
        />
      </div>

      {/* Footer */}
      <footer className="bg-background-surface border-t border-border-muted p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-text-muted">
            Hysio Medical Scribe Dashboard - Professionele sessie beheer
          </p>
          <p className="text-xs text-text-muted mt-1">
            Alle data wordt veilig opgeslagen en voldoet aan Nederlandse privacy wetgeving (AVG/GDPR)
          </p>
        </div>
      </footer>
    </div>
  );
}