import * as React from 'react';
import { cn } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { 
  Stethoscope, 
  ChevronRight, 
  Target,
  Edit3,
  Mic
} from 'lucide-react';

export interface ExaminationResultsPanelProps {
  examinationFindings: string;
  examinationPlan?: string;
  onNavigateNext?: () => void;
  nextButtonLabel?: string;
  disabled?: boolean;
  className?: string;
  showSources?: boolean;
  audioSource?: boolean;
  manualSource?: boolean;
}

const ExaminationResultsPanel: React.FC<ExaminationResultsPanelProps> = ({
  examinationFindings,
  examinationPlan,
  onNavigateNext,
  nextButtonLabel = 'Ga naar Klinische Conclusie',
  disabled = false,
  className,
  showSources = false,
  audioSource = false,
  manualSource = false,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Examination Findings */}
      <Card className="border-hysio-mint/20 bg-hysio-cream/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope size={18} className="text-hysio-deep-green" />
              <h4 className="font-semibold text-hysio-deep-green">
                Onderzoeksbevindingen
              </h4>
            </div>
            <CopyToClipboard text={examinationFindings} size="sm" />
          </div>
          
          {/* Show sources used */}
          {showSources && (
            <div className="mb-3 flex flex-wrap gap-2">
              {audioSource && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <Mic size={12} className="mr-1" />
                  Audio transcriptie
                </span>
              )}
              {manualSource && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <Edit3 size={12} className="mr-1" />
                  Handmatige notities
                </span>
              )}
            </div>
          )}
          
          <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
            <pre className="whitespace-pre-wrap font-inter text-sm bg-white/50 rounded p-3">
              {examinationFindings}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Examination Plan Reference */}
      {examinationPlan && (
        <CollapsibleSection 
          title="Onderzoeksvoorstel (referentie)"
          defaultOpen={false}
        >
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-gray-600" />
                  <h5 className="font-medium text-gray-700">Onderzoeksplan</h5>
                </div>
                <CopyToClipboard text={examinationPlan} size="sm" variant="ghost" />
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                <pre className="whitespace-pre-wrap font-inter text-sm bg-white/50 rounded p-3">
                  {examinationPlan}
                </pre>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Navigation Button */}
      {onNavigateNext && nextButtonLabel && (
        <div className="pt-4 border-t border-hysio-mint/20">
          <Button
            onClick={onNavigateNext}
            disabled={disabled}
            size="lg"
            className="w-full bg-hysio-deep-green hover:bg-hysio-deep-green-900"
          >
            {nextButtonLabel}
            <ChevronRight size={20} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export { ExaminationResultsPanel };