import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Stethoscope, 
  CheckCircle,
  ChevronRight
} from 'lucide-react';

type WorkflowPhase = 'anamnesis' | 'examination' | 'clinical-conclusion';

interface WorkflowStep {
  id: WorkflowPhase;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'anamnesis',
    title: 'Anamnese',
    description: 'PHSB gestructureerde anamnese',
    icon: FileText,
  },
  {
    id: 'examination',
    title: 'Onderzoek',
    description: 'Lichamelijk onderzoek',
    icon: Stethoscope,
  },
  {
    id: 'clinical-conclusion',
    title: 'Klinische Conclusie',
    description: 'Diagnose & behandelplan',
    icon: CheckCircle,
  },
];

export interface WorkflowStepperProps {
  currentPhase: WorkflowPhase;
  completedPhases?: WorkflowPhase[];
  onPhaseClick?: (phase: WorkflowPhase) => void;
  disabled?: boolean;
  className?: string;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentPhase,
  completedPhases = [],
  onPhaseClick,
  disabled = false,
  className,
}) => {
  const handleStepClick = (step: WorkflowStep) => {
    // Allow clicking on completed steps or current step
    const isCompleted = completedPhases.includes(step.id);
    const isCurrent = currentPhase === step.id;
    const isClickable = isCompleted || isCurrent;
    
    if (!disabled && isClickable && onPhaseClick) {
      onPhaseClick(step.id);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {workflowSteps.map((step, index) => {
          const isCompleted = completedPhases.includes(step.id);
          const isCurrent = currentPhase === step.id;
          const isClickable = isCompleted || isCurrent;
          const IconComponent = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1 relative">
                {/* Step Button */}
                <Button
                  variant="ghost"
                  onClick={() => handleStepClick(step)}
                  disabled={disabled || !isClickable}
                  className={cn(
                    'w-full max-w-[200px] px-3 py-2 h-auto flex-row gap-2 rounded-md transition-all duration-200',
                    'border border-transparent',
                    isCurrent && 'border-hysio-mint/50 bg-hysio-mint/5',
                    isCompleted && !isCurrent && 'border-green-200/50 bg-green-50/30',
                    !isCurrent && !isCompleted && 'border-gray-200/50 bg-gray-50/30',
                    !isClickable && 'opacity-40 cursor-not-allowed',
                    isClickable && !disabled && 'hover:border-hysio-mint/40 hover:bg-hysio-mint/10'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isCompleted ? 'bg-green-100' : 
                    isCurrent ? 'bg-hysio-mint/20' : 'bg-gray-100'
                  )}>
                    <IconComponent 
                      size={14} 
                      className={cn(
                        isCompleted ? 'text-green-600' : 
                        isCurrent ? 'text-hysio-deep-green' : 'text-gray-400'
                      )}
                    />
                  </div>
                  
                  {/* Step Info */}
                  <div className="text-left flex-1">
                    <h3 className={cn(
                      'font-medium text-xs',
                      isCompleted ? 'text-green-700' : 
                      isCurrent ? 'text-hysio-deep-green' : 'text-gray-600'
                    )}>
                      {step.title}
                    </h3>
                  </div>
                  
                  {/* Status indicator */}
                  {isCompleted && (
                    <CheckCircle 
                      size={12} 
                      className="text-green-600 flex-shrink-0"
                    />
                  )}
                  {isCurrent && !isCompleted && (
                    <div className="w-2 h-2 rounded-full bg-hysio-mint animate-pulse flex-shrink-0" />
                  )}
                </Button>
              </div>
              
              {/* Arrow connector */}
              {index < workflowSteps.length - 1 && (
                <div className="flex items-center px-1">
                  <ChevronRight 
                    size={14} 
                    className={cn(
                      'text-gray-300',
                      isCompleted && 'text-green-300'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Progress Bar - simplified */}
      <div className="mt-3 relative">
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-hysio-mint rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${((completedPhases.length + (currentPhase ? 1 : 0)) / workflowSteps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { WorkflowStepper };
export type { WorkflowPhase };