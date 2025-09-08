import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  estimatedTime?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  optional?: boolean;
  disabled?: boolean;
}

export interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  showEstimatedTimes?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  steps,
  currentStepId,
  onStepClick,
  orientation = 'horizontal',
  showDescriptions = true,
  showEstimatedTimes = true,
  allowNavigation = true,
  className,
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  
  const getStepStatus = (step: WorkflowStep, index: number) => {
    if (step.status === 'error') return 'error';
    if (step.status === 'completed') return 'completed';
    if (step.id === currentStepId) return 'current';
    if (index < currentStepIndex) return 'completed';
    if (step.disabled) return 'disabled';
    return 'pending';
  };

  const isStepClickable = (step: WorkflowStep, index: number) => {
    if (!allowNavigation || !onStepClick) return false;
    if (step.disabled) return false;
    if (step.status === 'error') return true;
    if (step.status === 'completed') return true;
    if (step.id === currentStepId) return true;
    // Allow navigation to next step if current is completed
    if (index === currentStepIndex + 1 && steps[currentStepIndex]?.status === 'completed') {
      return true;
    }
    return false;
  };

  const renderStepIndicator = (step: WorkflowStep, index: number) => {
    const status = getStepStatus(step, index);
    const IconComponent = step.icon || Circle;
    
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-white" />
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 bg-hysio-mint border-2 border-hysio-deep-green rounded-full flex items-center justify-center animate-pulse">
            <IconComponent size={16} className="text-hysio-deep-green" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-white" />
          </div>
        );
      case 'disabled':
        return (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <IconComponent size={16} className="text-gray-400" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
            <IconComponent size={16} className="text-gray-500" />
          </div>
        );
    }
  };

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;
    
    const isCompleted = steps[index].status === 'completed';
    const isActive = index < currentStepIndex;
    
    if (orientation === 'horizontal') {
      return (
        <div className="flex-1 flex items-center px-2">
          <div className={cn(
            'h-0.5 flex-1 transition-colors',
            isCompleted || isActive ? 'bg-green-500' : 'bg-gray-300'
          )}>
            {(isCompleted || isActive) && (
              <ArrowRight size={16} className="text-green-500 -mt-2 ml-auto" />
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-center py-2">
          <div className={cn(
            'w-0.5 h-8 transition-colors',
            isCompleted || isActive ? 'bg-green-500' : 'bg-gray-300'
          )} />
        </div>
      );
    }
  };

  const renderStep = (step: WorkflowStep, index: number) => {
    const status = getStepStatus(step, index);
    const isClickable = isStepClickable(step, index);
    
    const stepContent = (
      <div 
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-all',
          orientation === 'vertical' && 'flex-row',
          orientation === 'horizontal' && 'flex-col text-center',
          isClickable && 'cursor-pointer hover:bg-hysio-mint/10',
          status === 'current' && 'bg-hysio-mint/20 border border-hysio-mint',
          status === 'completed' && 'bg-green-50 border border-green-200',
          status === 'error' && 'bg-red-50 border border-red-200',
          !isClickable && 'cursor-default'
        )}
        onClick={() => isClickable && onStepClick?.(step.id)}
      >
        {orientation === 'horizontal' && renderStepIndicator(step, index)}
        
        <div className={cn(
          'flex-1',
          orientation === 'horizontal' && 'text-center',
          orientation === 'vertical' && 'ml-3'
        )}>
          {orientation === 'vertical' && renderStepIndicator(step, index)}
          
          <div className={cn(
            orientation === 'vertical' && 'ml-3 flex-1'
          )}>
            <h4 className={cn(
              'font-medium text-sm',
              status === 'completed' && 'text-green-800',
              status === 'current' && 'text-hysio-deep-green',
              status === 'error' && 'text-red-800',
              status === 'disabled' && 'text-gray-400',
              status === 'pending' && 'text-gray-600'
            )}>
              {step.title}
              {step.optional && (
                <span className="text-xs text-gray-500 ml-1">(optioneel)</span>
              )}
            </h4>
            
            {showDescriptions && step.description && (
              <p className={cn(
                'text-xs mt-1',
                status === 'completed' && 'text-green-600',
                status === 'current' && 'text-hysio-deep-green-900/70',
                status === 'error' && 'text-red-600',
                status === 'disabled' && 'text-gray-400',
                status === 'pending' && 'text-gray-500'
              )}>
                {step.description}
              </p>
            )}
            
            {showEstimatedTimes && step.estimatedTime && (
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs',
                status === 'completed' && 'text-green-600',
                status === 'current' && 'text-hysio-deep-green-900/70',
                status === 'error' && 'text-red-600',
                status === 'disabled' && 'text-gray-400',
                status === 'pending' && 'text-gray-500'
              )}>
                <Clock size={12} />
                {step.estimatedTime}
              </div>
            )}
            
            {status === 'in-progress' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Bezig...
              </div>
            )}
            
            {status === 'error' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle size={12} />
                Fout opgetreden
              </div>
            )}
          </div>
        </div>
      </div>
    );

    if (orientation === 'horizontal') {
      return (
        <div key={step.id} className="flex-1 min-w-0">
          {stepContent}
        </div>
      );
    } else {
      return (
        <div key={step.id} className="w-full">
          {stepContent}
        </div>
      );
    }
  };

  const completedCount = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-hysio-deep-green">
            Workflow Voortgang
          </h3>
          <span className="text-sm text-hysio-deep-green-900/70">
            {completedCount} van {totalSteps} stappen voltooid
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-hysio-mint to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Start</span>
          <span>{Math.round(progressPercentage)}% voltooid</span>
          <span>Voltooid</span>
        </div>
      </div>

      {/* Steps */}
      <div className={cn(
        orientation === 'horizontal' && 'flex items-start gap-2',
        orientation === 'vertical' && 'space-y-4'
      )}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {renderStep(step, index)}
            {orientation === 'horizontal' && renderConnector(index)}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Info */}
      {currentStepIndex >= 0 && currentStepIndex < steps.length && (
        <div className="mt-6 p-4 bg-hysio-mint/10 border border-hysio-mint/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-hysio-mint/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Play size={16} className="text-hysio-deep-green" />
            </div>
            <div>
              <h4 className="font-medium text-hysio-deep-green">
                Huidige stap: {steps[currentStepIndex].title}
              </h4>
              {steps[currentStepIndex].description && (
                <p className="text-sm text-hysio-deep-green-900/70 mt-1">
                  {steps[currentStepIndex].description}
                </p>
              )}
              {steps[currentStepIndex].estimatedTime && (
                <div className="flex items-center gap-1 mt-2 text-sm text-hysio-deep-green-900/70">
                  <Clock size={14} />
                  Geschatte tijd: {steps[currentStepIndex].estimatedTime}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { WorkflowProgress };

// Additional compact version for smaller spaces
export interface CompactProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  className?: string;
}

const CompactProgress: React.FC<CompactProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  className,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-hysio-deep-green">
          Stap {currentStep} van {totalSteps}
        </span>
        <span className="text-xs text-hysio-deep-green-900/70">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-hysio-mint h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {stepLabels[currentStep - 1] && (
        <p className="text-xs text-hysio-deep-green-900/70 mt-1">
          {stepLabels[currentStep - 1]}
        </p>
      )}
    </div>
  );
};

export { CompactProgress };