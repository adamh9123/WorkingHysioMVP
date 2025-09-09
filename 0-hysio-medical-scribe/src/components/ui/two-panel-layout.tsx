import * as React from 'react';
import { cn } from '@/utils';

export interface TwoPanelLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
  splitRatio?: number; // 0-100, default 50 (50/50 split)
  resizable?: boolean;
}

const TwoPanelLayout = React.forwardRef<HTMLDivElement, TwoPanelLayoutProps>(
  ({ 
    className,
    leftPanel,
    rightPanel,
    leftPanelClassName,
    rightPanelClassName,
    splitRatio = 60, // 60/40 split favoring left panel (structured output)
    resizable = true,
    ...props 
  }, ref) => {
    const [leftWidth, setLeftWidth] = React.useState(splitRatio);
    const [isResizing, setIsResizing] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      if (!resizable) return;
      e.preventDefault();
      setIsResizing(true);
    }, [resizable]);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(constrainedWidth);
    }, [isResizing]);

    const handleMouseUp = React.useCallback(() => {
      setIsResizing(false);
    }, []);

    React.useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
      <div
        ref={containerRef}
        className={cn(
          'flex h-full w-full bg-background-primary',
          className
        )}
        {...props}
      >
        {/* Left Panel - Structured Output */}
        <div
          className={cn(
            'flex flex-col bg-background-surface border-r border-border-muted',
            leftPanelClassName
          )}
          style={{ width: `${leftWidth}%` }}
        >
          {leftPanel}
        </div>
        
        {/* Resize Handle */}
        {resizable && (
          <div
            className={cn(
              'w-1 bg-border-muted hover:bg-border-primary/40 cursor-col-resize transition-colors flex-shrink-0',
              isResizing && 'bg-border-primary/60'
            )}
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
          />
        )}
        
        {/* Right Panel - Input Controls */}
        <div
          className={cn(
            'flex flex-col bg-background-surface',
            rightPanelClassName
          )}
          style={{ width: resizable ? `${100 - leftWidth}%` : `${100 - splitRatio}%` }}
        >
          {rightPanel}
        </div>
      </div>
    );
  }
);
TwoPanelLayout.displayName = 'TwoPanelLayout';

export { TwoPanelLayout };