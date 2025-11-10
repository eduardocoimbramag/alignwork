# Refatoração: Mensagem Inicial e Remoção de "Perfil" do Menu

## 1. Resumo da Necessidade

### Situação Atual

1. **Dropdown do Usuário (Header)**:
   - Contém 3 itens: "Perfil", "Configurações", "Sair"
   - O item "Perfil" redireciona para `/perfil` (rota que foi removida na implementação anterior)
   - Este item está obsoleto, pois o perfil agora está integrado em "Configurações"

2. **Mensagem de Boas-Vindas (Dashboard)**:
   - Exibe mensagem genérica: "Bom dia! 👋"
   - Não personaliza com o nome do usuário
   - Não utiliza o título profissional "Dr."

### Necessidade

1. **Remover item "Perfil"** do dropdown do usuário no header
2. **Personalizar mensagem inicial** do Dashboard para exibir "Dr. [Nome e Sobrenome]"
   - Usar dados de `first_name` e `last_name` do perfil do usuário
   - Formato: "Dr. Eduardo Coimbra" (exemplo)

### Objetivos

- **UX**: Menu mais limpo e direto (apenas Configurações e Sair)
- **Personalização**: Mensagem de boas-vindas mais profissional e personalizada
- **Consistência**: Alinhar com a refatoração anterior que moveu Perfil para Configurações

### Impactos

- **Navegação**: Usuário não verá mais opção "Perfil" obsoleta
- **Experiência**: Mensagem mais acolhedora e profissional
- **Manutenibilidade**: Código mais limpo, sem referências a rotas removidas

---

## 2. Análise da Estrutura Atual

### Componente: Header (`src/components/Layout/Header.tsx`)

**Estrutura do Dropdown**:
```typescript
<DropdownMenuContent>
  <DropdownMenuLabel>
    {/* Email do usuário */}
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem asChild>
    <Link to="/perfil">  {/* ← REMOVER ESTE ITEM */}
      <User icon />
      Perfil
    </Link>
  </DropdownMenuItem>
  <DropdownMenuItem asChild>
    <Link to="/configuracoes">
      <Settings icon />
      Configurações
    </Link>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={handleLogout}>
    <LogOut icon />
    Sair
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Dados do Usuário**:
- Acessado via `useAuth()` hook
- `user` contém: `id`, `email`, `first_name`, `last_name`, `full_name` (deprecated), etc.
- Função `getUserInitials()` já existe e usa `full_name` (precisa atualizar para usar `first_name` + `last_name`)

### Componente: Dashboard (`src/pages/Dashboard.tsx`)

**Mensagem Atual**:
```typescript
<h2 className="text-3xl font-bold text-foreground mb-2">
  Bom dia! 👋
</h2>
```

**Dados Disponíveis**:
- Não está acessando dados do usuário atualmente
- Precisa importar `useAuth()` para obter `user.first_name` e `user.last_name`

---

## 3. Estrutura de Dados

### Interface User (já existe em `src/types/auth.ts`)

```typescript
export interface User {
    id: number;
    email: string;
    first_name: string;      // ← Usar para mensagem
    last_name: string;       // ← Usar para mensagem
    full_name?: string;      // Deprecated
    profile_photo_url?: string | null;
    phone_personal?: string | null;
    phone_professional?: string | null;
    phone_clinic?: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
}
```

### Formato da Mensagem

**Formato desejado**: `Dr. [first_name] [last_name]`

**Exemplos**:
- `first_name="Eduardo"`, `last_name="Coimbra"` → "Dr. Eduardo Coimbra"
- `first_name="Maria"`, `last_name="Silva"` → "Dr. Maria Silva"
- Se `first_name` ou `last_name` estiver vazio → Fallback para "Bom dia! 👋"

---

## 4. Decisões de Design e Arquitetura

### 4.1. Remoção do Item "Perfil"

**Decisão**: Remover completamente o `DropdownMenuItem` que contém o link para `/perfil`.

**Justificativa**:
- Rota `/perfil` foi removida na implementação anterior
- Perfil agora está em Configurações → Aba "Perfil"
- Evitar confusão do usuário com link quebrado

**Ação**: Deletar linhas 113-118 do `Header.tsx`.

### 4.2. Mensagem Personalizada

**Decisão**: Usar formato "Dr. [Nome] [Sobrenome]" com fallback.

**Lógica**:
1. Se `user.first_name` e `user.last_name` existem → "Dr. [first_name] [last_name]"
2. Se apenas `first_name` existe → "Dr. [first_name]"
3. Se nenhum existe → Fallback: "Bom dia! 👋"

**Considerações**:
- Título "Dr." é fixo (pode ser configurável no futuro)
- Não usar `full_name` (deprecated)
- Tratar casos onde dados ainda não foram carregados (loading state)

### 4.3. Atualização de `getUserInitials()` no Header

**Decisão**: Atualizar função para usar `first_name` + `last_name` em vez de `full_name`.

**Lógica atual**:
```typescript
if (user?.full_name) {
  return user.full_name.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
}
```

**Lógica nova**:
```typescript
if (user?.first_name && user?.last_name) {
  return (user.first_name[0] + user.last_name[0]).toUpperCase();
}
// Fallback para email se não houver nome
```

---

## 5. Plano de Implementação (Sem Diffs)

### Etapa 1: Remover Item "Perfil" do Header

**Arquivo**: `src/components/Layout/Header.tsx`

1. **Localizar** o `DropdownMenuItem` com link para `/perfil` (linhas 113-118)
2. **Remover** completamente o item, incluindo:
   - O `DropdownMenuItem` wrapper
   - O `Link` para `/perfil`
   - O ícone `User`
   - O texto "Perfil"
3. **Verificar** se há separador (`DropdownMenuSeparator`) antes ou depois que precisa ser ajustado
4. **Remover** import de `User` do `lucide-react` se não for mais usado

**Resultado esperado**:
- Dropdown terá apenas: Email do usuário, "Configurações", "Sair"
- Sem referências a `/perfil`

### Etapa 2: Atualizar Função `getUserInitials()` no Header

**Arquivo**: `src/components/Layout/Header.tsx`

1. **Localizar** função `getUserInitials()` (linhas 48-63)
2. **Atualizar** lógica para usar `first_name` + `last_name`:
   - Primeiro tentar `user.first_name[0] + user.last_name[0]`
   - Fallback para email se não houver nome
   - Fallback para "U" se não houver nada
3. **Manter** compatibilidade com `full_name` (deprecated) como fallback secundário

**Resultado esperado**:
- Avatar exibe iniciais corretas baseadas em `first_name` + `last_name`
- Exemplo: "Eduardo Coimbra" → "EC"

### Etapa 3: Personalizar Mensagem do Dashboard

**Arquivo**: `src/pages/Dashboard.tsx`

1. **Importar** `useAuth` hook (se ainda não estiver importado)
2. **Obter** dados do usuário: `const { user } = useAuth()`
3. **Criar** função auxiliar `getGreetingMessage()`:
   - Se `user.first_name` e `user.last_name` existem → retornar `"Dr. ${first_name} ${last_name}"`
   - Se apenas `first_name` existe → retornar `"Dr. ${first_name}"`
   - Caso contrário → retornar `"Bom dia! 👋"`
4. **Substituir** texto fixo "Bom dia! 👋" pela chamada da função
5. **Tratar** loading state: se `user` for `null` ou `undefined`, exibir "Bom dia! 👋" temporariamente

**Resultado esperado**:
- Mensagem exibe "Dr. Eduardo Coimbra" (exemplo)
- Fallback para "Bom dia! 👋" se dados não disponíveis

---

## 6. Estrutura de Pastas e Arquivos

### Arquivos a Modificar

```
src/
├── components/
│   └── Layout/
│       └── Header.tsx          (modificar: remover Perfil, atualizar getUserInitials)
└── pages/
    └── Dashboard.tsx            (modificar: personalizar mensagem)
```

### Arquivos que NÃO precisam ser modificados

- `src/types/auth.ts` - Interface já tem `first_name` e `last_name`
- `src/services/api.ts` - API já retorna dados corretos
- `src/App.tsx` - Rota `/perfil` já foi removida

---

## 7. Validações e Regras de Negócio

### Validação de Dados do Usuário

**Casos a tratar**:
1. **Usuário não carregado** (`user === null`):
   - Exibir "Bom dia! 👋" temporariamente
   - Não quebrar a aplicação

2. **Nome incompleto** (`first_name` existe mas `last_name` vazio):
   - Exibir "Dr. [first_name]"
   - Não exibir "Dr. [first_name] " (espaço extra)

3. **Nenhum nome** (`first_name` e `last_name` vazios/null):
   - Fallback para "Bom dia! 👋"
   - Não exibir "Dr. " sozinho

### Formatação da Mensagem

**Regras**:
- Sempre capitalizar primeira letra: "Dr. Eduardo" (não "Dr. eduardo")
- Remover espaços extras: `trim()` antes de concatenar
- Não adicionar ponto final após o nome: "Dr. Eduardo Coimbra" (não "Dr. Eduardo Coimbra.")

---

## 8. Fluxo de Usuário (UX)

### Fluxo 1: Usuário Abre o Dashboard

1. Usuário faz login
2. Dashboard carrega
3. Sistema busca dados do usuário via `useAuth()`
4. Se `first_name` e `last_name` existem:
   - Exibe "Dr. [Nome] [Sobrenome]"
5. Se dados não disponíveis:
   - Exibe "Bom dia! 👋" temporariamente
   - Atualiza quando dados carregarem

### Fluxo 2: Usuário Abre Dropdown do Header

1. Usuário clica no avatar no canto superior direito
2. Dropdown abre mostrando:
   - Email do usuário (no topo)
   - Separador
   - **"Configurações"** (link para `/configuracoes`)
   - Separador
   - **"Sair"** (botão de logout)
3. **Item "Perfil" não aparece mais**

### Fluxo 3: Usuário Atualiza Nome no Perfil

1. Usuário acessa Configurações → Perfil
2. Atualiza `first_name` ou `last_name`
3. Salva alterações
4. Dashboard atualiza automaticamente (se usar React Query ou contexto)
5. Mensagem muda de "Dr. [Nome Antigo]" para "Dr. [Nome Novo]"

---

## 9. Tratamento de Erros

### Erros Comuns e Mensagens

**Usuário não autenticado**:
- `user === null` ou `user === undefined`
- **Tratamento**: Exibir "Bom dia! 👋" (fallback seguro)

**Dados incompletos**:
- `first_name` ou `last_name` são strings vazias `""`
- **Tratamento**: Usar apenas o campo disponível ou fallback

**Erro ao carregar dados**:
- `useAuth()` retorna erro
- **Tratamento**: Exibir "Bom dia! 👋" e não quebrar a aplicação

---

## 10. Testes de Validação

### Teste 1: Remover Item "Perfil" do Dropdown

**Passos**:
1. Fazer login no sistema
2. Clicar no avatar no canto superior direito
3. Verificar dropdown

**Resultado esperado**:
- Dropdown mostra apenas: Email, "Configurações", "Sair"
- Item "Perfil" não aparece
- Não há links quebrados

### Teste 2: Mensagem Personalizada com Nome Completo

**Passos**:
1. Fazer login com usuário que tem `first_name="Eduardo"` e `last_name="Coimbra"`
2. Acessar Dashboard
3. Verificar mensagem de boas-vindas

**Resultado esperado**:
- Mensagem exibe: "Dr. Eduardo Coimbra"
- Não exibe "Bom dia! 👋"

### Teste 3: Mensagem com Apenas Nome

**Passos**:
1. Fazer login com usuário que tem apenas `first_name="Maria"` (sem `last_name`)
2. Acessar Dashboard
3. Verificar mensagem

**Resultado esperado**:
- Mensagem exibe: "Dr. Maria"
- Não exibe "Dr. Maria " (espaço extra)

### Teste 4: Mensagem Fallback (Sem Nome)

**Passos**:
1. Fazer login com usuário que não tem `first_name` nem `last_name`
2. Acessar Dashboard
3. Verificar mensagem

**Resultado esperado**:
- Mensagem exibe: "Bom dia! 👋"
- Não exibe "Dr. " sozinho
- Aplicação não quebra

### Teste 5: Atualização de Iniciais no Avatar

**Passos**:
1. Fazer login com usuário que tem `first_name="Eduardo"` e `last_name="Coimbra"`
2. Verificar avatar no header
3. Verificar iniciais exibidas

**Resultado esperado**:
- Avatar exibe "EC" (primeira letra de cada nome)
- Não usa mais `full_name` (deprecated)

### Teste 6: Atualização Dinâmica

**Passos**:
1. Fazer login e verificar mensagem inicial
2. Ir em Configurações → Perfil
3. Alterar `first_name` de "Eduardo" para "José"
4. Salvar alterações
5. Voltar para Dashboard

**Resultado esperado**:
- Mensagem atualiza para "Dr. José Coimbra"
- Avatar atualiza iniciais para "JC"
- Mudanças refletem imediatamente

---

## 11. Checklist de Aceitação

A implementação está completa quando:

- [ ] **Item "Perfil" removido do dropdown**
  - Dropdown não contém mais link para `/perfil`
  - Apenas "Configurações" e "Sair" aparecem
  - Import de `User` do `lucide-react` removido se não usado

- [ ] **Função `getUserInitials()` atualizada**
  - Usa `first_name` + `last_name` em vez de `full_name`
  - Fallback para email se não houver nome
  - Avatar exibe iniciais corretas

- [ ] **Mensagem do Dashboard personalizada**
  - Exibe "Dr. [Nome] [Sobrenome]" quando dados disponíveis
  - Fallback para "Bom dia! 👋" quando dados não disponíveis
  - Trata casos de nome incompleto corretamente

- [ ] **Sem erros de lint**
  - Código passa em todas as validações
  - Sem imports não utilizados
  - Sem variáveis não utilizadas

- [ ] **Testes manuais passaram**
  - Todos os 6 testes de validação executados com sucesso
  - Dropdown funciona corretamente
  - Mensagem exibe corretamente em todos os cenários

---

## 12. Observabilidade

### Logs Recomendados (Opcional)

**Frontend** (console.log para debug):
```typescript
// Ao exibir mensagem personalizada
console.log(`[Dashboard] Greeting: ${greetingMessage}, user: ${user?.first_name} ${user?.last_name}`);

// Ao remover item Perfil
console.log('[Header] Item "Perfil" removido do dropdown');
```

**Nota**: Logs podem ser removidos em produção ou substituídos por sistema de logging adequado.

---

## 13. Considerações de Segurança

### Privacidade

- **Dados do usuário**: Nome e sobrenome são dados pessoais
- **Exibição**: Apenas o próprio usuário vê sua mensagem personalizada
- **Não expor**: Não enviar dados do usuário em logs públicos ou métricas

### Validação de Entrada

- **Sanitização**: Garantir que `first_name` e `last_name` não contenham HTML/scripts
- **React**: Usar JSX que escapa automaticamente (não usar `dangerouslySetInnerHTML`)

---

## 14. Apêndice

### Exemplo de Código: Função de Mensagem

```typescript
const getGreetingMessage = (user: User | null): string => {
  if (!user) {
    return "Bom dia! 👋";
  }

  const firstName = user.first_name?.trim() || "";
  const lastName = user.last_name?.trim() || "";

  if (firstName && lastName) {
    return `Dr. ${firstName} ${lastName}`;
  }

  if (firstName) {
    return `Dr. ${firstName}`;
  }

  return "Bom dia! 👋";
};
```

### Exemplo de Código: Função de Iniciais Atualizada

```typescript
const getUserInitials = (user: User | null): string => {
  if (!user) return "U";

  // Prioridade 1: first_name + last_name
  if (user.first_name && user.last_name) {
    const first = user.first_name.charAt(0).toUpperCase();
    const last = user.last_name.charAt(0).toUpperCase();
    return first + last;
  }

  // Prioridade 2: apenas first_name
  if (user.first_name) {
    return user.first_name.charAt(0).toUpperCase();
  }

  // Prioridade 3: email (fallback)
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.slice(0, 2).toUpperCase() || 'U';
  }

  // Prioridade 4: full_name (deprecated, compatibilidade)
  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return 'U';
};
```

### Estrutura do Dropdown Após Remoção

```
DropdownMenuContent
├── DropdownMenuLabel
│   └── Email do usuário
├── DropdownMenuSeparator
├── DropdownMenuItem (Configurações)
│   └── Link para /configuracoes
├── DropdownMenuSeparator
└── DropdownMenuItem (Sair)
    └── Botão de logout
```

---

## Conclusão

Este documento fornece um guia completo para:
1. **Remover** o item "Perfil" obsoleto do dropdown do header
2. **Personalizar** a mensagem de boas-vindas do Dashboard com "Dr. [Nome] [Sobrenome]"
3. **Atualizar** a função de iniciais para usar os novos campos de perfil

**Abordagem**: Seguir as etapas na ordem apresentada:
1. Remover item "Perfil" do Header
2. Atualizar função `getUserInitials()` no Header
3. Personalizar mensagem do Dashboard

**Prioridade**:
1. Remover item obsoleto (crítico - evita links quebrados)
2. Personalizar mensagem (melhoria de UX)
3. Atualizar iniciais (consistência com nova estrutura)

**Convenção recomendada**: Sempre usar `first_name` + `last_name` em vez de `full_name` (deprecated) para manter consistência com a refatoração anterior.

