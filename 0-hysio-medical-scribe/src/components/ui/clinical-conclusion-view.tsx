import * as React from 'react';
import { cn } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { 
  FileText, 
  Download, 
  FileDown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';
import type { IntakeData, PatientInfo } from '@/lib/types';

export interface ClinicalConclusionViewProps {
  intakeData: IntakeData;
  patientInfo: PatientInfo;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  className?: string;
}

const ClinicalConclusionView: React.FC<ClinicalConclusionViewProps> = ({
  intakeData,
  patientInfo,
  onExportPDF,
  onExportWord,
  isExporting = false,
  disabled = false,
  className,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={cn('w-full p-6 space-y-6', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-hysio-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-hysio-deep-green" />
        </div>
        <h1 className="text-3xl font-bold text-hysio-deep-green mb-2">
          Klinische Conclusie
        </h1>
        <p className="text-hysio-deep-green-900/70">
          Volledig intake rapport - {formatDate(intakeData.createdAt)}
        </p>
      </div>

      {/* Patient Summary (Anonymous) */}
      <Card className="border-hysio-mint/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-hysio-deep-green">
            <User size={18} />
            Patiënt Profiel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-hysio-cream/30 p-3 rounded-lg">
              <span className="font-medium text-hysio-deep-green">Leeftijd:</span>
              <p className="text-hysio-deep-green-900/80">
                ca. {new Date().getFullYear() - parseInt(patientInfo.birthYear)} jaar
              </p>
            </div>
            <div className="bg-hysio-cream/30 p-3 rounded-lg">
              <span className="font-medium text-hysio-deep-green">Geslacht:</span>
              <p className="text-hysio-deep-green-900/80 capitalize">
                {patientInfo.gender}
              </p>
            </div>
            <div className="bg-hysio-cream/30 p-3 rounded-lg">
              <span className="font-medium text-hysio-deep-green">Hoofdklacht:</span>
              <p className="text-hysio-deep-green-900/80">
                {patientInfo.chiefComplaint}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Conclusion */}
      <Card className="border-hysio-mint/20 bg-hysio-cream/10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-hysio-deep-green">
              <FileText size={18} />
              Klinische Conclusie
            </CardTitle>
            <CopyToClipboard text={intakeData.clinicalConclusion} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
            <div className="bg-white/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-inter">
                {intakeData.clinicalConclusion}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags Alert */}
      {intakeData.redFlags && intakeData.redFlags.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={18} />
              Rode Vlagen Gedetecteerd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {intakeData.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2 text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Supporting Documentation Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Anamnese Summary */}
        {intakeData.phsbStructure && (
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-700 text-base">FysioRoadmap Anamnese</CardTitle>
                <CopyToClipboard text={intakeData.phsbStructure.fullStructuredText} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 mb-2">Gestructureerde anamnese volgens PHSB methode</p>
                <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed">
                    {intakeData.phsbStructure.fullStructuredText}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Examination Summary */}
        {intakeData.examinationFindings && (
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-700 text-base">Onderzoeksbevindingen</CardTitle>
                <CopyToClipboard text={intakeData.examinationFindings} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 mb-2">Lichamelijk onderzoek en bevindingen</p>
                <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed">
                    {intakeData.examinationFindings}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Section */}
      <Card className="border-2 border-hysio-mint/30 bg-hysio-mint/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-hysio-deep-green">
            <Download size={18} />
            Rapport Exporteren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-hysio-deep-green-900/70 mb-6">
            Exporteer het volledige rapport als professioneel document. 
            Alle gegevens worden geanonimiseerd voor privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onExportPDF}
              disabled={disabled || isExporting}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={18} className="mr-2" />
                  Exporteer als PDF
                </>
              )}
            </Button>
            
            <Button
              onClick={onExportWord}
              disabled={disabled || isExporting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporteren...
                </>
              ) : (
                <>
                  <FileDown size={18} className="mr-2" />
                  Exporteer als Word
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm text-hysio-deep-green-900/60 mb-2">
          Hysio Medical Scribe - AI-ondersteunde Fysiotherapie Documentatie
        </p>
        <p className="text-xs text-hysio-deep-green-900/50">
          Rapport gegenereerd op {formatDate(intakeData.updatedAt)} • 
          Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF) • 
          Alle AI-gegenereerde content moet worden geverifieerd door een bevoegd fysiotherapeut
        </p>
      </div>
    </div>
  );
};

export { ClinicalConclusionView };