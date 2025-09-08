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
    <div className={cn('flex flex-col h-screen bg-hysio-off-white', className)} {...props}>
      {/* Navigation Header */}
      {navigation && <Navigation {...navigation} />}
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && sidebar && (
          <aside
            className={cn(
              'bg-white border-r border-hysio-mint/20 transition-all duration-300',
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
        <main className="flex-1 overflow-hidden bg-hysio-off-white">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { DashboardLayout };