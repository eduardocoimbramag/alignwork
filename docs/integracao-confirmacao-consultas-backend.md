# 🔗 Integração da Confirmação de Consultas com o Backend

> Última atualização: Outubro 2025
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md), [`SECURITY.md`](./SECURITY.md), [`confirmacao-de-consultas.md`](./confirmacao-de-consultas.md), [`hover-e-confirmacao-de-consultas.md`](./hover-e-confirmacao-de-consultas.md)

---

## 🎯 Objetivo

Descrever como integrar a confirmação de consultas no frontend com o backend para que a alteração de status seja persistida no banco e sincronizada com a UI.

---

## 🧩 Por que aparece “confirmada localmente”?

- A mensagem indica que a mudança de status foi aplicada apenas em memória (estado do frontend), sem efetuar uma requisição ao backend.
- Consequência: ao recarregar a página ou abrir em outro dispositivo, o status volta para `pendente`, pois o banco de dados não foi atualizado.

Tecnicamente:
- O handler de confirmação no frontend está executando uma atualização local (otimista) e/ou caindo em fallback (ex.: quando o PATCH retorna 404), sem persistir no servidor.

---

## ✅ Comportamento Esperado

- Ao confirmar uma consulta no modal, o frontend deve enviar uma requisição ao backend para atualizar o status no banco (`pending` → `confirmed`).
- A resposta do backend deve retornar o recurso atualizado (consulta com `status: "confirmed"`).
- O frontend deve sincronizar o estado (invalidate/refetch) para refletir a mudança sem recarregar a página.

---

## 🛠️ Passos para Integração

### 1) Verificar/Definir Endpoint no Backend

- Endpoint existente (preferencial, conforme `API.md`):
  - Método: `PATCH`
  - Rota: `/api/v1/appointments/{appointment_id}`
  - Body:
    ```json
    { "status": "confirmed" }
    ```
  - Resposta: objeto do appointment atualizado (200 OK)

- Caso queira um endpoint semântico específico de confirmação (opcional):
  - Método: `PATCH`
  - Rota: `/api/v1/appointments/{appointment_id}/confirm`
  - Body: `{}` (ou nenhum body)
  - Resposta: objeto do appointment atualizado

- Parâmetros e validações recomendados:
  - `appointment_id` (path param) obrigatório
  - `tenantId` derivado do contexto (autorização) ou validado no handler
  - `status` aceitando valores válidos: `pending | confirmed | cancelled`

### 2) Frontend – Função/Hook de Integração

- Função responsável (exemplo conceitual): `useUpdateAppointmentStatus(tenantId)`
  - Assinatura: `{ appointmentId: string, tenantId: string, status: 'confirmed', startsAtUTC?: string }`
  - Requisição:
    ```ts
    await api.patch(`/api/v1/appointments/${appointmentId}`, { status: 'confirmed' })
    ```
  - Tratamento de erros: exibir toast amigável; se 404, não persistir otimista; se 5xx, oferecer retry.

### 3) Sincronização de Estado (Cache/Lista/Estatísticas)

- Após sucesso (200 OK):
  - Invalidar/refetchar queries impactadas (TanStack Query):
    - `['dashboardSummary', tenantId]`
    - `['dashboardMegaStats', tenantId]`
    - `['appointments', tenantId, year, month]` (calendário)
    - `['appointmentsByDay', tenantId, YYYY-MM-DD]` (se utilizada)
    - Lista de "Próximas Consultas" (se existir chave específica)
  - Alternativa: atualização otimista do item + invalidation para confirmar consistência.

### 4) UX/Feedback

- No modal de confirmação:
  - Desabilitar botões durante a requisição.
  - Em sucesso: fechar modal, mostrar toast de sucesso, refletir status imediatamente.
  - Em erro: manter modal aberto ou fechar com toast de erro (decisão de UX), sem alterar status local.

---

## 🔒 Boas Práticas Recomendadas

- Atualização Otimista com Rollback:
  - Atualizar imediatamente a UI para `confirmed` e, se a requisição falhar, reverter para `pending` e notificar o usuário.

- Segurança e Autenticação:
  - Requisições com `credentials: 'include'` (cookies httpOnly) ou Bearer token conforme padrão do projeto.
  - Backend deve validar autenticação e autorização (ex.: `get_current_user`) e, se aplicável, conferir `tenant_id` do recurso.

- Resposta do Backend:
  - Retornar o recurso atualizado após o PATCH (evita inconsistências e remove necessidade de request adicional só para leitura).

- Logs/Observabilidade:
  - Logar confirmações e falhas (client e server) para auditoria e troubleshooting.

---

## 🧪 Exemplo de Fluxo (Conceptual)

1. Usuário clica em “Sim” no modal de confirmação.
2. Frontend chama `PATCH /api/v1/appointments/{id}` com `{ status: 'confirmed' }`.
3. Backend valida, atualiza no banco e retorna 200 + objeto atualizado.
4. Frontend:
   - Atualiza item localmente (se necessário)
   - Invalida queries de summary/mega-stats/calendário/listas
   - Exibe toast “Consulta confirmada com sucesso”.

---

## 📝 Resumo

- Problema atual: confirmação aplicada apenas no frontend ("confirmada localmente"), sem persistência — status volta para `pendente` após reload.
- Solução proposta: integrar o fluxo de confirmação ao backend via `PATCH /api/v1/appointments/{id}` (ou rota específica `.../confirm`), com sincronização do cache (invalidate/refetch), feedback ao usuário e boas práticas de autenticação/otimismo com rollback.
