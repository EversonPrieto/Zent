'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Carregar tema ao montar
  useEffect(() => {
    const savedTheme = (localStorage.getItem('zent_theme') || 'dark') as Theme;
    setThemeState(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  // Listener para mudanças no localStorage (sincronizar entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zent_theme') {
        const newTheme = (e.newValue || 'dark') as Theme;
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listener para evento customizado (sincronizar na mesma aba)
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      setThemeState(customEvent.detail.theme);
      applyTheme(customEvent.detail.theme);
    };

    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('zent_theme', newTheme);
    applyTheme(newTheme);

    // Disparar evento customizado para sincronizar na mesma aba
    window.dispatchEvent(
      new CustomEvent('theme-changed', { detail: { theme: newTheme } })
    );
  };

  const applyTheme = (themeToApply: Theme) => {
    const htmlElement = document.documentElement;

    if (themeToApply === 'light') {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      document.body.className = 'bg-gray-50 text-gray-900';
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-white';
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext deve ser usado dentro de ThemeContextProvider');
  }
  return context;
}
