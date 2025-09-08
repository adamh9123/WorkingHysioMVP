import * as React from 'react';
import { cn } from '@/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    collapsible = false, 
    defaultCollapsed = false,
    children, 
    ...props 
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    const toggleCollapse = () => {
      if (collapsible) {
        setIsCollapsed(!isCollapsed);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('hysio-panel', className)}
        {...props}
      >
        {(title || subtitle) && (
          <div 
            className={cn(
              'flex items-center justify-between p-4 border-b border-hysio-mint/20',
              collapsible && 'cursor-pointer hover:bg-hysio-mint/5'
            )}
            onClick={toggleCollapse}
          >
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-hysio-deep-green">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-hysio-deep-green-900/70 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {collapsible && (
              <svg
                className={cn(
                  'h-5 w-5 text-hysio-deep-green transition-transform',
                  isCollapsed && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        )}
        {!isCollapsed && (
          <div className="p-4">
            {children}
          </div>
        )}
      </div>
    );
  }
);
Panel.displayName = 'Panel';

export { Panel };