import * as React from 'react';
import { cn } from '@/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  success?: boolean;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, label, hint, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption font-medium text-hysio-deep-green mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              'hysio-input hysio-focus-enhanced w-full transition-brand duration-brand',
              'focus:outline-none focus:ring-2 focus:ring-hysio-deep-green focus:border-hysio-deep-green',
              error && 'border-hysio-red-flag focus:ring-hysio-red-flag pr-10',
              success && 'border-hysio-emerald focus:ring-hysio-emerald pr-10',
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={cn(hintId, errorId)}
            {...props}
          />
          
          {/* Status icons */}
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <AlertCircle 
                className="h-5 w-5 text-hysio-red-flag" 
                aria-hidden="true" 
              />
            </div>
          )}
          {success && !error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckCircle 
                className="h-5 w-5 text-hysio-emerald" 
                aria-hidden="true" 
              />
            </div>
          )}
        </div>
        
        {/* Helper text */}
        {hint && !error && (
          <p 
            id={hintId}
            className="mt-2 text-caption text-hysio-deep-green-900/70"
          >
            {hint}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p 
            id={errorId}
            className="mt-2 text-caption text-hysio-red-flag flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };