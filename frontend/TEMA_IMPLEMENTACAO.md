# Sistema de Temas - Implementação Completa ✅

## O que foi criado

### 1. **`src/lib/themes.ts`** - Paleta de cores
Define todas as cores para tema claro e escuro em categorias organizadas:
- Backgrounds (primary, secondary, tertiary, hover, subtle)
- Borders (primary, secondary, hover)
- Textos (primary, secondary, tertiary, muted, hint)
- Acentos coloridos (violet, blue, emerald, amber, red, pink)
- Gradientes
- Shadows
- Inputs

### 2. **`src/hooks/useTheme.ts`** - Hook reutilizável
Hook que retorna:
- `theme`: tema atual ('dark' ou 'light')
- `themeClasses`: todas as classes CSS do tema
- `mounted`: se foi hidratado no cliente

### 3. **`src/components/ThemeExampleCard.tsx`** - Componente exemplo
Mostra como usar o hook em um componente real com exemplos visuais

### 4. **`src/components/ThemeProvider.tsx`** - Provider global (já existia)
Gerencia o tema globalmente e aplica ao HTML

---

## Como implementar em seus componentes

### Passo 1: Importar o hook
```tsx
import { useTheme } from '@/hooks/useTheme';
```

### Passo 2: Usar no componente
```tsx
export function MeuComponente() {
  const { themeClasses } = useTheme();
  
  return (
    <div className={themeClasses.bg.primary}>
      <h1 className={themeClasses.text.primary}>Título</h1>
      <p className={themeClasses.text.secondary}>Descrição</p>
    </div>
  );
}
```

### Passo 3: Substituir classes hardcoded
**Antes:**
```tsx
<div className="bg-zinc-900 border border-white/10 text-white">
```

**Depois:**
```tsx
<div className={`${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
```

---

## Estratégia de Migração

✅ **NÃO mexe na estrutura CSS**
✅ **Apenas substitui valores de cores**
✅ **Sem risco de quebrar layouts**
✅ **Pode ser feito gradualmente**

### Exemplo: Card Component

**Antes (hardcoded):**
```tsx
<div className="bg-zinc-900 border border-white/10 text-white p-4 rounded-lg">
  <p className="text-zinc-400">Descrição</p>
</div>
```

**Depois (com tema):**
```tsx
<div className={`${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} p-4 rounded-lg`}>
  <p className={themeClasses.text.tertiary}>Descrição</p>
</div>
```

---

## Componentes recomendados para atualizar primeiro

1. **AppHeader.tsx** - Header principal
2. **Profile página** - Página de perfil
3. **CreateWorkspaceModal** - Modais comuns
4. **TaskModal** - Cards de tasks

---

## Referência de cores

### Tema Escuro (Dark)
- BG Primário: `zinc-950` (preto quase)
- BG Secundário: `zinc-900` (cinza escuro)
- Texto: `white`
- Borders: `white/10`

### Tema Claro (Light)
- BG Primário: `white`
- BG Secundário: `slate-50` (cinza bem claro)
- Texto: `slate-900` (cinza escuro)
- Borders: `slate-200` (cinza médio)

---

## Teste o sistema

1. Abra `/src/components/ThemeExampleCard.tsx` em uma página
2. Veja as cores mudarem ao alternar tema
3. Inspecione o HTML para ver as classes CSS sendo aplicadas
4. Copie o padrão para seus componentes

---

## Próximas etapas

1. Comece atualizando componentes com o hook `useTheme`
2. Teste em ambos os temas (dark e light)
3. Migre gradualmente sem pressa
4. Nenhum layout será quebrado - apenas cores mudam!
