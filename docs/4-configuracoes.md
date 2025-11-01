# 🎨 Feature Spec - Refatoração da Página de Configurações

**Data:** 01/11/2025  
**Status:** 📋 PLANEJAMENTO - Design de Arquitetura  
**Autor:** Especificação Técnica - Feature Implementation

---

## 📋 Sumário Executivo

Este documento descreve a arquitetura e o plano de implementação para a **refatoração da página de Configurações** do AlignWork, transformando-a de um layout vertical simples para uma interface inspirada no Google Chrome, com navegação por sidebar e conteúdo dinâmico.

### 🎯 Objetivos:

- ✅ **Criar layout de duas colunas** (sidebar + conteúdo)
- ✅ **Implementar navegação lateral** com seções: Perfil, Permissões, Consultórios, Sistema
- ✅ **Migrar configurações existentes** para a aba "Sistema"
- ✅ **Preparar placeholders** para futuras funcionalidades
- ✅ **Manter consistência visual** com a paleta AlignWork

### 🎨 Inspiração de Design:

A interface será inspirada no Google Chrome Settings:
- Sidebar de navegação à esquerda (coluna 1)
- Área de conteúdo à direita (coluna 2)
- Indicador visual de aba ativa
- Transições suaves entre seções

---

## 🏗️ Visão Geral da Arquitetura

### **Stack Tecnológica**

| Tecnologia | Uso |
|------------|-----|
| **React 18.3.1** | Framework principal |
| **TypeScript 5.8.3** | Type safety |
| **Tailwind CSS** | Estilização |
| **shadcn/ui** | Componentes UI |
| **React Router DOM** | Navegação (se necessário) |

### **Componentes shadcn/ui Utilizados**

```typescript
// Componentes já disponíveis no projeto
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
```

---

## 🎨 Estrutura do Layout

### **1. Container Principal**

O container principal mantém o background gradiente característico do AlignWork:

```typescript
// Background idêntico à página de login (src/pages/Login.tsx linha 18)
<div className="min-h-screen flex bg-[linear-gradient(135deg,var(--g-from-pastel)_0%,var(--g-mid-pastel)_48%,var(--g-to-pastel)_100%)] p-4 md:p-8">
  {/* Conteúdo */}
</div>
```

**Características:**
- `min-h-screen`: Ocupa altura total da viewport
- Background gradiente personalizado (variáveis CSS do AlignWork)
- Padding responsivo (`p-4` mobile, `p-8` desktop)

---

### **2. Layout de Duas Colunas**

Estrutura inspirada no Chrome Settings:

```typescript
<div className="w-full max-w-7xl mx-auto">
  {/* Header Principal */}
  <header className="mb-8">
    <h1>Configurações</h1>
    <p>Personalize sua experiência no AlignWork</p>
  </header>

  {/* Container de Duas Colunas */}
  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
    {/* Coluna 1: Sidebar de Navegação */}
    <aside>{/* Navegação */}</aside>

    {/* Coluna 2: Área de Conteúdo */}
    <main>{/* Conteúdo Dinâmico */}</main>
  </div>
</div>
```

**Responsividade:**
- **Mobile (`< lg`):** Stack vertical (sidebar acima do conteúdo)
- **Desktop (`>= lg`):** Duas colunas (sidebar 280px + conteúdo flexível)

---

## 🧭 Componentes da Sidebar de Navegação (Coluna 1)

### **3.1. Estrutura da Sidebar**

A sidebar conterá 4 links de navegação principal:

```typescript
const navigationItems = [
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    description: 'Informações pessoais e dados de conta'
  },
  {
    id: 'permissoes',
    label: 'Permissões',
    icon: Shield,
    description: 'Controle de acesso e segurança'
  },
  {
    id: 'consultorios',
    label: 'Consultórios',
    icon: Building,
    description: 'Gerenciar locais de atendimento'
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    description: 'Preferências gerais do sistema'
  }
];
```

---

### **3.2. Implementação da Navegação**

**Opção A: Usando Buttons com variant="ghost" (Recomendado)**

```typescript
<Card className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg sticky top-4">
  <CardContent className="p-2">
    <nav className="space-y-1">
      {navigationItems.map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-left h-auto py-3 px-4",
            activeTab === item.id && "bg-brand-purple/10 text-brand-purple font-semibold"
          )}
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-muted-foreground">
              {item.description}
            </div>
          </div>
        </Button>
      ))}
    </nav>
  </CardContent>
</Card>
```

**Características do Link Ativo:**
- `variant="secondary"` aplicado
- Background `bg-brand-purple/10`
- Texto `text-brand-purple`
- `font-semibold` para destaque

**Opção B: Lista de Navegação Customizada**

```typescript
<Card className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg sticky top-4">
  <CardHeader>
    <CardTitle className="text-sm text-muted-foreground">
      Navegação
    </CardTitle>
  </CardHeader>
  <CardContent className="p-2">
    <ul className="space-y-1">
      {navigationItems.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              "hover:bg-muted/50",
              activeTab === item.id
                ? "bg-brand-purple/10 text-brand-purple font-semibold"
                : "text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <div className="text-left flex-1">
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  </CardContent>
</Card>
```

---

### **3.3. Posicionamento Sticky**

A sidebar deve permanecer visível durante o scroll:

```typescript
// No Card da sidebar
className="... sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto"
```

**Comportamento:**
- `sticky top-4`: Fica fixo a 4 unidades do topo ao fazer scroll
- `max-h-[calc(100vh-2rem)]`: Limita altura máxima
- `overflow-auto`: Scroll interno se necessário

---

## 📄 Componentes da Área de Conteúdo (Coluna 2)

### **4.1. Container de Conteúdo**

O conteúdo muda dinamicamente baseado na aba selecionada:

```typescript
<div className="space-y-6">
  {/* Conteúdo renderizado condicionalmente */}
  {activeTab === 'perfil' && <PerfilContent />}
  {activeTab === 'permissoes' && <PermissoesContent />}
  {activeTab === 'consultorios' && <ConsultoriosContent />}
  {activeTab === 'sistema' && <SistemaContent />}
</div>
```

---

### **4.2. Aba "Sistema" (Migração do Conteúdo Atual)**

Esta aba conterá as configurações migradas da página atual:

```typescript
const SistemaContent = () => {
  const { settings, saveSettings } = useApp();
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [emailReminders, setEmailReminders] = useState(settings.emailReminders);
  const [theme, setTheme] = useState(settings.theme);

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sistema</h2>
        <p className="text-muted-foreground">
          Configure preferências gerais do sistema
        </p>
      </div>

      {/* Card: Notificações */}
      <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Gerencie como você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switch: Ativar notificações */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-base">
                Ativar notificações
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações do sistema
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          {/* Switch: Email reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reminders" className="text-base">
                Receber lembretes por e-mail
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes importantes por e-mail
              </p>
            </div>
            <Switch
              id="email-reminders"
              checked={emailReminders}
              onCheckedChange={setEmailReminders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card: Aparência */}
      <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize o tema da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Tema</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="font-normal cursor-pointer">
                  Sistema (detectar automaticamente)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="font-normal cursor-pointer">
                  Claro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="font-normal cursor-pointer">
                  Escuro
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Card: Fuso Horário */}
      <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
        <CardHeader>
          <CardTitle>Região e Idioma</CardTitle>
          <CardDescription>
            Configure preferências regionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select defaultValue="america-recife">
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="america-recife">
                  (GMT-3) Recife, Brasília
                </SelectItem>
                <SelectItem value="america-sao-paulo">
                  (GMT-3) São Paulo
                </SelectItem>
                <SelectItem value="america-manaus">
                  (GMT-4) Manaus
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select disabled defaultValue="pt-br">
              <SelectTrigger id="language">
                <SelectValue placeholder="Em breve" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                <SelectItem value="en-us">English (US)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Suporte para múltiplos idiomas em breve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] hover:opacity-90 text-white px-6"
        >
          <Settings className="w-4 h-4 mr-2" />
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};
```

**Elementos Migrados:**
1. ✅ Preferências de notificações (Switch)
2. ✅ Email reminders (Switch)
3. ✅ Seleção de tema (RadioGroup)
4. ✅ Fuso horário (Select) - **NOVO**
5. ✅ Idioma (Select - desabilitado)

---

### **4.3. Placeholders para Outras Abas**

Componentes placeholder genéricos para as abas futuras:

```typescript
// Perfil
const PerfilContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Perfil</h2>
      <p className="text-muted-foreground">
        Gerencie suas informações pessoais
      </p>
    </div>

    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10">
            <User className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Configurações de Perfil
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção estará disponível em breve.
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Aqui você poderá editar suas informações pessoais, foto de perfil, 
            dados de contato e preferências de conta.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Permissões
const PermissoesContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Permissões</h2>
      <p className="text-muted-foreground">
        Controle de acesso e segurança
      </p>
    </div>

    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10">
            <Shield className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Configurações de Permissões
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção estará disponível em breve.
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Gerencie permissões de usuários, controle de acesso por função 
            (admin, médico, recepcionista) e configurações de segurança.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Consultórios
const ConsultoriosContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Consultórios</h2>
      <p className="text-muted-foreground">
        Gerenciar locais de atendimento
      </p>
    </div>

    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10">
            <Building className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Configurações de Consultórios
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção estará disponível em breve.
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Configure múltiplos consultórios, endereços, horários de funcionamento 
            e dados de contato de cada unidade.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);
```

**Padrão de Placeholder:**
1. Header com título e descrição
2. Card centralizado
3. Ícone grande em círculo colorido
4. Título "Configurações de [Seção]"
5. Texto "Esta seção estará disponível em breve"
6. Descrição breve do que virá

---

## 🔄 Gerenciamento de Estado

### **5.1. Estado da Aba Ativa**

O estado controla qual conteúdo é exibido:

```typescript
import { useState } from 'react';

type TabId = 'perfil' | 'permissoes' | 'consultorios' | 'sistema';

const Settings = () => {
  // Estado: aba ativa (default: 'sistema')
  const [activeTab, setActiveTab] = useState<TabId>('sistema');

  // Handler para mudança de aba
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    // Opcional: scroll para o topo ao mudar de aba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // ... JSX
  );
};
```

---

### **5.2. Persistência de Configurações (Aba Sistema)**

As configurações continuam usando o `AppContext` existente:

```typescript
const { settings, saveSettings } = useApp();

// Estados locais para edição
const [notifications, setNotifications] = useState(settings.notificationsEnabled);
const [emailReminders, setEmailReminders] = useState(settings.emailReminders);
const [theme, setTheme] = useState(settings.theme);

// Handler para salvar
const handleSaveSettings = async () => {
  const newSettings = {
    notificationsEnabled: notifications,
    emailReminders: emailReminders,
    theme: theme,
    language: settings.language
  };

  saveSettings(newSettings);

  // Toast de sucesso
  toast({
    title: "Preferências salvas",
    description: "Suas configurações foram salvas com sucesso.",
  });
};
```

**Fluxo:**
1. Hidratação: `useState` inicializado com valores do contexto
2. Edição: Updates locais via setters
3. Salvar: Chama `saveSettings()` do contexto
4. Feedback: Toast de confirmação

---

### **5.3. Sincronização com localStorage**

O `AppContext` já gerencia persistência:

```typescript
// Em AppContext.tsx (existente)
const saveSettings = (newSettings: UserSettings) => {
  setSettings(newSettings);
  localStorage.setItem('alignwork_settings', JSON.stringify(newSettings));
};
```

---

## 🎯 Plano de Migração

### **6.1. Mapeamento de Elementos**

| Elemento Atual | Localização | Destino | Status |
|----------------|-------------|---------|--------|
| Card "Preferências" | `Settings.tsx` linhas 96-138 | Aba "Sistema" → Card "Notificações" | ✅ Migrar |
| Switch "Ativar notificações" | linha 113 | Card "Notificações" | ✅ Migrar |
| Switch "Email reminders" | linha 130 | Card "Notificações" | ✅ Migrar |
| Card "Tema" | linhas 141-164 | Aba "Sistema" → Card "Aparência" | ✅ Migrar |
| RadioGroup de temas | linhas 149-162 | Card "Aparência" | ✅ Migrar |
| Card "Idioma" | linhas 167-184 | Aba "Sistema" → Card "Região e Idioma" | ✅ Migrar |
| Select de idioma | linhas 175-182 | Card "Região e Idioma" | ✅ Migrar |
| Botão "Salvar" | linhas 188-197 | Fim da Aba "Sistema" | ✅ Migrar |

---

### **6.2. Novos Elementos a Adicionar**

| Elemento | Descrição | Prioridade |
|----------|-----------|------------|
| Select de Fuso Horário | Dropdown com opções GMT-3, GMT-4, etc | 🟢 Alta |
| Separador entre switches | `<Separator />` para melhor organização | 🟢 Alta |
| Ícones de seção | Lucide icons para cada Card | 🟡 Média |
| Breadcrumbs | Indicador de localização (futuro) | 🔵 Baixa |

---

### **6.3. Checklist de Implementação**

#### **Fase 1: Estrutura Base**
- [ ] Criar layout de duas colunas com grid responsivo
- [ ] Implementar sidebar de navegação
- [ ] Adicionar estado `activeTab`
- [ ] Criar componentes placeholder para cada aba

#### **Fase 2: Migração de Conteúdo**
- [ ] Copiar lógica de estado do `Settings.tsx` atual
- [ ] Criar componente `SistemaContent`
- [ ] Migrar Card "Notificações"
- [ ] Migrar Card "Aparência"
- [ ] Migrar Card "Região e Idioma"
- [ ] Adicionar Select de Fuso Horário
- [ ] Migrar botão "Salvar alterações"

#### **Fase 3: Estilização**
- [ ] Aplicar classes Tailwind consistentes
- [ ] Ajustar espaçamento e padding
- [ ] Adicionar transições suaves
- [ ] Testar responsividade (mobile, tablet, desktop)

#### **Fase 4: Funcionalidades**
- [ ] Conectar handlers de mudança de estado
- [ ] Implementar scroll suave ao mudar de aba
- [ ] Adicionar feedback visual (hover, active states)
- [ ] Testar persistência de configurações

#### **Fase 5: Testes e Refinamento**
- [ ] Testar navegação entre abas
- [ ] Verificar salvamento de configurações
- [ ] Testar em diferentes resoluções
- [ ] Validar acessibilidade (keyboard navigation)

---

## 🎨 Considerações de Design (UX/UI)

### **7.1. Paleta de Cores**

Manter consistência com o AlignWork:

```css
/* Cores principais (src/index.css) */
--brand-purple: 286 47% 81%;   /* #e1b7ed */
--brand-pink: 351 67% 92%;     /* #f5e1e2 */
--brand-lime: 75 56% 71%;      /* #d1e389 */
--brand-green: 75 67% 58%;     /* #b9de51 */

/* Gradientes */
--g-from: #BFA2F0;
--g-mid: #E7BDE6;
--g-to: #F3B6C9;
```

**Aplicação:**
- **Background da página:** Gradiente pastel (`--g-from-pastel` → `--g-to-pastel`)
- **Link ativo:** `bg-brand-purple/10 text-brand-purple`
- **Botão salvar:** Gradiente `--g-from` → `--g-to`
- **Cards:** `bg-white` com `border-black/10`

---

### **7.2. Tipografia**

Seguir hierarquia existente:

```typescript
// Títulos principais
<h1 className="text-4xl font-bold text-white">Configurações</h1>

// Títulos de seção
<h2 className="text-2xl font-bold text-foreground">Sistema</h2>

// Títulos de card
<CardTitle className="text-xl">Notificações</CardTitle>

// Descrições
<CardDescription>Gerencie como você recebe notificações</CardDescription>

// Labels
<Label className="text-base">Ativar notificações</Label>

// Texto auxiliar
<p className="text-sm text-muted-foreground">Receba notificações do sistema</p>
```

---

### **7.3. Espaçamento**

Padronização de gaps e padding:

```typescript
// Container principal
<div className="space-y-6">  // 24px entre elementos

// Cards
<Card className="p-6 md:p-8">  // Padding responsivo

// CardContent
<CardContent className="space-y-6">  // 24px entre switches/campos

// Sidebar
<nav className="space-y-1">  // 4px entre links
```

---

### **7.4. Animações e Transições**

Suavizar interações:

```typescript
// Hover em links da sidebar
<Button className="transition-all hover:bg-muted/50" />

// Mudança de aba
const handleTabChange = (tabId: TabId) => {
  setActiveTab(tabId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Botão salvar
<Button className="transition-opacity hover:opacity-90" />
```

---

### **7.5. Responsividade**

Breakpoints e comportamentos:

| Breakpoint | Comportamento |
|------------|---------------|
| `< lg` (1024px) | Stack vertical: sidebar acima, conteúdo abaixo |
| `>= lg` | Duas colunas: sidebar 280px + conteúdo flexível |
| Mobile | Padding reduzido (`p-4`), cards full-width |
| Desktop | Padding amplo (`p-8`), max-width container |

```typescript
// Grid responsivo
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

// Padding responsivo
<div className="p-4 md:p-8">

// Sidebar sticky apenas em desktop
<Card className="lg:sticky lg:top-4">
```

---

## 🔧 Detalhes de Implementação

### **8.1. Estrutura de Arquivos**

```
src/pages/
  Settings.tsx                 ← Arquivo principal (refatorado)

src/components/Settings/       ← NOVO diretório (opcional)
  SettingsSidebar.tsx          ← Componente da sidebar
  PerfilContent.tsx            ← Conteúdo da aba Perfil
  PermissoesContent.tsx        ← Conteúdo da aba Permissões
  ConsultoriosContent.tsx      ← Conteúdo da aba Consultórios
  SistemaContent.tsx           ← Conteúdo da aba Sistema
  PlaceholderCard.tsx          ← Componente reutilizável
```

**Abordagem Recomendada:**
- **Inicial:** Tudo em `Settings.tsx` (mais rápido)
- **Futuro:** Separar em componentes (melhor manutenibilidade)

---

### **8.2. Type Definitions**

```typescript
// Types para navegação
type TabId = 'perfil' | 'permissoes' | 'consultorios' | 'sistema';

interface NavigationItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
}

// Props dos componentes de conteúdo
interface ContentProps {
  // Vazio por enquanto, pode expandir no futuro
}

// Type para timezone
type TimezoneValue = 'america-recife' | 'america-sao-paulo' | 'america-manaus';
```

---

### **8.3. Imports Necessários**

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Building, 
  Settings as SettingsIcon, 
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
```

---

### **8.4. Handlers e Lógica**

```typescript
const Settings = () => {
  // Estados de navegação
  const [activeTab, setActiveTab] = useState<TabId>('sistema');

  // Estados de configurações (sistema)
  const { settings, saveSettings } = useApp();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [emailReminders, setEmailReminders] = useState(settings.emailReminders);
  const [theme, setTheme] = useState(settings.theme);
  const [timezone, setTimezone] = useState<TimezoneValue>('america-recife');
  const [isLoading, setIsLoading] = useState(false);

  // Handler: Mudança de aba
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Salvar configurações
  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      const newSettings = {
        notificationsEnabled: notifications,
        emailReminders: emailReminders,
        theme: theme,
        language: settings.language
      };

      saveSettings(newSettings);

      // TODO: Salvar timezone no backend
      // await api.updateUserSettings({ timezone });

      await new Promise(resolve => setTimeout(resolve, 400));

      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar suas configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... JSX
  );
};
```

---

## 🔮 Funcionalidades Futuras

### **9.1. Aba "Perfil"**

Conteúdo planejado:
- Avatar do usuário (upload de foto)
- Edição de nome completo
- Email (visualização, mudança requer confirmação)
- Telefone
- Endereço
- Especialidade médica (se aplicável)
- CRM / Registro profissional
- Senha (link para modal de mudança)

**Componentes Necessários:**
- `Avatar` do shadcn/ui
- `Input` para campos de texto
- `Dialog` para mudança de senha
- Upload de imagem (integração com backend)

---

### **9.2. Aba "Permissões"**

Conteúdo planejado:
- Roles do usuário (Admin, Médico, Recepcionista)
- Permissões granulares (ver, editar, excluir)
- Gerenciar outros usuários (se admin)
- Logs de acesso
- Configurações de autenticação 2FA

**Componentes Necessários:**
- `Badge` para exibir roles
- `Table` para lista de permissões
- `Checkbox` para toggle de permissões
- `Alert` para avisos de segurança

---

### **9.3. Aba "Consultórios"**

Conteúdo planejado:
- Lista de consultórios cadastrados
- CRUD de consultórios (criar, editar, excluir)
- Campos: nome, endereço, telefone, horários
- Associar profissionais a consultórios
- Configuração de salas de atendimento

**Componentes Necessários:**
- `Table` ou `Card` list para exibir consultórios
- `Dialog` para adicionar/editar
- `Select` para associar profissionais
- Componente de horário customizado

---

### **9.4. Melhorias na Aba "Sistema"**

Adicionar no futuro:
- [ ] Notificações push (Web Push API)
- [ ] Configurações de e-mail SMTP
- [ ] Integração com WhatsApp Business
- [ ] Backup automático
- [ ] Exportação de dados (LGPD)
- [ ] Preferências de calendário (primeiro dia da semana)
- [ ] Formato de data e hora

---

## 🧪 Testes e Validação

### **10.1. Checklist de Testes Funcionais**

- [ ] Navegação entre abas funciona corretamente
- [ ] Link ativo é destacado visualmente
- [ ] Conteúdo muda ao clicar em link da sidebar
- [ ] Switches de notificações respondem ao clique
- [ ] RadioGroup de tema atualiza o estado
- [ ] Select de fuso horário funciona
- [ ] Botão "Salvar" persiste configurações
- [ ] Toast de sucesso aparece após salvar
- [ ] Toast de erro aparece em caso de falha
- [ ] localStorage é atualizado corretamente

---

### **10.2. Checklist de Testes de UI/UX**

- [ ] Layout responsivo em mobile (< 640px)
- [ ] Layout responsivo em tablet (640px - 1024px)
- [ ] Layout responsivo em desktop (> 1024px)
- [ ] Sidebar permanece visível no desktop (sticky)
- [ ] Scroll suave ao mudar de aba
- [ ] Hover states nos links da sidebar
- [ ] Cards bem espaçados e legíveis
- [ ] Gradiente de fundo renderiza corretamente
- [ ] Botões têm estados hover/active
- [ ] Ícones renderizam corretamente

---

### **10.3. Checklist de Acessibilidade**

- [ ] Navegação por teclado funciona (Tab, Enter)
- [ ] Links da sidebar são focáveis
- [ ] Switches têm labels associados
- [ ] RadioGroup tem labels corretos
- [ ] Selects são navegáveis por teclado
- [ ] ARIA attributes corretos (`aria-checked`, `aria-label`)
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Focus visível em todos os elementos interativos

---

## 📚 Referências e Recursos

### **11.1. Documentação Oficial**

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Lucide Icons](https://lucide.dev/icons/)

### **11.2. Arquivos de Referência no Projeto**

| Arquivo | Propósito |
|---------|-----------|
| `src/pages/Settings.tsx` | Página atual a ser refatorada |
| `src/pages/Profile.tsx` | Referência de layout e cards |
| `src/pages/Login.tsx` | Referência de background gradiente |
| `src/components/ui/sidebar.tsx` | Componente sidebar do shadcn/ui (não usado, mas disponível) |
| `src/components/ui/tabs.tsx` | Alternativa: usar Tabs ao invés de estado manual |
| `src/index.css` | Variáveis de cores e temas |

### **11.3. Inspirações de Design**

- **Google Chrome Settings:** Layout de duas colunas, navegação lateral
- **VS Code Settings:** Busca, categorias hierárquicas
- **Notion Settings:** Cards organizados, placeholders informativos
- **GitHub Settings:** Navegação simples, conteúdo bem estruturado

---

## ✅ Critérios de Sucesso

A implementação será considerada bem-sucedida quando:

1. ✅ **Layout:** Duas colunas responsivas implementadas
2. ✅ **Navegação:** 4 abas funcionando (Perfil, Permissões, Consultórios, Sistema)
3. ✅ **Migração:** Configurações atuais funcionando na aba "Sistema"
4. ✅ **Placeholders:** 3 placeholders bem formatados
5. ✅ **Persistência:** Salvar/carregar configurações funciona
6. ✅ **UX:** Transições suaves, feedback visual adequado
7. ✅ **Responsividade:** Funciona em mobile, tablet e desktop
8. ✅ **Acessibilidade:** Navegação por teclado, ARIA correto

---

## 🚀 Próximos Passos

### **Fase Imediata (Esta Feature):**
1. Implementar estrutura base do layout
2. Migrar conteúdo existente para aba "Sistema"
3. Criar placeholders para outras abas
4. Testar e refinar

### **Fase Futura:**
1. Implementar conteúdo real da aba "Perfil"
2. Implementar "Permissões" (após sistema de roles)
3. Implementar "Consultórios" (após multi-tenancy)
4. Adicionar busca global nas configurações
5. Adicionar atalhos de teclado (Cmd/Ctrl + K)

---

## 📝 Notas de Implementação

### **Atenção aos Detalhes:**

1. **Link Ativo:** Certifique-se de que o estado inicial seja `'sistema'` para abrir na aba certa
2. **Scroll Behavior:** Adicionar smooth scroll ao mudar de aba melhora UX
3. **Loading State:** Desabilitar botão "Salvar" durante requisição
4. **Error Handling:** Sempre mostrar feedback ao usuário (toast)
5. **Mobile First:** Testar layout mobile antes de desktop

### **Armadilhas Comuns:**

- ❌ **Não usar:** `<a href>` para navegação entre abas (causa reload)
- ✅ **Usar:** `<button onClick>` ou estado React
- ❌ **Não usar:** Tabs do Radix se quiser sidebar vertical customizada
- ✅ **Usar:** Estado manual `activeTab` para controle total
- ❌ **Não esquecer:** Keys únicas no `.map()` da sidebar
- ✅ **Lembrar:** `cn()` para merge de classes Tailwind

---

## 🎬 Conclusão

Este documento fornece uma especificação técnica completa para a refatoração da página de Configurações do AlignWork. A implementação criará uma interface moderna, escalável e consistente com o design do sistema, preparando o terreno para futuras funcionalidades.

**Documentos Relacionados:**
- [ROADMAP.md](./ROADMAP.md) - Features futuras planejadas
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral do sistema
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia de contribuição

---

**Autor:** Especificação Técnica  
**Data:** 01/11/2025  
**Versão:** 1.0  
**Status:** 📋 Pronto para Implementação

