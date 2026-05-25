'use client';

import { useTheme } from '../hooks/useTheme';

export function ThemeExampleCard() {
  const { theme, themeClasses } = useTheme();

  return (
    <div className={`${themeClasses.bg.secondary} ${themeClasses.border.primary} border rounded-2xl p-6 space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
          Tema Atual: {theme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
        </h3>
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-lg ${themeClasses.accent.violet}`}>
          <p className="text-sm font-medium">Violeta</p>
        </div>

        <div className={`p-3 rounded-lg ${themeClasses.accent.blue}`}>
          <p className="text-sm font-medium">Azul</p>
        </div>

        <div className={`p-3 rounded-lg ${themeClasses.accent.emerald}`}>
          <p className="text-sm font-medium">Esmeralda</p>
        </div>

        <div className={`p-3 rounded-lg ${themeClasses.accent.amber}`}>
          <p className="text-sm font-medium">Âmbar</p>
        </div>

        <div className={`p-3 rounded-lg ${themeClasses.accent.red}`}>
          <p className="text-sm font-medium">Vermelho</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Teste com input"
        className={`${themeClasses.input} w-full p-2 rounded-lg border`}
      />

      <div className="space-y-2">
        <p className={`text-sm ${themeClasses.text.primary}`}>Texto primário</p>
        <p className={`text-sm ${themeClasses.text.secondary}`}>Texto secundário</p>
        <p className={`text-sm ${themeClasses.text.tertiary}`}>Texto terciário</p>
        <p className={`text-sm ${themeClasses.text.muted}`}>Texto mutado</p>
      </div>
    </div>
  );
}
