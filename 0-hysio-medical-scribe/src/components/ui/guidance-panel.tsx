import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import { 
  FileText, 
  Target, 
  RotateCcw, 
  Lightbulb,
  ChevronRight
} from 'lucide-react';

export interface GuidancePanelProps {
  phase: 'preparation' | 'examination-planning';
  onGenerateClick: () => void;
  onNavigateNext?: () => void;
  generatedContent?: string;
  isGenerating?: boolean;
  showGenerated?: boolean;
  nextButtonLabel?: string;
  disabled?: boolean;
  className?: string;
  preparationContent?: string; // For showing preparation under PHSB results
  showPreparationReference?: boolean;
}

const GuidancePanel: React.FC<GuidancePanelProps> = ({
  phase,
  onGenerateClick,
  onNavigateNext,
  generatedContent,
  isGenerating = false,
  showGenerated = false,
  nextButtonLabel,
  disabled = false,
  className,
  preparationContent,
  showPreparationReference = false,
}) => {
  const phaseConfig = {
    preparation: {
      title: 'Intake Voorbereiding',
      description: 'Genereer een gestructureerde voorbereiding op basis van patiëntgegevens',
      buttonLabel: 'Genereer Intakevoorbereiding',
      icon: FileText,
      generatingText: 'Voorbereiding genereren...',
      completedTitle: 'Gegenereerde Voorbereiding',
    },
    'examination-planning': {
      title: 'Onderzoeksvoorstel',
      description: 'Genereer een onderzoeksplan op basis van anamnese bevindingen',
      buttonLabel: 'Genereer Onderzoeksvoorstel',
      icon: Target,
      generatingText: 'Onderzoeksvoorstel genereren...',
      completedTitle: 'Gegenereerd Onderzoeksvoorstel',
    }
  };

  const config = phaseConfig[phase];
  const IconComponent = config.icon;

  // Initial state - show generate button
  if (!showGenerated && !generatedContent) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-hysio-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent size={32} className="text-hysio-deep-green" />
          </div>
          <h3 className="text-lg font-semibold text-hysio-deep-green mb-2">
            {config.title}
          </h3>
          <p className="text-hysio-deep-green-900/70 mb-6 max-w-md mx-auto">
            {config.description}
          </p>
          <Button
            onClick={onGenerateClick}
            disabled={isGenerating || disabled}
            size="lg"
            className="px-8"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {config.generatingText}
              </>
            ) : (
              <>
                <IconComponent size={20} className="mr-2" />
                {config.buttonLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Generated content state
  return (
    <div className={cn('space-y-6', className)}>
      {/* Generated Content */}
      {generatedContent && (
        <Card className="border-hysio-mint/20 bg-hysio-cream/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <IconComponent size={18} className="text-hysio-deep-green" />
                <h4 className="font-semibold text-hysio-deep-green">
                  {config.completedTitle}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <CopyToClipboard text={generatedContent} size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGenerateClick}
                  disabled={isGenerating}
                  className="text-hysio-deep-green hover:text-hysio-deep-green-900"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Vernieuwen
                </Button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-hysio-deep-green-900">
              <pre className="whitespace-pre-wrap font-inter text-sm bg-white/50 rounded p-3">
                {generatedContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference to Preparation (shown under PHSB results) */}
      {showPreparationReference && preparationContent && (
        <CollapsibleSection 
          title="Voorbereiding (Stap 1) - Referentie"
          defaultOpen={false}
        >
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-gray-600" />
                  <h5 className="font-medium text-gray-700">Intake Voorbereiding</h5>
                </div>
                <CopyToClipboard text={preparationContent} size="sm" variant="ghost" />
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                <pre className="whitespace-pre-wrap font-inter text-sm bg-white/50 rounded p-3">
                  {preparationContent}
                </pre>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Navigation Button */}
      {onNavigateNext && nextButtonLabel && generatedContent && (
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

export { GuidancePanel };