'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-hysio-mint/20 rounded-lg', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left hover:bg-hysio-mint/5 transition-colors',
          headerClassName
        )}
      >
        <h3 className="font-medium text-hysio-deep-green">{title}</h3>
        {isOpen ? (
          <ChevronDown size={20} className="text-hysio-deep-green-900/60" />
        ) : (
          <ChevronRight size={20} className="text-hysio-deep-green-900/60" />
        )}
      </button>
      
      {isOpen && (
        <div className={cn('px-4 pb-4', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}