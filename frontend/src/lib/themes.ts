// Temas com apenas cores, sem mexer em estrutura CSS
export const themes = {
  dark: {
    // Backgrounds principais
    bg: {
      primary: 'bg-zinc-950',
      secondary: 'bg-zinc-900',
      tertiary: 'bg-zinc-800',
      hover: 'hover:bg-white/10',
      subtle: 'bg-white/5',
    },
    // Borders
    border: {
      primary: 'border-white/10',
      secondary: 'border-white/20',
      hover: 'hover:border-white/20',
    },
    // Textos
    text: {
      primary: 'text-white',
      secondary: 'text-zinc-300',
      tertiary: 'text-zinc-500',
      muted: 'text-zinc-500',
      hint: 'text-zinc-400',
      inverted: 'text-black',
    },
    // Acentos
    accent: {
      violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    },
    // Gradientes
    gradient: {
      violet: 'from-violet-500/20 to-indigo-500/20',
      blue: 'from-blue-500/20 to-cyan-500/20',
      emerald: 'from-emerald-500/20 to-teal-500/20',
    },
    // Gradientes de texto - para títulos em gradiente
    textGradient: {
      violet: 'from-violet-400 to-indigo-400',
      blue: 'from-blue-400 to-cyan-400',
      emerald: 'from-emerald-400 to-teal-400',
    },
    // Shadows
    shadow: 'shadow-black/50',
    // Inputs
    input: 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500',
  },
  light: {
    // Backgrounds principais - mais limpos e profissionais
    bg: {
      primary: 'bg-white',
      secondary: 'bg-gray-100',
      tertiary: 'bg-gray-200',
      hover: 'hover:bg-gray-100',
      subtle: 'bg-gray-100',
    },
    // Borders - mais suaves
    border: {
      primary: 'border-gray-200',
      secondary: 'border-gray-300',
      hover: 'hover:border-gray-400',
    },
    // Textos - melhor contraste
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      tertiary: 'text-gray-600',
      muted: 'text-gray-500',
      hint: 'text-gray-400',
      inverted: 'text-white',
    },
    // Acentos - mais vibrantes mas profissionais
    accent: {
      violet: 'bg-violet-100/80 text-violet-700 border-violet-300',
      blue: 'bg-blue-100/80 text-blue-700 border-blue-300',
      emerald: 'bg-emerald-100/80 text-emerald-700 border-emerald-300',
      amber: 'bg-amber-100/80 text-amber-700 border-amber-300',
      red: 'bg-red-100/80 text-red-700 border-red-300',
      pink: 'bg-pink-100/80 text-pink-700 border-pink-300',
    },
    // Gradientes - mais suaves para modo claro
    gradient: {
      violet: 'from-violet-100 to-indigo-100',
      blue: 'from-blue-100 to-cyan-100',
      emerald: 'from-emerald-100 to-teal-100',
    },
    // Gradientes de texto - para títulos em gradiente
    textGradient: {
      violet: 'from-violet-600 to-indigo-600',
      blue: 'from-blue-600 to-cyan-600',
      emerald: 'from-emerald-600 to-teal-600',
    },
    // Shadows - mais leves
    shadow: 'shadow-gray-200/50',
    // Inputs - mais claros
    input: 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400',
  },
} as const;

export type Theme = keyof typeof themes;

export function getThemeClasses(theme: Theme) {
  return themes[theme];
}