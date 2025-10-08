# 🗺️ AlignWork - Roadmap

> **Última atualização:** Outubro 2025  
> **Status do Projeto:** MVP em desenvolvimento

---

## 🎯 Quando usar este documento

Use este documento para:
- Entender a direção do produto
- Priorizar features a implementar
- Planejar sprints e releases
- Alinhar expectativas com stakeholders
- Decidir sobre contribuições

---

## Visão do Produto

**AlignWork** é uma plataforma SaaS para gestão completa de consultórios e clínicas, focando em:
- **Simplicidade:** Interface intuitiva e fluxos rápidos
- **Eficiência:** Automação de tarefas repetitivas
- **Multi-tenancy:** Suporte para múltiplos consultórios/profissionais
- **Escalabilidade:** Arquitetura preparada para crescimento

---

## Status Atual (Outubro 2025)

### ✅ Implementado

**Autenticação:**
- ✅ Registro de usuários
- ✅ Login com JWT (httpOnly cookies)
- ✅ Refresh tokens
- ✅ Proteção de rotas

**Agendamentos:**
- ✅ CRUD de appointments
- ✅ Filtros por data
- ✅ Status (pending, confirmed, cancelled)
- ✅ Multi-tenancy (tenant_id)

**Dashboard:**
- ✅ Estatísticas hoje/semana/mês/próximo mês
- ✅ Calendário interativo
- ✅ Resumo de consultas
- ✅ Cards de status

**Infraestrutura:**
- ✅ Backend FastAPI
- ✅ Frontend React + TypeScript
- ✅ SQLite (desenvolvimento)
- ✅ React Query (state management)
- ✅ Tailwind + shadcn/ui

### 🚧 Em Desenvolvimento

- 🚧 CRUD de pacientes
- 🚧 Histórico de consultas
- 🚧 Prontuário eletrônico
- 🚧 Confirmação de agendamento (notificações)

---

## Roadmap de Features

### 🎯 Fase 1: MVP Completo (Q4 2025)

**Objetivo:** Sistema funcional para uso em consultório único

#### Gestão de Pacientes
- [ ] CRUD completo de pacientes
- [ ] Campos: nome, CPF, telefone, email, endereço, convênio
- [ ] Upload de foto
- [ ] Histórico de consultas
- [ ] Busca e filtros
- [ ] Exportar lista (CSV/PDF)

#### Prontuário Eletrônico
- [ ] Criar/editar prontuário por consulta
- [ ] Campos: anamnese, exame físico, diagnóstico, prescrição
- [ ] Templates de prontuário
- [ ] Anexar arquivos (exames, laudos)
- [ ] Histórico de prontuários por paciente

#### Agenda Avançada
- [ ] Visualização semanal/diária
- [ ] Drag-and-drop para reagendar
- [ ] Bloqueios de horário (almoço, férias)
- [ ] Configuração de horários de atendimento
- [ ] Duração customizável por tipo de consulta

#### Notificações
- [ ] Email de confirmação de agendamento
- [ ] WhatsApp (futuro, integração)
- [ ] Lembretes 24h antes
- [ ] Confirmação de presença

#### Financeiro Básico
- [ ] Registro de pagamentos
- [ ] Status: pago, pendente, cancelado
- [ ] Métodos de pagamento
- [ ] Relatório financeiro mensal

### 🚀 Fase 2: Multi-Tenancy Real (Q1 2026)

**Objetivo:** Suporte para múltiplos consultórios/profissionais

#### Multi-tenancy
- [ ] Isolamento de dados por tenant
- [ ] Subdomínios (tenant.alignwork.com)
- [ ] Planos e billing (free, pro, enterprise)
- [ ] Dashboard admin (gerenciar tenants)

#### Gestão de Usuários
- [ ] Múltiplos usuários por tenant
- [ ] Roles (admin, médico, secretária, recepccionista)
- [ ] Permissões granulares
- [ ] Convite de usuários por email

#### Agenda Compartilhada
- [ ] Múltiplos profissionais
- [ ] Filtrar por profissional
- [ ] Sala de atendimento
- [ ] Conflitos de horário

### 📈 Fase 3: Otimização e Escala (Q2 2026)

**Objetivo:** Performance, UX e analytics

#### Performance
- [ ] Migração SQLite → PostgreSQL
- [ ] Redis caching
- [ ] CDN para assets
- [ ] Lazy loading otimizado
- [ ] Paginação/virtualização de listas

#### Analytics
- [ ] Dashboard de métricas
- [ ] Taxa de no-show
- [ ] Receita por período
- [ ] Pacientes ativos/inativos
- [ ] Exportar relatórios

#### UX/UI
- [ ] Modo escuro
- [ ] Atalhos de teclado
- [ ] Onboarding interativo
- [ ] Tour guiado
- [ ] Feedback de ações (toasts melhores)

#### PWA
- [ ] Service worker
- [ ] Instalável
- [ ] Offline-first (sync quando online)
- [ ] Push notifications

### 🔮 Fase 4: Integrações (Q3 2026)

**Objetivo:** Conectar com ecossistema externo

#### Integrações
- [ ] WhatsApp Business API
- [ ] Google Calendar (sync)
- [ ] Stripe/PagSeguro (pagamentos)
- [ ] Zapier
- [ ] API pública (webhook)

#### Telemedicina (MVP)
- [ ] Videochamadas (Jitsi/Twilio)
- [ ] Sala de espera virtual
- [ ] Gravação de consultas (opt-in)
- [ ] Chat em tempo real

---

## Melhorias Técnicas

### Alta Prioridade

- [ ] **Testes automatizados**
  - Backend: pytest + coverage
  - Frontend: Vitest + RTL
  - E2E: Playwright
  - Target: >80% coverage

- [ ] **CI/CD**
  - GitHub Actions
  - Lint, type check, tests
  - Deploy automático para staging
  - Rollback fácil

- [ ] **Logs estruturados**
  - Loguru (backend)
  - Error tracking (Sentry)
  - APM (New Relic/DataDog)

- [ ] **Documentação**
  - Swagger UI melhorado
  - Guia de contribuição atualizado
  - Video tutorials

### Média Prioridade

- [ ] **Database migrations**
  - Alembic (SQLAlchemy)
  - Versionamento de schema
  - Rollback de migrations

- [ ] **Rate limiting**
  - Proteção contra abuse
  - Throttling por endpoint
  - IP blocking

- [ ] **Monitoring**
  - Uptime monitoring
  - Performance metrics
  - Error rates
  - Alertas

- [ ] **i18n**
  - Suporte a português e inglês
  - react-i18next
  - Traduções de erros

### Baixa Prioridade

- [ ] **GraphQL**
  - Alternativa REST (considerar)
  - Menos overfetching

- [ ] **Mobile apps**
  - React Native
  - Expo
  - iOS/Android nativos

- [ ] **Desktop apps**
  - Electron
  - Tauri (Rust)

---

## Backlog de Bugs/Refactors

### Crítico
- [ ] Migrar de SQLite para PostgreSQL
- [ ] Implementar HTTPS em produção
- [ ] Validar timezone em todos os endpoints

### Alto
- [ ] Refatorar serviço de auth (muita lógica em routes)
- [ ] Componentizar Dashboard (muito grande)
- [ ] Criar error boundaries (React)
- [ ] Adicionar retry logic em mutations

### Médio
- [ ] Padronizar nomes de componentes (alguns em PT, outros EN)
- [ ] Remover console.logs
- [ ] Adicionar JSDoc em funções complexas
- [ ] Otimizar bundle size (tree-shaking)

### Baixo
- [ ] Melhorar mensagens de erro (mais user-friendly)
- [ ] Adicionar animações (Framer Motion)
- [ ] Padronizar spacing (Tailwind config)

---

## Decisões de Produto

### ✅ Decidido

1. **Foco em consultórios/clínicas** (não hospitais)
2. **SaaS multi-tenant** (não on-premise)
3. **Freemium model** (plano gratuito + pagos)
4. **Web-first** (mobile secundário)
5. **Português primeiro** (inglês depois)

### 🤔 A Decidir

1. **Telemedicina:** Incluir no core ou módulo separado?
2. **Marketplace:** Permitir plugins de terceiros?
3. **White-label:** Permitir branding customizado?
4. **Open-source:** Tornar código aberto?
5. **IA:** Features de IA (sugestão de diagnóstico, etc.)?

---

## Releases Planejadas

### v0.1.0 - MVP Alpha (Novembro 2025)
- ✅ Auth completo
- ✅ Appointments CRUD
- ✅ Dashboard básico
- 🚧 Patients CRUD

### v0.2.0 - MVP Beta (Dezembro 2025)
- Prontuário eletrônico
- Notificações por email
- Financeiro básico

### v0.3.0 - MVP Público (Janeiro 2026)
- Multi-tenancy real
- Planos e billing
- Onboarding

### v1.0.0 - Primeiro Release Estável (Março 2026)
- Todos features do MVP completo
- Testes >80% coverage
- Documentação completa
- Performance otimizada

---

## Como Priorizar

**Framework:** MoSCoW

- **Must have:** Essencial para MVP (auth, appointments)
- **Should have:** Importante mas não bloqueante (prontuário, notificações)
- **Could have:** Desejável (analytics, integrações)
- **Won't have (now):** Fora do escopo atual (mobile app, IA)

**Critérios:**
1. **Impacto no usuário:** Resolve problema real?
2. **Esforço de desenvolvimento:** Horas/dias/semanas?
3. **Dependências:** Bloqueia outras features?
4. **ROI:** Custo vs. benefício

---

## Feedback e Contribuições

Sugestões de features? Abra uma issue com label `feature-request`.

Template:
```markdown
## Feature Request

**Problema:**
Como usuário, eu preciso...

**Solução proposta:**
Implementar...

**Alternativas:**
Considerei...

**Impacto:**
- [ ] Essencial (blocker)
- [ ] Importante
- [ ] Nice to have
```

---

**Próximas seções:** Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para contribuir e [SECURITY.md](./SECURITY.md) para reportar vulnerabilidades.

