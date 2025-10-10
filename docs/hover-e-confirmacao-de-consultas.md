# 🖱️ Hover e Confirmação de Consultas (UX + Persistência)

> Última atualização: Outubro 2025
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md), [`SECURITY.md`](./SECURITY.md), [`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md), [`confirmacao-de-consultas.md`](./confirmacao-de-consultas.md)

---

## 🎯 Objetivo

- Padronizar UX de itens clicáveis em “Próximas Consultas” (cursor pointer no hover/focus) para comunicar ação de clique.
- Garantir que a confirmação via modal persista o status como "confirmado" no backend e atualize a UI imediatamente (sem reload), com revalidação/refetch ou atualização otimista.

---

## 🧩 Contexto do Problema

1) Hover não indica clique: itens que abrem modal de confirmação não mudam o cursor do mouse para `pointer` no `:hover`, prejudicando a percepção de interatividade.
2) Confirmação não persiste na UI: após confirmar via modal, a consulta permanece com status "pendente" ou a UI não reflete a alteração, indicando ausência de revalidação/refetch ou de update otimista.

---

## ✅ Comportamento Esperado

- a) Qualquer card/linha clicável deve exibir `cursor: pointer` em `:hover` (e foco visível no teclado).
- b) Ao confirmar no modal, a consulta é atualizada para "confirmado" no backend e a UI reflete a mudança sem recarregar a página, atualizando listas/estatísticas relevantes via revalidação/refetch ou atualização otimista confiável.

---

## 🔍 Diagnóstico – Checklist

Frontend
- O componente “Próximas Consultas” aplica o estado clicável apenas em itens `pendente`? Há onClick no wrapper correto?
- O wrapper que recebe onClick possui classe/estilo para `cursor: pointer` (ex.: Tailwind `cursor-pointer`) e foco visível (`focus:outline-none focus-visible:ring-2`)?
- O handler de confirmação do modal chama efetivamente o service/API (verificar payload, retorno e tratamento de erro)?
- Após sucesso, a lista é revalidada com TanStack Query (`invalidateQueries/refetchQueries`) ou atualizada de forma otimista? Existe fallback em caso de erro?

Backend
- Existe endpoint para atualizar status (ex.: `PATCH /api/v1/appointments/{id}`)?
- O endpoint exige payload/params (ex.: `status`, `tenantId`)? O valor "confirmed" é aceito no modelo?
- A resposta retorna o recurso atualizado (para potencial update otimista)? Erros são informativos (HTTP 4xx/5xx com `detail`)?

---

## 🧠 Proposta de Solução (Passo a Passo)

### 1) UX / Hover (Frontend)
- Padronizar utilitário/estilo para elementos clicáveis de consultas:
  - Wrapper clicável: adicionar classes Tailwind `cursor-pointer hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple`.
  - Para ícones/labels internos que também disparem clique, garantir que o wrapper pai tenha o handler e o `cursor-pointer` seja herdado.
  - Acessibilidade: garantir `tabIndex={0}` e `role="button"` se não for um elemento nativamente clicável, além de `Enter/Space` para acionar a ação.

### 2) Confirmação e Persistência (Frontend + Backend)

Backend (referência)
- Rota existente: `PATCH /api/v1/appointments/{appointment_id}` (ver `API.md`).
- Payload: `{ "status": "confirmed" }`.
- Resposta: objeto do appointment atualizado.

Frontend – Serviço/Hook
- Função de atualização: `useUpdateAppointmentStatus(tenantId)` (ver `src/hooks/useAppointmentMutations.ts`).
- Assinatura esperada: `{ appointmentId: string, tenantId: string, status: 'pending' | 'confirmed' | 'cancelled', startsAtUTC?: string }`.
- Tratamento de erro: exibir toast amigável; não alterar UI otimisticamente em caso de falha.

Frontend – Componente (Próximas Consultas)
- Fluxo do modal:
  1. Ao clicar em consulta `pendente`, abrir modal centralizado perguntando: “Deseja confirmar a consulta de {nome} no dia {data} às {hora}?”
  2. Botão “Sim”: chamar `updateStatus({ appointmentId, tenantId, status: 'confirmed' })` e controlar loading/erro.
  3. Em sucesso: fechar modal, atualizar item na UI (otimista) e/ou disparar revalidação das queries.
  4. Botão “Não”: fechar modal sem alterações.

Estado Global/Cache (React Query)
- Invalidar/refetchar chaves após confirmação para refletir contadores e listas:
  - `['dashboardSummary', tenantId]`
  - `['dashboardMegaStats', tenantId]`
  - `['appointments', tenantId, year, month]` (calendário mensal, se exibido)
  - `['appointmentsByDay', tenantId, YYYY-MM-DD]` (se usada)
  - Qualquer lista de “próximas consultas” cacheada (ex.: `['upcomingAppointments', tenantId]`, se existir)
- Alternativa otimista: atualizar diretamente o item no cache local (e também invalidar para garantir consistência com o backend).

### 3) Testes Manuais
- Hover/foco: ao posicionar o mouse em item clicável, cursor vira `pointer`; navegando por teclado, foco é visível.
- Modal: clicar em pendente abre modal; “Não” fecha sem alterar; “Sim” confirma e UI reflete mudança sem reload.
- Dados: contadores (summary/mega-stats) e listas atualizam após confirmação; recarregar página mantém estado confirmado (persistido no backend).
- Erros: em caso de falha no PATCH, mostrar mensagem e manter UI consistente (sem alterar status localmente ou revertendo update otimista).

---

## 📐 Critérios de Aceitação
- Cursor `pointer` em todos os elementos de consulta que executam ação ao clique.
- Modal de confirmação abre para pendentes e funciona em todos tamanhos de tela.
- Ao confirmar, status muda para "confirmado" sem reload e contadores/listas refletem a alteração.
- Mensagens de erro amigáveis e acessibilidade preservada (foco, navegação por teclado).

---

## 📝 Observações Finais
- Não alterar estilos globais não relacionados; manter alinhamento à esquerda e visual atual.
- Centralizar o padrão de interatividade (cursor/foco) em uma classe utilitária, para reutilização em outros componentes clicáveis.
- Preferir revalidação rápida pós-update (para consistência com backend) e, quando necessário, usar update otimista com rollback em erro.

---

## 🔎 Referências
- `API.md` — PATCH `/api/v1/appointments/{appointment_id}`
- `ARCHITECTURE.md` — Hooks/Providers e fluxo de dados
- `RUNBOOK.md` — CORS, cookies (credentials: 'include') e troubleshooting
- `SECURITY.md` — Autenticação em cookies httpOnly
- `confirmacao-de-consultas.md` — Documento complementar de confirmação
