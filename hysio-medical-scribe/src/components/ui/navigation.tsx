import * as React from 'react';
import { cn } from '@/utils';
import { Button } from './button';
import { User, Settings, LogOut, Menu, X, Bot } from 'lucide-react';
import Link from 'next/link';

export interface NavigationProps {
  title?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onSettings?: () => void;
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  title = 'Hysio Medical Scribe',
  user,
  onLogout,
  onSettings,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className={cn(
      'flex items-center justify-between p-4 bg-white border-b border-hysio-mint/20 shadow-sm',
      className
    )}>
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Hysio Logo Placeholder */}
          <div className="flex items-center justify-center w-8 h-8 bg-hysio-mint rounded-md">
            <span className="text-hysio-deep-green-900 font-bold text-sm">H</span>
          </div>
          <h1 className="text-xl font-semibold text-hysio-deep-green">{title}</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        {/* Assistant Link */}
        <Link href="/assistant">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-hysio-deep-green hover:text-sky-600 hover:bg-sky-50"
          >
            <Bot size={16} />
            Assistant
          </Button>
        </Link>
        
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm text-hysio-deep-green-900">
              <div className="flex items-center justify-center w-8 h-8 bg-hysio-mint/20 rounded-full">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-hysio-deep-green" />
                )}
              </div>
              <span className="font-medium">{user.name}</span>
            </div>
            
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="gap-2"
              >
                <Settings size={16} />
                Instellingen
              </Button>
            )}
            
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                Uitloggen
              </Button>
            )}
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-hysio-mint/20 shadow-lg md:hidden z-50">
          <div className="p-4 space-y-4">
            {user && (
              <div className="flex items-center gap-3 pb-3 border-b border-hysio-mint/10">
                <div className="flex items-center justify-center w-10 h-10 bg-hysio-mint/20 rounded-full">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-hysio-deep-green" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-hysio-deep-green">{user.name}</div>
                  {user.email && (
                    <div className="text-sm text-hysio-deep-green-900/70">{user.email}</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {/* Mobile Assistant Link */}
              <Link href="/assistant">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bot size={16} />
                  Assistant
                </Button>
              </Link>
              
              {onSettings && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onSettings();
                    setIsMenuOpen(false);
                  }}
                >
                  <Settings size={16} />
                  Instellingen
                </Button>
              )}
              
              {onLogout && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  Uitloggen
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export { Navigation };