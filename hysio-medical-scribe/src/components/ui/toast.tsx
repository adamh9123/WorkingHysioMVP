import * as React from 'react';
import { cn } from '@/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  closable?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  variant = 'default',
  title,
  description,
  duration = 5000,
  onClose,
  closable = true,
  className,
  children,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const variantStyles = {
    default: {
      bg: 'bg-white border-hysio-mint/30',
      icon: Info,
      iconColor: 'text-hysio-deep-green',
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const { bg, icon: Icon, iconColor } = variantStyles[variant];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        'animate-in slide-in-from-top-full duration-300',
        bg,
        className
      )}
      role="alert"
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColor)} />
      
      <div className="flex-1">
        {title && (
          <h4 className="text-sm font-semibold text-hysio-deep-green mb-1">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm text-hysio-deep-green-900/80">
            {description}
          </p>
        )}
        {children}
      </div>

      {closable && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Toast sluiten"
        >
          <X className="h-4 w-4 text-hysio-deep-green-900/50" />
        </button>
      )}
    </div>
  );
};

// Toast container for managing multiple toasts
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notificaties"
    />
  );
};

export { Toast, ToastContainer };