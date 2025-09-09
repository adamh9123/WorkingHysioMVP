import * as React from 'react';
import { cn } from '@/utils';
import { Navigation, type NavigationProps } from './navigation';

export interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  navigation?: NavigationProps;
  sidebar?: React.ReactNode;
  sidebarWidth?: string;
  showSidebar?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation,
  sidebar,
  sidebarWidth = '280px',
  showSidebar = false,
  className,
  ...props
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className={cn('flex flex-col h-screen bg-background-primary', className)} {...props}>
      {/* Navigation Header */}
      {navigation && <Navigation {...navigation} />}
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && sidebar && (
          <aside
            className={cn(
              'bg-background-surface border-r border-border-primary/20 transition-all duration-300',
              isSidebarCollapsed ? 'w-16' : `w-[${sidebarWidth}]`,
              'hidden lg:block'
            )}
            style={{ width: isSidebarCollapsed ? '64px' : sidebarWidth }}
          >
            <div className="p-4 h-full overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background-primary">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { DashboardLayout };