/**
 * Modal for viewing and editing complete SOEP documentation
 * Provides a full-screen editable view of all SOEP sections
 */

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Save, 
  X, 
  Edit3, 
  FileText,
  Download
} from 'lucide-react';
import { SOEPStructure, PatientInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface SOEPViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientInfo: PatientInfo;
  soepData: SOEPStructure;
  onSave?: (editedData: SOEPStructure) => void;
  onExport?: () => void;
  readonly?: boolean;
}

interface SOEPField {
  id: keyof SOEPStructure;
  title: string;
  placeholder: string;
  rows: number;
}

const soepFields: SOEPField[] = [
  {
    id: 'subjective',
    title: 'Subjectief (S)',
    placeholder: 'Wat de patiënt vertelt - klachten, ervaringen, gevoelens...',
    rows: 4
  },
  {
    id: 'objective',
    title: 'Objectief (O)',
    placeholder: 'Observaties en meetresultaten van de therapeut...',
    rows: 4
  },
  {
    id: 'evaluation',
    title: 'Evaluatie (E)',
    placeholder: 'Analyse en interpretatie van bevindingen...',
    rows: 4
  },
  {
    id: 'plan',
    title: 'Plan (P)',
    placeholder: 'Behandelplan en vervolgstappen...',
    rows: 4
  }
];

export const SOEPViewModal: React.FC<SOEPViewModalProps> = ({
  isOpen,
  onClose,
  patientInfo,
  soepData,
  onSave,
  onExport,
  readonly = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableData, setEditableData] = React.useState<SOEPStructure>(soepData);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Reset state when modal opens/closes or data changes
  React.useEffect(() => {
    if (isOpen) {
      setEditableData(soepData);
      setIsEditing(false);
      setHasChanges(false);
    }
  }, [isOpen, soepData]);

  const getAgeFromBirthYear = (birthYear: string): number => {
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(birthYear);
  };

  const updateField = (field: keyof SOEPStructure, value: string) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave && hasChanges) {
      onSave(editableData);
      setHasChanges(false);
    }
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setEditableData(soepData);
    setHasChanges(false);
    setIsEditing(false);
  };

  const generateFullText = () => {
    const age = getAgeFromBirthYear(patientInfo.birthYear);
    
    return `SOEP DOCUMENTATIE

Patiënt: ${patientInfo.initials}
Leeftijd: ${age} jaar
Geslacht: ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

═══════════════════════════════════════

SUBJECTIEF (S)
${editableData.subjective || 'Geen informatie'}

OBJECTIEF (O)
${editableData.objective || 'Geen informatie'}

EVALUATIE (E)
${editableData.evaluation || 'Geen informatie'}

PLAN (P)
${editableData.plan || 'Geen informatie'}

${editableData.redFlags && editableData.redFlags.length > 0 ? `
RODE VLAGEN
${editableData.redFlags.map(flag => `• ${flag}`).join('\\n')}
` : ''}
═══════════════════════════════════════

Gegenereerd: ${new Date().toLocaleString('nl-NL')}`;
  };

  const copyFullText = async () => {
    try {
      const fullText = generateFullText();
      await navigator.clipboard.writeText(fullText);
      console.log('Volledige SOEP gekopieerd naar clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Volledige SOEP Documentatie"
      size="xl"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-hysio-deep-green flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Volledige SOEP Documentatie
              </h2>
              <p className="mt-1 text-gray-600">
                {patientInfo.initials}, {getAgeFromBirthYear(patientInfo.birthYear)} jaar - {patientInfo.chiefComplaint}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={copyFullText}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Copy size={16} />
                Kopiëren
              </Button>
              
              {onExport && (
                <Button
                  onClick={onExport}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download size={16} />
                  Exporteren
                </Button>
              )}
              
              {!readonly && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <Edit3 size={16} />
                  Bewerken
                </Button>
              )}
              
              {isEditing && (
                <>
                  <Button
                    onClick={handleDiscard}
                    variant="ghost"
                    size="sm"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleSave}
                    variant="default"
                    size="sm"
                    className="gap-2"
                    disabled={!hasChanges}
                  >
                    <Save size={16} />
                    Opslaan
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {hasChanges && (
            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                U heeft wijzigingen gemaakt die nog niet zijn opgeslagen.
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Red Flags Alert */}
            {editableData.redFlags && editableData.redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  🚩 Rode Vlagen Gedetecteerd
                </h4>
                <ul className="space-y-1">
                  {editableData.redFlags.map((flag, index) => (
                    <li key={index} className="text-red-700 text-sm">
                      • {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SOEP Fields */}
            {soepFields.map((field) => {
              const content = editableData[field.id] as string || '';
              
              return (
                <div key={field.id} className="space-y-2">
                  <Label 
                    htmlFor={`soep-${field.id}`}
                    className="text-lg font-semibold text-hysio-deep-green"
                  >
                    {field.title}
                  </Label>
                  
                  {isEditing ? (
                    <Textarea
                      id={`soep-${field.id}`}
                      value={content}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      rows={field.rows}
                      className="resize-none"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      {content ? (
                        <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-gray-800">
                          {content}
                        </pre>
                      ) : (
                        <p className="text-gray-500 italic text-sm">
                          Geen informatie beschikbaar voor {field.title.toLowerCase()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Laatst bijgewerkt: {new Date().toLocaleString('nl-NL')}
            </div>
            <div>
              {isEditing && hasChanges && (
                <span className="text-amber-600 font-medium">
                  Niet opgeslagen wijzigingen
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};