# 7. Ativação e Padronização do Modo Claro/Escuro

## Visão Geral da Feature

Este documento descreve a arquitetura e o plano de implementação para **ativar e padronizar o suporte a tema claro/escuro** no AlignWork, incluindo:

1. **Componente `ThemeToggle`** unificado (baseado em `shadcn/ui`)
2. **Integração no Header** (à esquerda do botão de notificações)
3. **Migração das Configurações** (substituir RadioGroup por `ThemeToggle` detalhado)
4. **Provider de Tema** centralizado com sincronização automática
5. **Persistência e detecção do sistema**

### Estado Atual

- ✅ **Tailwind configurado**: `darkMode: ["class"]` já existe em `tailwind.config.ts`
- ✅ **CSS Variables**: Variáveis para modo escuro definidas em `src/index.css` (`.dark`)
- ✅ **AppContext**: Estado `theme` existe (`"system" | "light" | "dark"`), salvo em `localStorage` via chave `alignwork:settings`
- ❌ **Aplicação ao DOM**: **Falta lógica para adicionar/remover classe `dark` no `document.documentElement`**
- ❌ **Detecção do sistema**: Não há listener para `window.matchMedia("(prefers-color-scheme: dark)")`
- ❌ **Header**: Não possui toggle de tema
- ❌ **Configurações**: Usa `RadioGroup` genérico (não usa componente unificado)

### Objetivos

1. Ativar o suporte a tema claro/escuro que já está parcialmente implementado
2. Criar componente `ThemeToggle` reutilizável e acessível
3. Unificar a experiência de seleção de tema (Header + Settings)
4. Garantir persistência e sincronização automática com preferência do sistema
5. Evitar FOUC (Flash of Unstyled Content) durante o carregamento inicial

---

## Componentes e Layout

### 1. Componente `ThemeToggle`

**Localização sugerida**: `src/components/ui/theme-toggle.tsx`

**Base**: `shadcn/ui` (compor `Button`, `Switch` ou criar componente custom baseado no design system)

#### 1.1 Estrutura Visual

**Formato**: Toggle estilo "pill" (botão comprido com knob circular)

```
┌─────────────────────────┐
│  ☀️  [●──────────]  🌙   │  ← Estado Light
│ ─────────────────────── │
│  ☀️  [──────────●]  🌙   │  ← Estado Dark
└─────────────────────────┘
```

**Especificações**:
- **Background**: `bg-muted` / `bg-muted-foreground` (modo claro/escuro)
- **Knob circular**: Diâmetro ~20-24px, cor `bg-background` com sombra sutil
- **Ícones**: `lucide-react` (`Sun`, `Moon`) - opcional, pode ser apenas indicador visual
- **Cor ativa**: `bg-brand-purple` / `bg-violet-600` (roxo institucional quando ativo)
- **Padding**: `px-3 py-1.5` (tamanho confortável para toque ≥40px)

#### 1.2 Estados e Variantes

**Modo Binário (Header)**:
- Toggle simples que alterna entre `light` ↔ `dark`
- Quando estado atual é `system`, mostrar visualmente como `light` ou `dark` baseado no `resolvedTheme`
- Long-press ou menu dropdown (opcional) para escolher `system`

**Modo Detalhado (Settings)**:
- Toggle + menu dropdown ou segmented control
- Exibir claramente os 3 estados: `system`, `light`, `dark`
- UI sugerida: Toggle central com 3 botões/opções abaixo ou ao lado

#### 1.3 Props e API

```typescript
interface ThemeToggleProps {
  variant?: "default" | "compact" | "detailed"; // default = binário, detailed = 3 opções
  showIcons?: boolean;
  showLabel?: boolean;
  className?: string;
}
```

**Hook sugerido**: `useTheme()` que retorna:
- `theme`: `"light" | "dark" | "system"`
- `resolvedTheme`: `"light" | "dark"` (resolvido quando `theme === "system"`)
- `setTheme(theme: "light" | "dark" | "system")`: Função para alterar tema

---

### 2. Header (Menu Superior)

**Arquivo**: `src/components/Layout/Header.tsx`

**Posicionamento**:
```tsx
<div className="flex items-center space-x-2">
  <ThemeToggle variant="compact" /> {/* ← NOVO: antes do Bell */}
  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
    <Bell className="w-4 h-4" />
  </Button>
  {/* ... restante do código ... */}
</div>
```

**Especificações**:
- Posicionado **à esquerda do botão de notificações** (linha ~84 do arquivo atual)
- Tamanho: `size="icon"` ou similar para consistência com outros botões do header
- Estilo: Adaptado ao header (background transparente/branco com hover suave)
- Variante: `compact` (modo binário, sem labels)

---

### 3. Configurações → Sistema → Aparência

**Arquivo**: `src/pages/Settings.tsx`

**Substituição**:
```tsx
// ANTES (linhas 296-329):
<Card>
  <CardHeader>
    <CardTitle>Aparência</CardTitle>
    <CardDescription>Personalize o tema da interface</CardDescription>
  </CardHeader>
  <CardContent>
    <RadioGroup value={theme} onValueChange={setTheme}>
      {/* 3 RadioGroupItems: system, light, dark */}
    </RadioGroup>
  </CardContent>
</Card>

// DEPOIS:
<Card>
  <CardHeader>
    <CardTitle>Aparência</CardTitle>
    <CardDescription>Personalize o tema da interface</CardDescription>
  </CardHeader>
  <CardContent>
    <ThemeToggle variant="detailed" showIcons showLabel />
  </CardContent>
</Card>
```

**UI Detalhada (Settings)**:
- Opções claramente visíveis: Sistema | Claro | Escuro
- Feedback visual imediato ao selecionar
- Descrição curta para cada opção (ex.: "Segue a preferência do sistema operacional")

---

## Estados, Persistência e Detecção do Sistema

### 1. ThemeProvider (Nova Abordagem)

**Localização sugerida**: `src/contexts/ThemeContext.tsx` ou `src/providers/ThemeProvider.tsx`

**Responsabilidades**:
1. **Estado centralizado**: Gerenciar `theme` e `resolvedTheme`
2. **Aplicação ao DOM**: Adicionar/remover `classList.add("dark")` / `classList.remove("dark")` no `document.documentElement`
3. **Persistência**: Sincronizar com `localStorage` (chave: `alignwork:theme` ou manter `alignwork:settings.theme`)
4. **Detecção do sistema**: Listener para `matchMedia("(prefers-color-scheme: dark)")`
5. **Hydration**: Aplicar tema antes da primeira renderização (evitar FOUC)

#### 1.1 Estrutura do Provider

```typescript
interface ThemeContextType {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. Ler preferência inicial (localStorage ou "system")
  // 2. Detectar preferência do sistema se theme === "system"
  // 3. Aplicar classe "dark" no document.documentElement
  // 4. Listener para mudanças no sistema (quando theme === "system")
  // 5. Salvar no localStorage quando mudar
}
```

#### 1.2 Integração com AppContext

**Decisão de Arquitetura**:
- **Opção A**: Criar `ThemeProvider` separado e integrar em `App.tsx` (recomendado)
- **Opção B**: Adicionar lógica de tema diretamente no `AppContext` existente

**Recomendação**: Opção A, mantendo responsabilidades separadas.

**Integração em `App.tsx`**:
```tsx
<QueryClientProvider client={queryClient}>
  <TenantProvider>
    <AuthProvider>
      <ThemeProvider> {/* ← NOVO */}
        <AppProvider>
          {/* ... restante ... */}
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  </TenantProvider>
</QueryClientProvider>
```

#### 1.3 Persistência

**Chave localStorage**: `alignwork:theme` (separada) ou manter `alignwork:settings.theme` (integração)

**Estrutura**:
```typescript
// Opção 1: Chave separada (mais simples)
localStorage.setItem('alignwork:theme', 'dark');

// Opção 2: Integrar com settings existente
const settings = JSON.parse(localStorage.getItem('alignwork:settings') || '{}');
settings.theme = 'dark';
localStorage.setItem('alignwork:settings', JSON.stringify(settings));
```

**Recomendação**: Opção 2 (manter compatibilidade com código existente).

#### 1.4 Detecção do Sistema

**API**: `window.matchMedia("(prefers-color-scheme: dark)")`

**Comportamento**:
- Quando `theme === "system"`, ler `matchMedia.matches` para determinar `resolvedTheme`
- Adicionar listener para evento `change` quando `theme === "system"`
- Atualizar `resolvedTheme` automaticamente quando o usuário mudar preferência do sistema

**Implementação sugerida**:
```typescript
useEffect(() => {
  if (theme !== "system") return;
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    setResolvedTheme(e.matches ? "dark" : "light");
    applyThemeToDOM(e.matches ? "dark" : "light");
  };
  
  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, [theme]);
```

---

### 2. Prevenção de FOUC (Flash of Unstyled Content)

**Problema**: Se o tema for aplicado apenas após o React montar, haverá um flash de conteúdo no tema errado.

**Solução**: Script inline no `<head>` do `index.html` que aplica a classe `dark` **antes** do React renderizar.

**Implementação em `index.html`**:
```html
<head>
  <!-- ... outras tags ... -->
  <script>
    (function() {
      const theme = localStorage.getItem('alignwork:settings')
        ? JSON.parse(localStorage.getItem('alignwork:settings')).theme || 'system'
        : 'system';
      
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
      
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })();
  </script>
</head>
```

**Alternativa**: Usar `suppressHydrationWarning` no `ThemeProvider` se houver SSR no futuro.

---

## Animações e Design

### 1. Animação do Toggle

**Propriedades CSS**:
- **Knob (translate-x)**: `transform: translateX(Xpx)` com `transition: transform 200-300ms ease-in-out`
- **Ícones (opacity)**: `opacity: 0 → 1` com `transition: opacity 150ms ease-in-out`
- **Background/Border**: `transition-colors 200ms ease-in-out`
- **Scale (hover)**: `scale(1.05)` com `transition: transform 150ms ease-out` (opcional)

**Exemplo Tailwind**:
```tsx
className="transition-all duration-300 ease-in-out"
// Knob
className="transition-transform duration-300 ease-in-out"
// Background
className="transition-colors duration-200 ease-in-out"
```

### 2. Design Tokens e Paleta

**Cor Roxa Institucional**:

**CSS Variables (já existentes)**:
- `--brand-purple: 286 47% 81%` (HSL) = `#e1b7ed`
- `--brand-purple-strong: color-mix(in oklab, hsl(var(--brand-purple)) 88%, black)`

**Tokens Tailwind**:
- Base: `brand-purple` → `hsl(var(--brand-purple))`
- Para toggle ativo: Usar `violet-600` ou `violet-700` do Tailwind padrão, ou criar token custom:
  ```ts
  // tailwind.config.ts
  extend: {
    colors: {
      "theme-toggle-active": "hsl(286 47% 65%)", // Versão mais saturada do brand-purple
    }
  }
  ```

**Estados de Interação**:
- **Hover**: `bg-violet-100` (light) / `bg-violet-900/20` (dark)
- **Active/Pressed**: `bg-violet-600` (light) / `bg-violet-400` (dark)
- **Focus**: `ring-2 ring-violet-500 ring-offset-2`
- **Disabled**: `opacity-50 cursor-not-allowed`

### 3. Contrastes (Acessibilidade)

**Verificação WCAG AA**:
- Texto no toggle (se houver): contraste mínimo 4.5:1 em modo claro, 4.5:1 em modo escuro
- Knob vs background: contraste suficiente para visibilidade
- Estados hover/focus: manter contraste mesmo com mudanças de opacidade

**Testes sugeridos**:
- Lighthouse Accessibility audit
- Axe DevTools
- Verificação manual em ambos os temas

---

## Acessibilidade (ARIA/Contraste)

### 1. ARIA Attributes

**Toggle no Header**:
```tsx
<button
  role="switch"
  aria-checked={resolvedTheme === "dark"}
  aria-label={`Tema: ${resolvedTheme === "dark" ? "escuro" : "claro"}`}
  aria-pressed={resolvedTheme === "dark"}
>
  {/* ... conteúdo do toggle ... */}
</button>
```

**Toggle Detalhado (Settings)**:
```tsx
<div role="radiogroup" aria-label="Escolha do tema">
  <button
    role="radio"
    aria-checked={theme === "system"}
    aria-label="Tema do sistema"
  >
    Sistema
  </button>
  {/* ... light, dark ... */}
</div>
```

### 2. Navegação por Teclado

- **Tab**: Navegar para o toggle
- **Enter/Space**: Alternar tema (modo binário) ou selecionar opção (modo detalhado)
- **Arrow keys**: Navegar entre opções (modo detalhado)
- **Escape**: Fechar menu dropdown (se houver)

### 3. Foco Visível

- **Ring**: `ring-2 ring-violet-500 ring-offset-2` (Tailwind focus-visible)
- **Área de toque**: Mínimo 40x40px (mobile-friendly)

### 4. Tooltips

**Biblioteca**: Usar `Tooltip` do `shadcn/ui` (já existe `@/components/ui/tooltip`)

**Conteúdo sugerido**:
- Header (hover): "Tema claro" / "Tema escuro" / "Tema do sistema"
- Settings: Descrições mais longas por opção

---

## Integração com Tailwind e Provider de Tema

### 1. Configuração Tailwind (Já Existente)

**Verificação**:
- ✅ `darkMode: ["class"]` em `tailwind.config.ts` (linha 4)
- ✅ Variáveis CSS para `.dark` em `src/index.css` (linhas 99-135)

**Nenhuma alteração necessária no Tailwind config**.

### 2. Aplicação da Classe `dark`

**Ponto de aplicação**: `document.documentElement.classList.add("dark")` ou `remove("dark")`

**Método sugerido**:
```typescript
function applyThemeToDOM(resolvedTheme: "light" | "dark") {
  const root = document.documentElement;
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
```

**Chamadas**:
1. Inicialização do `ThemeProvider` (após ler localStorage)
2. Quando `theme` muda (via `setTheme`)
3. Quando preferência do sistema muda (listener de `matchMedia`)

### 3. Integração com Componentes Existentes

**Compatibilidade**:
- Componentes já usam tokens CSS (`bg-background`, `text-foreground`, etc.)
- Tailwind já compila classes `dark:` corretamente
- Não é necessário alterar componentes existentes

**Exceções**:
- Componentes que usam cores hardcoded podem precisar de ajustes
- Verificar componentes com `bg-white` / `text-black` explícitos

---

## Telemetria e Feature Flags

### 1. Feature Flag (Opcional)

**Localização**: `src/constants/features.ts` ou variável de ambiente

**Estrutura**:
```typescript
export const FEATURE_FLAGS = {
  themeToggleInHeader: process.env.VITE_ENABLE_THEME_TOGGLE_HEADER === 'true' || true, // default true após rollout
  themeToggleInSettings: process.env.VITE_ENABLE_THEME_TOGGLE_SETTINGS === 'true' || true,
} as const;
```

**Uso**:
```tsx
{FEATURE_FLAGS.themeToggleInHeader && <ThemeToggle variant="compact" />}
```

### 2. Telemetria/Métricas

**Evento sugerido**: `theme_change`

**Propriedades**:
```typescript
{
  from: "light" | "dark" | "system",
  to: "light" | "dark" | "system",
  source: "header" | "settings",
  resolved: "light" | "dark", // tema resolvido após mudança
  timestamp: number
}
```

**Integração**: Se houver sistema de analytics (ex.: Google Analytics, PostHog), enviar evento.

**Placeholder (sem analytics)**:
```typescript
// Em ThemeProvider.setTheme()
console.log('[Theme] Changed:', { from: previousTheme, to: newTheme, source, resolved });
// Futuro: analytics.track('theme_change', { ... });
```

---

## Plano de Testes

### 1. Testes Unitários (React)

**Biblioteca sugerida**: `@testing-library/react`, `vitest` (se já configurado)

**Casos de teste**:
1. **Renderização do `ThemeToggle`**:
   - Renderiza corretamente em modo binário
   - Renderiza corretamente em modo detalhado
   - Exibe ícones quando `showIcons={true}`

2. **Interação**:
   - Clique alterna tema (modo binário)
   - Clique em opção específica (modo detalhado)
   - Chama `setTheme` com valor correto

3. **Persistência**:
   - Salva no localStorage ao mudar tema
   - Lê do localStorage na inicialização
   - Fallback para "system" se localStorage vazio

4. **Detecção do sistema**:
   - Resolve `resolvedTheme` corretamente quando `theme === "system"`
   - Atualiza `resolvedTheme` quando `matchMedia` dispara `change`

**Arquivo sugerido**: `src/components/ui/__tests__/theme-toggle.test.tsx`

---

### 2. Testes de Integração

**Cenários**:
1. **Header**:
   - Toggle aparece à esquerda do botão de notificações
   - Clique alterna tema e persiste
   - Classe `dark` é aplicada/removida no `document.documentElement`

2. **Settings**:
   - Toggle detalhado substitui `RadioGroup`
   - Mudança de tema reflete imediatamente na UI
   - Mudança persiste após recarregar página

3. **Sincronização**:
   - Mudança no Header reflete em Settings e vice-versa
   - Preferência do sistema é refletida quando `theme === "system"`

---

### 3. Testes E2E (Opcional)

**Biblioteca sugerida**: Playwright ou Cypress (se já configurado)

**Fluxos**:
1. **Fluxo completo**:
   - Abrir app → verificar tema inicial
   - Clicar toggle no header → verificar mudança
   - Recarregar → verificar persistência
   - Ir para Settings → verificar toggle reflete estado atual
   - Mudar tema em Settings → verificar mudança imediata
   - Recarregar → verificar persistência

2. **Modo System**:
   - Definir tema como "system"
   - Simular mudança de preferência do sistema (se possível)
   - Verificar atualização automática

---

### 4. Testes de Acessibilidade

**Ferramentas**:
- **Lighthouse**: Auditar Accessibility (meta: 95+)
- **Axe DevTools**: Verificar ARIA attributes, contrastes, roles
- **Keyboard navigation**: Navegar toggle apenas com teclado

**Checklist**:
- [ ] Contraste de texto ≥ 4.5:1 (AA)
- [ ] Foco visível em todos os estados
- [ ] ARIA labels corretos
- [ ] Navegação por teclado funcional
- [ ] Screen reader anuncia estados corretamente

---

## Plano de Rollout e Rollback

### Fase 1: Ativação do Toggle no Header (Feature Flag)

**Objetivo**: Lançar toggle no header enquanto mantém Settings como está

**Tarefas**:
1. Criar `ThemeProvider` e aplicar classe `dark` no DOM
2. Criar componente `ThemeToggle` (variante `compact`)
3. Adicionar toggle no Header (atrás de feature flag)
4. Testes unitários e integração
5. Deploy com flag `VITE_ENABLE_THEME_TOGGLE_HEADER=true`

**Critérios de sucesso**:
- Toggle aparece e funciona no header
- Tema persiste após recarregar
- Não há regressões visuais

**Rollback**: Desabilitar feature flag (`VITE_ENABLE_THEME_TOGGLE_HEADER=false`)

---

### Fase 2: Migração das Configurações

**Objetivo**: Substituir `RadioGroup` por `ThemeToggle` detalhado em Settings

**Tarefas**:
1. Criar variante `detailed` do `ThemeToggle`
2. Substituir `RadioGroup` em `Settings.tsx`
3. Remover código antigo do `RadioGroup` de tema
4. Testes de integração
5. Deploy

**Critérios de sucesso**:
- Toggle detalhado funciona em Settings
- Sincronização com Header funciona
- UI é clara e acessível

**Rollback**: Reverter commit, restaurar `RadioGroup`

---

### Fase 3: Limpeza e Otimizações

**Tarefas**:
1. Remover código morto (importações não utilizadas)
2. Otimizar script inline de FOUC (se necessário)
3. Adicionar testes E2E (se possível)
4. Documentação final (README, CHANGELOG)

**Critérios de sucesso**:
- Código limpo e mantível
- Documentação atualizada
- Zero bugs conhecidos

---

## Checklist de Conclusão

### Implementação Técnica
- [ ] `ThemeProvider` criado e integrado em `App.tsx`
- [ ] Lógica de aplicação de classe `dark` no DOM implementada
- [ ] Listener de `matchMedia` configurado para modo `system`
- [ ] Script inline de FOUC adicionado em `index.html`
- [ ] Persistência em `localStorage` funcionando

### Componentes
- [ ] `ThemeToggle` criado (`src/components/ui/theme-toggle.tsx`)
- [ ] Variante `compact` para Header
- [ ] Variante `detailed` para Settings
- [ ] Animações fluidas implementadas
- [ ] Ícones (`Sun`, `Moon`) integrados (opcional)

### Integração
- [ ] Toggle adicionado no Header (à esquerda do Bell)
- [ ] `RadioGroup` substituído em Settings → Sistema → Aparência
- [ ] Sincronização entre Header e Settings funcionando

### Design e Acessibilidade
- [ ] Cores roxas da paleta aplicadas (tokens Tailwind)
- [ ] Contraste WCAG AA validado (Lighthouse/Axe)
- [ ] ARIA attributes corretos (`role`, `aria-label`, `aria-checked`)
- [ ] Navegação por teclado funcional
- [ ] Tooltips implementados (opcional)

### Testes
- [ ] Testes unitários do `ThemeToggle` (renderização, interação)
- [ ] Testes de persistência (localStorage)
- [ ] Testes de detecção do sistema (`matchMedia`)
- [ ] Testes de integração (Header + Settings)
- [ ] Testes de acessibilidade (Lighthouse, Axe)

### Documentação
- [ ] README atualizado com seção "Tema" (como usar, estados, persistência)
- [ ] CHANGELOG atualizado ("Ativado dark mode + toggle unificado")
- [ ] Comentários no código (JSDoc onde necessário)

### Deploy e Monitoramento
- [ ] Feature flags configuradas (se aplicável)
- [ ] Telemetria de `theme_change` preparada (se aplicável)
- [ ] Deploy em staging validado
- [ ] Deploy em produção
- [ ] Monitoramento de erros (Sentry/equivalente) configurado

---

## Observações Finais

### Extensibilidade Futura

**Múltiplos temas**:
- Estado atual: `"light" | "dark" | "system"`
- Extensível para: `"light" | "dark" | "high-contrast" | "system"` (futuro)
- Arquitetura do `ThemeProvider` deve permitir adicionar novos temas sem refatoração

**SSR (Server-Side Rendering)**:
- Se houver SSR no futuro, considerar estratégia de inline script no servidor
- Usar `suppressHydrationWarning` no provider se necessário

### Compatibilidade

**Navegadores**:
- Suporte mínimo: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- `matchMedia` e `classList` são amplamente suportados

**Dispositivos**:
- Desktop: Funcionalidade completa
- Mobile: Área de toque ≥40px, gestos touch-friendly

---

## Referências Técnicas

- **shadcn/ui**: https://ui.shadcn.com/docs/components
- **Tailwind Dark Mode**: https://tailwindcss.com/docs/dark-mode
- **matchMedia API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Switch Role**: https://www.w3.org/WAI/ARIA/apg/patterns/switch/

---

**Autor**: Equipe AlignWork  
**Data**: 2024  
**Versão**: 1.0  
**Status**: 📋 Plano Técnico (Aguardando Implementação)

