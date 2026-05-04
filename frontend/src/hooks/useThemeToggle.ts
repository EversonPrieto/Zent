'use client';

import { useThemeContext } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';

export function useThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const setToTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setToTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
}
