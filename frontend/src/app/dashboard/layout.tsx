'use client';

import { ReactNode } from 'react';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../hooks/useTheme';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { themeClasses } = useTheme();
  
  return (
    <div className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <AppHeader />
        <main className="mx-auto min-h-[calc(100vh-80px)] w-full max-w-7xl px-4 pb-8 pt-4 md:px-6 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
