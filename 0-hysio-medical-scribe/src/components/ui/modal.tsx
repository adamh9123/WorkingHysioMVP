import * as React from 'react';
import { cn } from '@/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full hysio-bg-surface rounded-modal shadow-brand-xl border border-hysio-deep-green/10',
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-hysio-deep-green/15">
            {title && (
              <h3 className="text-lg font-semibold text-hysio-deep-green">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-hysio-deep-green/60 hover:text-hysio-deep-green hover:bg-hysio-deep-green/10"
              >
                <X size={16} />
                <span className="sr-only">Sluiten</span>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'p-6',
          !title && !showCloseButton && 'pt-6'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };