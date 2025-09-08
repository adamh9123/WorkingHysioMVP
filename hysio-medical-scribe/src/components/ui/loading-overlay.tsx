import * as React from 'react';
import { cn } from '@/utils';
import { Spinner } from './spinner';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  loading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  backdrop?: boolean;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message,
  size = 'md',
  backdrop = true,
  transparent = false,
  className,
  children,
  ...props
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="relative" {...props}>
      {children}
      
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          backdrop && !transparent && 'bg-white/80 backdrop-blur-sm',
          backdrop && transparent && 'bg-black/20 backdrop-blur-sm',
          'z-10',
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner size={size} color="primary" />
          {message && (
            <p className="text-sm text-hysio-deep-green-900 font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { LoadingOverlay };