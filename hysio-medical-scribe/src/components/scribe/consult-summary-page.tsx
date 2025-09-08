import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { SOEPExporter } from '@/lib/utils/soep-export';
import { 
  FileText, 
  Lightbulb,
  Copy,
  Download,
  FileDown,
  CheckCircle,
  Stethoscope,
  User,
  Eye,
  Heart,
  Activity,
  Target,
  ArrowLeft
} from 'lucide-react';
import type { PatientInfo, SOEPStructure } from '@/lib/types';

export interface ConsultSummaryPageProps {
  patientInfo: PatientInfo;
  soepData: SOEPStructure;
  sessionPreparation?: string;
  onBack: () => void;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  className?: string;
}

// Compact Editable SOEP Card Component
interface CompactSOEPCardProps {
  soepData: SOEPStructure;
  onDataChange?: (updatedData: SOEPStructure) => void;
  enableEditing?: boolean;
  className?: string;
}

const CompactSOEPCard: React.FC<CompactSOEPCardProps> = ({
  soepData,
  onDataChange,
  enableEditing = true,
  className,
}) => {
  const [localData, setLocalData] = React.useState<SOEPStructure>(soepData);

  React.useEffect(() => {
    setLocalData(soepData);
  }, [soepData]);

  const updateSectionContent = (sectionId: keyof SOEPStructure, newContent: string) => {
    const updatedData = {
      ...localData,
      [sectionId]: newContent
    };
    
    // Rebuild full structured text
    if (sectionId !== 'fullStructuredText' && sectionId !== 'redFlags') {
      updatedData.fullStructuredText = buildFullSOEPText(updatedData);
    }
    
    setLocalData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const buildFullSOEPText = (data: SOEPStructure): string => {
    const sections = [];
    
    if (data.subjective) {
      sections.push(`**S - Subjectief:**\n${data.subjective}`);
    }
    
    if (data.objective) {
      sections.push(`**O - Objectief:**\n${data.objective}`);
    }
    
    if (data.evaluation) {
      sections.push(`**E - Evaluatie:**\n${data.evaluation}`);
    }
    
    if (data.plan) {
      sections.push(`**P - Plan:**\n${data.plan}`);
    }
    
    if (data.redFlags && data.redFlags.length > 0) {
      const redFlagsText = data.redFlags.map(flag => `[RODE VLAG: ${flag}]`).join('\n');
      sections.push(`**Rode Vlagen:**\n${redFlagsText}`);
    }
    
    return sections.join('\n\n');
  };

  const copySectionContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy section to clipboard:', err);
    }
  };

  const EditableTextBox: React.FC<{
    content: string;
    sectionId: keyof SOEPStructure;
    placeholder?: string;
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
  }> = ({ content, sectionId, placeholder, title, icon: Icon, color }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempValue, setTempValue] = React.useState(content);

    React.useEffect(() => {
      setTempValue(content);
    }, [content]);

    const handleSave = () => {
      updateSectionContent(sectionId, tempValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(content);
      setIsEditing(false);
    };

    const getColorClasses = (colorName: string) => {
      switch (colorName) {
        case 'blue':
          return {
            border: 'border-blue-200',
            bg: 'bg-blue-50/30',
            text: 'text-blue-700'
          };
        case 'green':
          return {
            border: 'border-green-200',
            bg: 'bg-green-50/30',
            text: 'text-green-700'
          };
        case 'amber':
          return {
            border: 'border-amber-200',
            bg: 'bg-amber-50/30',
            text: 'text-amber-700'
          };
        case 'purple':
          return {
            border: 'border-purple-200',
            bg: 'bg-purple-50/30',
            text: 'text-purple-700'
          };
        default:
          return {
            border: 'border-gray-200',
            bg: 'bg-gray-50/30',
            text: 'text-gray-700'
          };
      }
    };

    const colorClasses = getColorClasses(color);

    if (!enableEditing) {
      return (
        <Card className={cn('border-2', colorClasses.border, colorClasses.bg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn('text-sm font-semibold flex items-center gap-2', colorClasses.text)}>
              <Icon size={16} />
              {title}
              <Button
                onClick={() => copySectionContent(content)}
                variant="ghost"
                size="sm"
                className="ml-auto p-1 h-auto"
                disabled={!content.trim()}
              >
                <Copy size={12} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
              {content || placeholder}
            </pre>
          </CardContent>
        </Card>
      );
    }

    if (isEditing) {
      return (
        <Card className={cn('border-2', colorClasses.border, colorClasses.bg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn('text-sm font-semibold flex items-center gap-2', colorClasses.text)}>
              <Icon size={16} />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-hysio-mint/40 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y font-inter text-sm"
              rows={Math.max(3, tempValue.split('\n').length + 1)}
              placeholder={placeholder}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-hysio-mint hover:bg-hysio-mint/90 text-white"
              >
                Opslaan
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        className={cn('border-2 cursor-pointer hover:shadow-md transition-shadow', colorClasses.border, colorClasses.bg)}
        onClick={() => setIsEditing(true)}
      >
        <CardHeader className="pb-3">
          <CardTitle className={cn('text-sm font-semibold flex items-center gap-2', colorClasses.text)}>
            <Icon size={16} />
            {title}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                copySectionContent(content);
              }}
              variant="ghost"
              size="sm"
              className="ml-auto p-1 h-auto"
              disabled={!content.trim()}
            >
              <Copy size={12} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="group">
            <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
              {content || (
                <span className="text-gray-400 italic">
                  {placeholder || 'Klik om te bewerken...'}
                </span>
              )}
            </pre>
            <div className="opacity-0 group-hover:opacity-100 text-xs text-hysio-mint mt-1 transition-opacity">
              Klik om te bewerken
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const soepSections = [
    { key: 'subjective', title: 'Subjectief', icon: User, color: 'blue', description: 'Wat zegt de patiënt' },
    { key: 'objective', title: 'Objectief', icon: Stethoscope, color: 'green', description: 'Wat zie/meet je' },
    { key: 'evaluation', title: 'Evaluatie', icon: Eye, color: 'amber', description: 'Wat betekent dit' },
    { key: 'plan', title: 'Plan', icon: Target, color: 'purple', description: 'Wat ga je doen' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-hysio-deep-green mb-2">
          Compacte SOEP Overzicht
        </h2>
        <p className="text-sm text-hysio-deep-green-900/70">
          Bewerk elke sectie afzonderlijk door erop te klikken
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {soepSections.map((section) => (
          <EditableTextBox
            key={section.key}
            content={localData[section.key as keyof SOEPStructure] as string || ''}
            sectionId={section.key as keyof SOEPStructure}
            placeholder={`Voer ${section.title.toLowerCase()} in...`}
            title={section.title}
            icon={section.icon}
            color={section.color}
          />
        ))}
      </div>
    </div>
  );
};

const ConsultSummaryPage: React.FC<ConsultSummaryPageProps> = ({
  patientInfo,
  soepData,
  sessionPreparation,
  onBack,
  onExportPDF,
  onExportWord,
  isExporting = false,
  disabled = false,
  className,
}) => {
  const [localSOEPData, setLocalSOEPData] = React.useState<SOEPStructure>(soepData);
  const [isExportingLocal, setIsExportingLocal] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSOEPDataChange = (updatedData: SOEPStructure) => {
    setLocalSOEPData(updatedData);
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingLocal(true);
      await SOEPExporter.exportAndDownload(
        {
          patientInfo,
          soepData: localSOEPData,
          createdAt: new Date().toISOString(),
        },
        'html' // Using HTML format since PDF implementation is placeholder
      );
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingLocal(true);
      await SOEPExporter.exportAndDownload(
        {
          patientInfo,
          soepData: localSOEPData,
          createdAt: new Date().toISOString(),
        },
        'txt' // Using TXT format since DOCX implementation is placeholder
      );
    } catch (error) {
      console.error('Word export failed:', error);
    } finally {
      setIsExportingLocal(false);
    }
  };

  const EditableFullSOEP: React.FC<{
    content: string;
    onContentChange: (newContent: string) => void;
  }> = ({ content, onContentChange }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempValue, setTempValue] = React.useState(content);

    React.useEffect(() => {
      setTempValue(content);
    }, [content]);

    const handleSave = () => {
      onContentChange(tempValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(content);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="space-y-3">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-full px-4 py-3 border border-hysio-mint/40 rounded-lg shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y font-inter text-sm"
            rows={Math.max(10, tempValue.split('\n').length + 2)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-hysio-mint hover:bg-hysio-mint/90 text-white"
            >
              Opslaan
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
            >
              Annuleren
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-text hover:bg-hysio-mint/5 p-4 rounded-lg transition-colors group border border-gray-200"
      >
        <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
          {content}
        </pre>
        <div className="opacity-0 group-hover:opacity-100 text-xs text-hysio-mint mt-2 transition-opacity">
          Klik om te bewerken
        </div>
      </div>
    );
  };

  return (
    <div className={cn('w-full p-6 space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hysio-deep-green mb-2">
            Consult Samenvatting
          </h1>
          <p className="text-hysio-deep-green-900/70">
            {patientInfo.initials} ({patientInfo.birthYear}) - Vervolgconsult voltooid
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          disabled={disabled}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Terug
        </Button>
      </div>

      {/* 1. Compact Editable SOEP Card */}
      <CompactSOEPCard
        soepData={localSOEPData}
        onDataChange={handleSOEPDataChange}
        enableEditing={true}
      />

      {/* 2. Full SOEP Documentation */}
      <Card className="border-2 border-hysio-mint/20 bg-hysio-cream/10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-hysio-deep-green">
              <FileText size={18} />
              Volledige SOEP Documentatie
            </CardTitle>
            <CopyToClipboard text={localSOEPData.fullStructuredText} />
          </div>
        </CardHeader>
        <CardContent>
          <EditableFullSOEP
            content={localSOEPData.fullStructuredText}
            onContentChange={(newContent) => {
              const updatedData = { ...localSOEPData, fullStructuredText: newContent };
              setLocalSOEPData(updatedData);
            }}
          />
        </CardContent>
      </Card>

      {/* Export Buttons Section */}
      <Card className="border-2 border-hysio-mint/30 bg-hysio-mint/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-hysio-deep-green">
            <Download size={18} />
            Rapport Exporteren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-hysio-deep-green-900/70 mb-6">
            Exporteer het volledige consult rapport als professioneel document.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExportPDF}
              disabled={disabled || isExporting || isExportingLocal}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              {(isExporting || isExportingLocal) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={18} className="mr-2" />
                  Exporteer als HTML
                </>
              )}
            </Button>
            
            <Button
              onClick={handleExportWord}
              disabled={disabled || isExporting || isExportingLocal}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {(isExporting || isExportingLocal) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={18} className="mr-2" />
                  Exporteer als TXT
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Reference: Consultation Preparation */}
      {sessionPreparation && (
        <Card className="border-2 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Lightbulb size={18} />
                Referentie: Consult Voorbereiding
              </CardTitle>
              <CopyToClipboard text={sessionPreparation} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
                {sessionPreparation}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center pt-8 border-t border-hysio-mint/20">
        <p className="text-sm text-hysio-deep-green-900/60 mb-2">
          Hysio Medical Scribe - AI-ondersteunde Fysiotherapie Documentatie
        </p>
        <p className="text-xs text-hysio-deep-green-900/50">
          Consult rapport gegenereerd op {formatDate(new Date().toISOString())} • 
          Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF) • 
          Alle AI-gegenereerde content moet worden geverifieerd door een bevoegd fysiotherapeut
        </p>
      </div>
    </div>
  );
};

export { ConsultSummaryPage };