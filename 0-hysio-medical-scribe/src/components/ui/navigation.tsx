import * as React from 'react';
import { cn } from '@/utils';
import { Button } from './button';
import { User, Settings, LogOut, Menu, X, Bot, Home } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
      'sticky top-0 z-40 flex items-center justify-between px-6 py-4 hysio-bg-surface backdrop-blur-sm',
      'border-b border-hysio-deep-green/20 shadow-brand-sm transition-brand duration-brand',
      className
    )}>
      {/* Logo and Title */}
      <Link href="/" className="flex items-center gap-4 group">
        <div className="flex items-center gap-3">
          {/* Official Hysio Logo */}
          <div className="flex items-center justify-center w-12 h-12 rounded-button shadow-brand-sm group-hover:shadow-brand transition-brand duration-brand overflow-hidden">
            <Image
              src="/hysio-logo.png"
              alt="Hysio Logo"
              width={48}
              height={48}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-h4 font-semibold text-hysio-deep-green leading-tight">{title}</h1>
            <span className="text-caption text-hysio-deep-green-900/70 font-medium">
              Jouw digitale collega
            </span>
          </div>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-3">
        {/* Home Link */}
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-hysio-deep-green hover:text-hysio-deep-green-900 hover:bg-hysio-deep-green/10"
          >
            <Home size={16} />
            Home
          </Button>
        </Link>

        {/* Assistant Link */}
        <Link href="/assistant">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-hysio-assistant hover:text-hysio-assistant hover:bg-hysio-assistant/10"
          >
            <Bot size={16} className="hysio-ai-pulse" />
            Assistant
          </Button>
        </Link>
        
        {user && (
          <>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-hysio-deep-green/30">
              <div className="flex items-center justify-center w-9 h-9 bg-hysio-deep-green/15 rounded-full transition-brand duration-brand hover:bg-hysio-deep-green/25">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={18} className="text-hysio-deep-green" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-caption font-semibold text-hysio-deep-green">{user.name}</span>
                {user.email && (
                  <span className="text-xs text-hysio-deep-green-900/60">{user.email}</span>
                )}
              </div>
            </div>
            
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="gap-2 hover:bg-hysio-deep-green/10"
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
          size="icon-sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Sluit menu" : "Open menu"}
          className="hysio-focus-enhanced"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 hysio-bg-surface backdrop-blur-sm border-b border-hysio-deep-green/20 shadow-brand-lg md:hidden z-50 animate-brand-slideUp">
          <div className="p-6 space-y-6">
            {user && (
              <div className="flex items-center gap-4 pb-4 border-b border-hysio-deep-green/15">
                <div className="flex items-center justify-center w-12 h-12 bg-hysio-deep-green/15 rounded-button">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-button object-cover"
                    />
                  ) : (
                    <User size={24} className="text-hysio-deep-green" />
                  )}
                </div>
                <div>
                  <div className="text-body font-semibold text-hysio-deep-green">{user.name}</div>
                  {user.email && (
                    <div className="text-caption text-hysio-deep-green-900/70">{user.email}</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-left"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home size={20} />
                  <span>Home</span>
                </Button>
              </Link>

              <Link href="/assistant">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-left text-hysio-assistant hover:bg-hysio-assistant/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bot size={20} className="hysio-ai-pulse" />
                  <span>AI Assistant</span>
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
                  <Settings size={20} />
                  Instellingen
                </Button>
              )}
              
              {onLogout && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 mt-4"
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut size={20} />
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