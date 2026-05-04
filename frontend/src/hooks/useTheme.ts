'use client';

import { useThemeContext } from '../contexts/ThemeContext';
import { getThemeClasses } from '../lib/themes';

export function useTheme() {
  const { theme, mounted } = useThemeContext();

  // Retorna as classes do tema atual
  const themeClasses = mounted ? getThemeClasses(theme) : getThemeClasses('dark');

  return {
    theme,
    themeClasses,
    mounted,
  };
}
