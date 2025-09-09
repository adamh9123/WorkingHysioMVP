import * as React from 'react';
import { cn } from '@/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const textareaId = id || `textarea-${React.useId()}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-hysio-deep-green mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'hysio-input min-h-[80px] resize-vertical',
            error && 'border-red-500 focus:outline-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };