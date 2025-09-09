'use client';

import React from 'react';
import { IntakeSessionProvider } from '@/context/IntakeSessionContext';

export default function ScribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IntakeSessionProvider>
      {children}
    </IntakeSessionProvider>
  );
}