# Guia de Uso do Sistema de Temas

## Como usar o sistema de temas no projeto

### 1. Importar o hook em qualquer componente

```tsx
import { useTheme } from '@/hooks/useTheme';

export function MeuComponente() {
  const { themeClasses } = useTheme();
  
  return (
    <div className={themeClasses.bg.primary}>
      {/* Seu componente aqui */}
    </div>
  );
}
```

### 2. Classes disponíveis do tema

O `themeClasses` possui as seguintes categorias:

#### Background
- `themeClasses.bg.primary` - Background principal (branco no claro, zinc-950 no escuro)
- `themeClasses.bg.secondary` - Background secundário (slate-50 no claro, zinc-900 no escuro)
- `themeClasses.bg.tertiary` - Background terciário
- `themeClasses.bg.hover` - Efeito hover
- `themeClasses.bg.subtle` - Background sutil/suave

#### Borders
- `themeClasses.border.primary` - Border principal
- `themeClasses.border.secondary` - Border secundária
- `themeClasses.border.hover` - Border no hover

#### Textos
- `themeClasses.text.primary` - Texto principal
- `themeClasses.text.secondary` - Texto secundário
- `themeClasses.text.tertiary` - Texto terciário
- `themeClasses.text.muted` - Texto mutado
- `themeClasses.text.hint` - Texto de hint

#### Acentos (cores)
- `themeClasses.accent.violet`
- `themeClasses.accent.blue`
- `themeClasses.accent.emerald`
- `themeClasses.accent.amber`
- `themeClasses.accent.red`
- `themeClasses.accent.pink`

#### Gradientes
- `themeClasses.gradient.violet`
- `themeClasses.gradient.blue`
- `themeClasses.gradient.emerald`

#### Outras
- `themeClasses.shadow` - Shadow padrão
- `themeClasses.input` - Classes para inputs

### 3. Exemplos de uso

#### Exemplo 1: Card simples
```tsx
<div className={`${themeClasses.bg.secondary} ${themeClasses.border.primary} border rounded-lg p-4`}>
  <p className={themeClasses.text.primary}>Meu card</p>
</div>
```

#### Exemplo 2: Button
```tsx
<button className={`${themeClasses.bg.violet} px-4 py-2 rounded-lg transition-all ${themeClasses.bg.hover}`}>
  Clique aqui
</button>
```

#### Exemplo 3: Input
```tsx
<input 
  className={`${themeClasses.input} w-full p-2 rounded-lg`}
  placeholder="Digite algo"
/>
```

### 4. Modo de uso gradual

Você NÃO precisa atualizar todos os componentes de uma vez:
1. Deixe os componentes antigos como estão (hardcoded com classes dark)
2. Use o hook `useTheme` em novos componentes
3. Vá migrando componentes gradualmente
4. O tema será respeitado onde for usado

### 5. Testando o tema

Para mudar entre temas:
```tsx
function MeuComponente() {
  const { theme } = useTheme();
  
  function toggleTheme() {
    const novoTema = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('zent_theme', novoTema);
    location.reload(); // Ou usar um context para atualizar sem reload
  }
  
  return <button onClick={toggleTheme}>Toggle Tema</button>;
}
```

## Estrutura do sistema

- **`src/lib/themes.ts`** - Definição de todas as cores dos temas
- **`src/hooks/useTheme.ts`** - Hook para usar o tema em componentes
- **`src/components/ThemeProvider.tsx`** - Provider que aplica o tema globalmente
