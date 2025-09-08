import * as React from 'react';
import { cn } from '@/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'none';
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  labelPosition = 'outside',
  animated = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-hysio-mint',
    success: 'bg-hysio-emerald',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const containerClasses = cn(
    'w-full bg-gray-200 rounded-full overflow-hidden',
    sizeClasses[size],
    className
  );

  const barClasses = cn(
    'h-full transition-all duration-300 ease-out',
    variantClasses[variant],
    animated && 'animate-pulse'
  );

  return (
    <div className="w-full">
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between text-sm text-hysio-deep-green-900 mb-1">
          <span>Voortgang</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={containerClasses} {...props}>
        <div
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${Math.round(percentage)}% voltooid`}
        >
          {showLabel && labelPosition === 'inside' && size === 'lg' && (
            <span className="flex items-center justify-center h-full text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export { ProgressBar };