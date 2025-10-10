# Changelog - AlignWork

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.1.0] - 2025-10-05

### ✨ Novas Funcionalidades

#### Calendário Interativo Funcional
- **Calendário totalmente funcional** no modal "Calendário de Agendamentos"
- **Navegação entre meses** com botões de seta
- **Seleção de datas clicável** para visualizar detalhes
- **Indicadores visuais** de dias com agendamentos (badges coloridos)
- **Lista de agendamentos por dia selecionado**
- **Status coloridos** (Confirmado=verde, Pendente=roxo, Cancelado=cinza)
- **Animações suaves** e transições CSS
- **Responsivo** para todos os tamanhos de tela

### 🔧 Backend

#### Novos Endpoints
- **GET `/api/v1/appointments/`** - Lista agendamentos com filtros opcionais
  - Query params: `tenantId` (obrigatório), `from` (opcional), `to` (opcional)
  - Retorna lista completa de appointments em um intervalo de datas
  - Usado pelo calendário mensal para buscar agendamentos do mês
  - Ordenação por `starts_at` crescente

### ⚛️ Frontend

#### Novos Arquivos
- **`src/types/appointment.ts`** - Types TypeScript para appointments
  - Interface `Appointment` (response da API)
  - Interface `AppointmentCreate` (criar appointment)
  - Interface `AppointmentUpdate` (atualizar status)
  
- **`src/hooks/useMonthAppointments.ts`** - Hook para buscar appointments mensais
  - Busca appointments de um mês específico
  - Cache de 30 segundos (padrão React Query)
  - Timezone America/Recife
  - Refetch ao focar janela

#### Arquivos Modificados
- **`src/services/api.ts`** - Adicionados helper methods
  - `api.get<T>(path, options)` - GET com query params automáticos
  - `api.post<T>(path, body, options)` - POST com body JSON
  - `api.patch<T>(path, body, options)` - PATCH com body JSON
  - Response wrapper com `{ data, status, ok }`

- **`src/components/Calendar/CalendarModal.tsx`** - Calendário funcional
  - Integração com API real via `useMonthAppointments`
  - Navegação entre meses (ChevronLeft/ChevronRight)
  - Seleção de datas com feedback visual
  - Badges para indicar quantidade de agendamentos (confirmados e pendentes)
  - Lista de agendamentos do dia selecionado
  - Loading states
  - Cores da marca (brand-purple, brand-pink, brand-lime, brand-green)

- **`src/components/Calendar/InteractiveCalendar.tsx`**
  - Passa prop `tenantId` para `CalendarModal`

- **`src/index.css`** - Animações para calendário
  - Animação `fadeIn` ao abrir modal
  - Hover com `scale(1.05)` nos dias
  - Transições suaves em todos os estados
  - Dia selecionado com gradiente

### 📚 Documentação

#### Arquivos Atualizados
- **`docs/api-reference.md`**
  - Adicionado endpoint GET `/api/v1/appointments/`
  - Atualizado índice de endpoints
  - Exemplos de uso do novo endpoint

- **`docs/backend.md`**
  - Documentação do novo endpoint GET `/api/v1/appointments/`
  - Lógica de filtros e ordenação

- **`docs/frontend.md`**
  - Documentação do hook `useMonthAppointments`
  - Documentação dos types `src/types/appointment.ts`
  - Documentação dos helper methods de `api.ts`
  - Exemplos de uso práticos

- **`docs/INDICE.md`**
  - Atualizado com novo hook `useMonthAppointments`
  - Atualizado com novo endpoint GET `/api/v1/appointments/`

- **`docs/implementacao-calendario-funcional.md`**
  - Marcado como IMPLEMENTADO
  - Adicionada seção de conclusão com lista de arquivos modificados

#### Novos Arquivos de Documentação
- **`docs/CHANGELOG.md`** - Este arquivo

### 🐛 Fixes

- Corrigido “reset” pós-login no frontend
 - Fluxo de confirmação de consultas integrado (frontend)
   - Modal de confirmação + PATCH `/api/v1/appointments/{id}` documentado
   - Invalidação de cache (summary/mega-stats/calendário) e fallback local quando id não persistido
   - Hover/cursor apenas em elementos clicáveis (acessibilidade mantida)

### 📚 Documentação

- Integradas nas docs: confirmação de consultas, hover/cursor e exibição de data em “Próximas Consultas”.
  - Adicionada rotina de bootstrap de sessão no `AuthContext` (validação com `/api/auth/me` + prefetch de stats/summary)
  - Introduzido `TenantProvider` com persistência de `tenantId` e correção da ordem de providers
  - Documentação atualizada: `ARCHITECTURE.md` (providers + bootstrap), `API.md` e `RUNBOOK.md` (troubleshooting)

### 🎨 Melhorias de UX

- **Feedback visual imediato** ao interagir com o calendário
- **Loading states** durante carregamento de dados
- **Animações suaves** em todas as transições
- **Cores consistentes** com a paleta da marca
- **Acessibilidade** (ARIA labels, keyboard navigation)

### 🔍 Detalhes Técnicos

- **Cache Strategy**: 30 segundos (staleTime)
- **Timezone**: America/Recife em todas as operações
- **Query Keys**: `['appointments', tenantId, year, month]`
- **Error Handling**: ApiError customizada
- **Type Safety**: Types TypeScript alinhados com backend

### 📊 Performance

- Cache automático de queries (React Query)
- Invalidação inteligente de cache após mutations
- Memoização de listas de appointments (`useMemo`)
- Refetch otimizado apenas ao focar janela

---

## [1.0.0] - 2025-10-01

### ✨ Lançamento Inicial

- Sistema de autenticação JWT com httpOnly cookies
- Dashboard com estatísticas
- Gerenciamento de agendamentos básico
- Interface responsiva com Tailwind CSS
- Backend FastAPI com SQLite
- Frontend React + TypeScript + Vite

---

**Legenda:**
- ✨ Nova funcionalidade
- 🔧 Mudança no backend
- ⚛️ Mudança no frontend
- 📚 Documentação
- 🐛 Bug fix
- 🎨 Melhorias de UI/UX
- 🔍 Detalhes técnicos
- 📊 Performance
- ⚡ Otimizações


