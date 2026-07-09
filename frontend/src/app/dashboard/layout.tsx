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
      

      <div className="relative z-10">
        <AppHeader />
        <main className="min-h-[calc(100vh-80px)] w-full bg-transparent px-4 pb-8 pt-4 md:px-6 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
