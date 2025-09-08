import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Play,
  Eye,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { SessionState } from '@/hooks/useSessionState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SessionHistoryProps {
  sessions: SessionState[];
  onSessionLoad: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionExport: (sessionId: string, format: 'pdf' | 'docx' | 'txt') => void;
  className?: string;
}

type SortField = 'date' | 'patient' | 'type' | 'status' | 'duration';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'completed' | 'in-progress' | 'paused';
type FilterType = 'all' | 'intake' | 'followup';

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  onSessionLoad,
  onSessionDelete,
  onSessionExport,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('date');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('all');
  const [filterType, setFilterType] = React.useState<FilterType>('all');
  const [dateRange, setDateRange] = React.useState({
    from: '',
    to: '',
  });

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPatientName = (session: SessionState): string => {
    if (!session.patientInfo) return 'Onbekend';
    return `${session.patientInfo.firstName} ${session.patientInfo.lastName}`;
  };

  const getSessionDuration = (session: SessionState): number => {
    if (!session.startedAt) return 0;
    
    const startTime = new Date(session.startedAt).getTime();
    const endTime = session.completedAt 
      ? new Date(session.completedAt).getTime()
      : Date.now();
    
    return endTime - startTime;
  };

  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = sessions.filter(session => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const patientName = getPatientName(session).toLowerCase();
      const matchesSearch = !searchQuery || 
        patientName.includes(searchLower) ||
        session.id.toLowerCase().includes(searchLower) ||
        session.patientInfo?.chiefComplaint?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      
      // Type filter
      const matchesType = filterType === 'all' || session.type === filterType;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const sessionDate = new Date(session.startedAt || '');
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          matchesDateRange = matchesDateRange && sessionDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          matchesDateRange = matchesDateRange && sessionDate <= toDate;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.startedAt || 0).getTime();
          bValue = new Date(b.startedAt || 0).getTime();
          break;
        case 'patient':
          aValue = getPatientName(a);
          bValue = getPatientName(b);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'duration':
          aValue = getSessionDuration(a);
          bValue = getSessionDuration(b);
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [sessions, searchQuery, sortField, sortOrder, filterStatus, filterType, dateRange]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterType('all');
    setDateRange({ from: '', to: '' });
    setSortField('date');
    setSortOrder('desc');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'paused': 'bg-amber-100 text-amber-800 border-amber-200',
      'error': 'bg-red-100 text-red-800 border-red-200',
    };
    
    const labels = {
      'completed': 'Voltooid',
      'in-progress': 'Bezig',
      'paused': 'Gepauzeerd',
      'error': 'Fout',
    };

    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs', variants[status as keyof typeof variants])}
      >
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      'intake': 'bg-purple-100 text-purple-800 border-purple-200',
      'followup': 'bg-teal-100 text-teal-800 border-teal-200',
    };
    
    const labels = {
      'intake': 'Intake',
      'followup': 'Vervolgconsult',
    };

    return (
      <Badge 
        variant="outline"
        className={cn('text-xs', variants[type as keyof typeof variants])}
      >
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className={cn('w-full max-w-7xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hysio-deep-green mb-2">
          Sessie Geschiedenis
        </h1>
        <p className="text-hysio-deep-green-900/70">
          Overzicht van alle medische scribe sessies met zoek- en filterfunctionaliteit
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="border-hysio-mint/20 mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={20} />
            Filters & Zoeken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Zoeken</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                placeholder="Zoek op patiëntnaam, sessie-ID, of hoofdklacht..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                  <SelectItem value="in-progress">Bezig</SelectItem>
                  <SelectItem value="paused">Gepauzeerd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="followup">Vervolgconsult</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Van datum</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tot datum</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-hysio-deep-green-900/70">
              {filteredAndSortedSessions.length} van {sessions.length} sessies
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Filters wissen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-hysio-mint/20">
        <CardContent className="p-0">
          {filteredAndSortedSessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Geen sessies gevonden
              </h3>
              <p className="text-gray-500">
                Pas uw zoek- of filtercriteria aan om sessies te vinden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hysio-mint/20 bg-hysio-cream/30">
                    <th className="text-left p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('date')}
                        className="font-medium"
                      >
                        Datum
                        {sortField === 'date' && (
                          sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('patient')}
                        className="font-medium"
                      >
                        Patiënt
                        {sortField === 'patient' && (
                          sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('type')}
                        className="font-medium"
                      >
                        Type
                        {sortField === 'type' && (
                          sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-4">Hoofdklacht</th>
                    <th className="text-left p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('status')}
                        className="font-medium"
                      >
                        Status
                        {sortField === 'status' && (
                          sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('duration')}
                        className="font-medium"
                      >
                        Duur
                        {sortField === 'duration' && (
                          sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-right p-4">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-gray-100 hover:bg-hysio-cream/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-hysio-deep-green">
                            {formatDate(session.startedAt || '')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            ID: {session.id.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-hysio-deep-green" />
                          <span className="font-medium text-hysio-deep-green">
                            {getPatientName(session)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getTypeBadge(session.type)}
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {session.patientInfo?.chiefComplaint || 'Niet opgegeven'}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock size={14} />
                          {formatDuration(getSessionDuration(session))}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => console.log('View session:', session.id)}>
                              <Eye size={14} className="mr-2" />
                              Bekijken
                            </DropdownMenuItem>
                            {(session.status === 'paused' || session.status === 'in-progress') && (
                              <DropdownMenuItem onClick={() => onSessionLoad(session.id)}>
                                <Play size={14} className="mr-2" />
                                Hervatten
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSessionExport(session.id, 'pdf')}>
                              <Download size={14} className="mr-2" />
                              Exporteer als PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSessionExport(session.id, 'docx')}>
                              <Download size={14} className="mr-2" />
                              Exporteer als Word
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSessionExport(session.id, 'txt')}>
                              <Download size={14} className="mr-2" />
                              Exporteer als Tekst
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onSessionDelete(session.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { SessionHistory };