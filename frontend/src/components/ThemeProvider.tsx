'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('zent_theme') || 'dark';
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: string) => {
    const htmlElement = document.documentElement;
    
    if (theme === 'light') {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      document.body.className = 'bg-white text-zinc-950 antialiased';
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-white antialiased';
    }
  };

  return <>{children}</>;
}