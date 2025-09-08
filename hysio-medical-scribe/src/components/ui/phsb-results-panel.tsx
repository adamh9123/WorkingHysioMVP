import * as React from 'react';
import { cn } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ChevronRight, 
  Lightbulb,
  Edit3,
  Mic,
  Copy,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  Stethoscope,
  Activity,
  AlertTriangle,
  Eye
} from 'lucide-react';
import type { PHSBStructure } from '@/lib/types';

// Parse PHSB structured text into individual sections
const parsePHSBText = (fullText: string): PHSBStructure => {
  const result: PHSBStructure = {
    patientNeeds: '',
    history: '',
    disorders: '',
    limitations: '',
    redFlags: [],
    fullStructuredText: fullText,
  };

  // Define section patterns with multiple variations
  const patterns = [
    // Patient/Patiënt patterns
    {
      key: 'patientNeeds' as keyof PHSBStructure,
      patterns: [
        /\*\*P\s*-\s*Patiënt\s*Probleem\/Hulpvraag:?\*\*([\s\S]*?)(?=\*\*[HhSsBb]\s*-|$)/i,
        /\*\*Patiëntbehoeften:?\*\*([\s\S]*?)(?=\*\*Historie|\*\*[HhSsBb]\s*-|$)/i,
        /\*\*P:?\*\*([\s\S]*?)(?=\*\*[HhSsBb]\s*-|$)/i,
      ]
    },
    // Historie patterns
    {
      key: 'history' as keyof PHSBStructure,
      patterns: [
        /\*\*H\s*-\s*Historie:?\*\*([\s\S]*?)(?=\*\*[SsBb]\s*-|$)/i,
        /\*\*Historie:?\*\*([\s\S]*?)(?=\*\*Stoornissen|\*\*[SsBb]\s*-|$)/i,
        /\*\*H:?\*\*([\s\S]*?)(?=\*\*[SsBb]\s*-|$)/i,
      ]
    },
    // Stoornissen patterns
    {
      key: 'disorders' as keyof PHSBStructure,
      patterns: [
        /\*\*S\s*-\s*Stoornissen\s*in\s*lichaamsfuncties\s*en\s*anatomische\s*structuren:?\*\*([\s\S]*?)(?=\*\*[Bb]\s*-|$)/i,
        /\*\*Stoornissen:?\*\*([\s\S]*?)(?=\*\*Beperkingen|\*\*[Bb]\s*-|$)/i,
        /\*\*S:?\*\*([\s\S]*?)(?=\*\*[Bb]\s*-|$)/i,
      ]
    },
    // Beperkingen patterns
    {
      key: 'limitations' as keyof PHSBStructure,
      patterns: [
        /\*\*B\s*-\s*Beperkingen:?\*\*([\s\S]*?)(?=\*\*Rode\s*Vlagen|$)/i,
        /\*\*Beperkingen:?\*\*([\s\S]*?)(?=\*\*Rode\s*Vlagen|$)/i,
        /\*\*B:?\*\*([\s\S]*?)(?=\*\*Rode\s*Vlagen|$)/i,
      ]
    }
  ];

  // Extract content for each section
  patterns.forEach(({ key, patterns: sectionPatterns }) => {
    for (const pattern of sectionPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  });

  // Extract red flags
  const redFlagPatterns = [
    /\*\*Rode\s*Vlagen:?\*\*([\s\S]*?)$/i,
    /\[RODE\s*VLAG:?([^\]]+)\]/gi
  ];
  
  for (const pattern of redFlagPatterns) {
    const matches = fullText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const flags = match[1].split('\n')
          .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
          .filter(line => line.length > 0);
        result.redFlags.push(...flags);
      }
    }
  }

  // Remove duplicates from red flags
  result.redFlags = [...new Set(result.redFlags)];

  return result;
};

interface PHSBSection {
  id: keyof PHSBStructure;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  content?: string;
}

const phsbSections: PHSBSection[] = [
  {
    id: 'patientNeeds',
    title: 'Patiëntbehoeften',
    shortTitle: 'P',
    description: 'Motivatie/hulpvraag en doelen/verwachtingen van de patiënt',
    icon: User,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'history',
    title: 'Historie',
    shortTitle: 'H',
    description: 'Ontstaansmoment, verloop klachten en eerdere behandeling',
    icon: FileText,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'disorders',
    title: 'Stoornissen',
    shortTitle: 'S',
    description: 'Pijn, mobiliteit, kracht en stabiliteit',
    icon: Stethoscope,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  {
    id: 'limitations',
    title: 'Beperkingen',
    shortTitle: 'B',
    description: 'ADL, werk en sport gerelateerde beperkingen',
    icon: Activity,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
];

export interface PHSBResultsPanelProps {
  phsbData: PHSBStructure;
  preparationContent?: string;
  onNavigateNext?: () => void;
  nextButtonLabel?: string;
  disabled?: boolean;
  className?: string;
  showSources?: boolean;
  audioSource?: boolean;
  manualSource?: boolean;
  onDataChange?: (updatedData: PHSBStructure) => void;
  enableEditing?: boolean;
}

const PHSBResultsPanel: React.FC<PHSBResultsPanelProps> = ({
  phsbData,
  preparationContent,
  onNavigateNext,
  nextButtonLabel = 'Ga naar Onderzoek',
  disabled = false,
  className,
  showSources = false,
  audioSource = false,
  manualSource = false,
  onDataChange,
  enableEditing = true,
}) => {
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set());
  const [showFullView, setShowFullView] = React.useState(false);
  const [localData, setLocalData] = React.useState<PHSBStructure>(phsbData);
  const [editingSection, setEditingSection] = React.useState<string | null>(null);

  // Update local data when props change and parse if needed
  React.useEffect(() => {
    // If individual sections are empty but fullStructuredText exists, parse it
    if (phsbData.fullStructuredText && 
        !phsbData.patientNeeds && 
        !phsbData.history && 
        !phsbData.disorders && 
        !phsbData.limitations) {
      const parsedData = parsePHSBText(phsbData.fullStructuredText);
      setLocalData(parsedData);
    } else {
      setLocalData(phsbData);
    }
  }, [phsbData]);

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const copySectionContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('PHSB sectie gekopieerd naar clipboard');
    } catch (err) {
      console.error('Failed to copy section to clipboard:', err);
    }
  };

  const copyFullPHSB = async () => {
    try {
      await navigator.clipboard.writeText(localData.fullStructuredText);
      console.log('Volledige PHSB gekopieerd naar clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const updateSectionContent = (sectionId: keyof PHSBStructure, newContent: string) => {
    const updatedData = {
      ...localData,
      [sectionId]: newContent
    };
    
    // Rebuild full structured text if individual sections change
    if (sectionId !== 'fullStructuredText' && sectionId !== 'redFlags') {
      updatedData.fullStructuredText = buildFullStructuredText(updatedData);
    }
    
    setLocalData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const buildFullStructuredText = (data: PHSBStructure): string => {
    const sections = [];
    
    if (data.patientNeeds) {
      sections.push(`**P - Patiënt Probleem/Hulpvraag:**\n${data.patientNeeds}`);
    }
    
    if (data.history) {
      sections.push(`**H - Historie:**\n${data.history}`);
    }
    
    if (data.disorders) {
      sections.push(`**S - Stoornissen in lichaamsfuncties en anatomische structuren:**\n${data.disorders}`);
    }
    
    if (data.limitations) {
      sections.push(`**B - Beperkingen:**\n${data.limitations}`);
    }
    
    if (data.redFlags && data.redFlags.length > 0) {
      const redFlagsText = data.redFlags.map(flag => `[RODE VLAG: ${flag}]`).join('\n');
      sections.push(`**Rode Vlagen:**\n${redFlagsText}`);
    }
    
    return sections.join('\n\n');
  };

  // Editable text component
  const EditableText: React.FC<{
    content: string;
    sectionId: keyof PHSBStructure;
    placeholder?: string;
    multiline?: boolean;
  }> = ({ content, sectionId, placeholder, multiline = true }) => {
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

    if (!enableEditing) {
      return (
        <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
          {content || placeholder}
        </pre>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-hysio-mint/40 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint resize-y font-inter text-sm"
              rows={Math.max(3, tempValue.split('\n').length + 1)}
              placeholder={placeholder}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-hysio-mint/40 rounded-md shadow-sm focus:ring-hysio-mint focus:border-hysio-mint font-inter text-sm"
              placeholder={placeholder}
              autoFocus
            />
          )}
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
        className="cursor-text hover:bg-hysio-mint/5 p-2 rounded-md transition-colors group"
      >
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
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* PHSB Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-hysio-deep-green flex items-center gap-3">
              <div className="w-12 h-12 bg-hysio-mint/20 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-hysio-deep-green" />
              </div>
              FysioRoadmap Anamnesekaart
            </h2>
            <p className="text-hysio-deep-green-900/70 mt-2">
              Gestructureerde anamnese volgens FysioRoadmap-format (Patiëntbehoeften, Historie, Stoornissen, Beperkingen)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowFullView(!showFullView)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Eye size={16} />
              {showFullView ? 'Compact weergave' : 'Volledige weergave'}
            </Button>
            
            <Button
              onClick={copyFullPHSB}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={disabled}
            >
              <Copy size={16} />
              Kopiëer Volledig
            </Button>
          </div>
        </div>

        {/* Show sources used */}
        {showSources && (
          <div className="flex flex-wrap gap-2 mb-4">
            {audioSource && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                <Mic size={14} className="mr-2" />
                Audio transcriptie gebruikt
              </span>
            )}
            {manualSource && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                <Edit3 size={14} className="mr-2" />
                Handmatige notities gebruikt
              </span>
            )}
          </div>
        )}
      </div>

      {/* PHSB Sections */}
      <div className="space-y-4">
        {showFullView ? (
          // Full structured text view
          <Card className="border-2 border-hysio-mint/20 bg-hysio-cream/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-hysio-deep-green">
                  Volledige FysioRoadmap Structuur
                </h3>
                <Button
                  onClick={copyFullPHSB}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Copy size={14} />
                  Kopiëren
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <EditableText
                  content={localData.fullStructuredText}
                  sectionId="fullStructuredText"
                  placeholder="Volledige FysioRoadmap structuur..."
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          // Individual collapsible sections
          phsbSections.map((section) => {
            const isCollapsed = collapsedSections.has(section.id);
            const sectionContent = localData[section.id] as string || '';
            
            return (
              <Card key={section.id} className={cn('border-2', section.bgColor, 'border-opacity-30')}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        section.bgColor
                      )}>
                        <section.icon size={20} className={section.color} />
                      </div>
                      <div>
                        <h3 className={cn('text-lg font-semibold', section.color)}>
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copySectionContent(sectionContent)}
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        disabled={disabled || !sectionContent.trim()}
                        title={`Kopiëer ${section.title}`}
                      >
                        <Copy size={14} />
                        <span className="sr-only">Kopiëer {section.shortTitle}</span>
                      </Button>
                      <Button
                        onClick={() => toggleSectionCollapse(section.id)}
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                      >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </Button>
                    </div>
                  </div>
                  
                  {!isCollapsed && (
                    <div className="mt-4 pl-13">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <EditableText
                          content={sectionContent}
                          sectionId={section.id}
                          placeholder={`Voer ${section.title.toLowerCase()} in...`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Enhanced Preparation Reference */}
      {preparationContent && (
        <Card className="border-2 border-amber-200 bg-amber-50/30 mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Lightbulb size={20} className="text-amber-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">
                    Intake Voorbereiding (Referentie)
                  </h3>
                  <p className="text-sm text-amber-700/80">
                    AI-gegenereerde voorbereiding voor dit consult
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => copySectionContent(preparationContent)}
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-amber-700 hover:text-amber-800"
                  disabled={disabled}
                >
                  <Copy size={14} />
                  Kopiëren
                </Button>
                <Button
                  onClick={() => toggleSectionCollapse('preparation')}
                  variant="ghost"
                  size="sm"
                  className="text-amber-700"
                  disabled={disabled}
                >
                  {collapsedSections.has('preparation') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </Button>
              </div>
            </div>
            
            {!collapsedSections.has('preparation') && (
              <div className="pl-13">
                <div className="bg-white p-4 rounded-lg border border-amber-200">
                  <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
                    {preparationContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};

export { PHSBResultsPanel };