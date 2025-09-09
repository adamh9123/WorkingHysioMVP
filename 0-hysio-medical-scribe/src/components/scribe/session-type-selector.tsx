import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, RotateCcw, Clock, FileText } from 'lucide-react';

export interface SessionTypeOption {
  id: 'intake' | 'followup';
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  estimatedTime: string;
  features: string[];
}

export interface SessionTypeSelectorProps {
  onSessionTypeSelect: (sessionType: 'intake' | 'followup') => void;
  disabled?: boolean;
  className?: string;
}

const sessionTypes: SessionTypeOption[] = [
  {
    id: 'intake',
    title: 'Nieuwe Intake',
    description: 'Eerste consult met nieuwe patiënt',
    icon: UserPlus,
    estimatedTime: '45-60 min',
    features: [
      '5-staps intake workflow',
      'FysioRoadmap anamnesekaart',
      'Automatische onderzoeksvoorstel',
      'Evidence-based diagnostiek',
      'Rode vlagen detectie',
    ],
  },
  {
    id: 'followup',
    title: 'Vervolgconsult',
    description: 'Follow-up met bestaande patiënt',
    icon: RotateCcw,
    estimatedTime: '20-30 min',
    features: [
      'SOEP documentatie',
      'Voortgang evaluatie',
      'Behandelplan aanpassing',
      'Snelle verslaglegging',
      'Hysio Assistant ondersteuning',
    ],
  },
];

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  onSessionTypeSelect,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('w-full max-w-4xl mx-auto p-6', className)}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-hysio-deep-green mb-3">
          Hysio Medical Scribe
        </h1>
        <p className="text-lg text-hysio-deep-green-900/80">
          Kies het type sessie om te beginnen met AI-ondersteunde documentatie
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {sessionTypes.map((sessionType) => {
          const IconComponent = sessionType.icon;
          
          return (
            <Card
              key={sessionType.id}
              className={cn(
                'transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]',
                'border-2 border-transparent hover:border-hysio-mint/50',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none'
              )}
              onClick={() => !disabled && onSessionTypeSelect(sessionType.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-hysio-mint/20 rounded-full flex items-center justify-center mb-4">
                  <IconComponent size={32} className="text-hysio-deep-green" />
                </div>
                <CardTitle className="text-xl font-semibold text-hysio-deep-green">
                  {sessionType.title}
                </CardTitle>
                <CardDescription className="text-hysio-deep-green-900/70">
                  {sessionType.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-hysio-deep-green-900/80">
                  <Clock size={16} />
                  <span>Geschatte duur: {sessionType.estimatedTime}</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-hysio-deep-green text-sm">
                    Functionaliteiten:
                  </h4>
                  <ul className="space-y-1">
                    {sessionType.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-hysio-deep-green-900/80"
                      >
                        <div className="w-1.5 h-1.5 bg-hysio-mint rounded-full mt-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="w-full mt-6"
                  variant="primary"
                  size="lg"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onSessionTypeSelect(sessionType.id);
                  }}
                >
                  <FileText size={20} className="mr-2" />
                  Start {sessionType.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-hysio-deep-green-900/60">
          Alle gegenereerde content wordt ondersteund door AI en voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)
        </p>
        <p className="text-xs text-hysio-deep-green-900/50 mt-2">
          <strong>Belangrijk:</strong> Altijd nazien door een bevoegd fysiotherapeut
        </p>
      </div>
    </div>
  );
};

export { SessionTypeSelector };