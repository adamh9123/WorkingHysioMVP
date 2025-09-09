import * as React from 'react';
import { Button } from './button';
import { cn } from '@/utils';
import { copyToClipboard } from '@/utils';
import { Check, Copy } from 'lucide-react';

export interface CopyToClipboardProps {
  text: string;
  className?: string;
  variant?: 'button' | 'icon' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showFeedback?: boolean;
  feedbackDuration?: number;
  children?: React.ReactNode;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  className,
  variant = 'button',
  size = 'md',
  showFeedback = true,
  feedbackDuration = 2000,
  children,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleCopy = async () => {
    if (isLoading || isCopied) return;
    
    setIsLoading(true);
    
    try {
      const success = await copyToClipboard(text);
      
      if (success && showFeedback) {
        setIsCopied(true);
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, feedbackDuration);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const Icon = isCopied ? Check : Copy;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center justify-center transition-colors hover:bg-hysio-mint/10 rounded p-1',
          isCopied && 'text-hysio-emerald',
          className
        )}
        title={isCopied ? 'Gekopieerd!' : 'Kopiëren naar klembord'}
        disabled={isLoading}
      >
        <Icon size={iconSize} />
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-1 cursor-pointer text-hysio-deep-green hover:text-hysio-mint-dark transition-colors text-sm',
          isCopied && 'text-hysio-emerald',
          className
        )}
        title={isCopied ? 'Gekopieerd!' : 'Kopiëren naar klembord'}
      >
        <Icon size={12} />
        {isCopied ? 'Gekopieerd!' : 'Kopiëren'}
      </span>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={handleCopy}
      variant={isCopied ? 'outline' : 'secondary'}
      size={size}
      loading={isLoading}
      className={cn(
        'gap-2',
        isCopied && 'border-hysio-emerald text-hysio-emerald hover:bg-hysio-emerald/10',
        className
      )}
      disabled={isLoading}
    >
      <Icon size={iconSize} />
      {children || (isCopied ? 'Gekopieerd!' : 'Kopiëren')}
    </Button>
  );
};

export { CopyToClipboard };