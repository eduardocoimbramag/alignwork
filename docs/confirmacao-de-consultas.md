# ✅ Confirmação de Consultas (Fluxo Pendente → Confirmada)

> Última atualização: Outubro 2025
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md), [`SECURITY.md`](./SECURITY.md), [`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`INDEX.md`](./INDEX.md), [`ROADMAP.md`](./ROADMAP.md)

---

## 🎯 Objetivo

Documentar o problema atual na seção “Próximas Consultas”, onde consultas com status “Pendente” não podem ser confirmadas, e descrever uma solução completa (backend + frontend) com modal de confirmação e revalidação dos dados.

---

## 🧩 Sintoma

- Em “Próximas Consultas”, itens com status `pendente` não oferecem ação para mudar para `confirmado`.
- Espera-se uma confirmação explícita do usuário (modal) antes de alterar o status.

---

## 🔎 Causa Técnica (por que não muda hoje)

Análise do frontend atual:
- O componente `src/components/Dashboard/RecentAppointments.tsx` exibe os próximos agendamentos a partir do `AppContext` (dados em memória), não do backend.
- A função interna `handleStatusChange` só alterna entre `confirmado ⇄ concluido`. Não há transição de `pendente → confirmado`.
- Para o status `pendente`, há apenas um ícone (Hourglass) sem ação de confirmação (não abre modal, nem dispara mutation).

Recursos já existentes que não estão integrados a essa tela:
- Backend possui endpoint `PATCH /api/v1/appointments/{appointment_id}` para atualizar status (ver `API.md`).
- Frontend possui `useUpdateAppointmentStatus(tenantId)` em `src/hooks/useAppointmentMutations.ts` para chamar o endpoint e invalidar/agendar revalidações via `useInvalidateAgenda`.

Conclusão: falta de integração do fluxo de confirmação nessa UI específica (evento de clique e modal), além de não usar o hook de atualização do backend nessa listagem.

---

## ✅ Comportamento Esperado

- Ao clicar em uma consulta com status `Pendente`, abrir um modal centralizado perguntando:
  “Deseja confirmar a consulta de {nome do paciente} no dia {data} às {hora}?”
- Botões no modal:
  - **Sim**: dispara atualização para `confirmado`, fecha modal, atualiza UI e revalida listas/estatísticas.
  - **Não**: fecha modal sem alterar o status.

---

## 🧠 Opções de Solução

1) Backend (se necessário)
- Garantir que o endpoint `PATCH /api/v1/appointments/{id}` aceite `{ "status": "confirmed" }` e aplique validações.
- Já documentado em `API.md` → “PATCH /api/v1/appointments/{appointment_id}`”.

2) Frontend (recomendado)
- Adicionar ação de clique nos cards/badge de consultas pendentes em `RecentAppointments` para abrir o modal.
- Criar um modal de confirmação (shadcn/ui `AlertDialog` ou `Dialog`) com mensagem e os botões “Sim/Não”.
- No “Sim”, usar `useUpdateAppointmentStatus(tenantId)` para atualizar o backend, e `useInvalidateAgenda(tenantId)` para revalidar dados (stats e calendário). Opcionalmente, refletir otimistamente no `AppContext` para feedback imediato.

3) Evolução sugerida (futuro)
- Migrar “Próximas Consultas” para consumir diretamente do backend (React Query) ao invés de apenas `AppContext`, evitando divergência entre in-memory e dados reais.

---

## 🛠️ Passo a Passo (Implementação)

### 1) Backend (FastAPI)

Verificar se já está pronto (referência em `API.md`):
- `PATCH /api/v1/appointments/{appointment_id}`
- Body:
```json
{ "status": "confirmed" }
```
- Resposta: objeto do appointment com `status: "confirmed"`.

Caso não exista ou precise ajustar:
- Implementar/confirmar rota em `backend/routes/appointments.py` com validação de status permitido (`pending | confirmed | cancelled`).
- Garantir filtros por `tenant_id` e retorno consistente (ver `ARCHITECTURE.md`).

### 2) Frontend (React + TypeScript)

Arquivos envolvidos:
- `src/components/Dashboard/RecentAppointments.tsx`
- `src/components/ui/alert-dialog.tsx` (ou `dialog.tsx`) — modal
- `src/hooks/useAppointmentMutations.ts` — `useUpdateAppointmentStatus`
- `src/hooks/useInvalidateAgenda.ts`
- `src/contexts/TenantContext.tsx` — obter `tenantId`

Passos:

2.1 Criar Modal de Confirmação
- Novo componente: `src/components/Modals/ConfirmarConsultaModal.tsx` (ou usar `AlertDialog` diretamente dentro de `RecentAppointments`).
- Propriedades mínimas:
  - `isOpen: boolean`, `onClose: () => void`
  - `appointmentId: string`
  - `paciente: string`, `data: string`, `hora: string`
- Layout: título, texto com a mensagem, botões “Não” (secondary) e “Sim” (destructive ou primary conforme design).

Exemplo conceitual:
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export function ConfirmarConsultaModal({ isOpen, onClose, paciente, data, hora, onConfirm }: Props) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Deseja confirmar a consulta de {paciente} no dia {data} às {hora}?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Não</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Sim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

2.2 Integrar o clique no item pendente
- Em `RecentAppointments.tsx`, detectar `consulta.status === 'pendente'` e abrir o modal ao clicar no badge/card.
- Preencher o modal com `paciente`, `data` e `hora` da consulta.

2.3 Chamar a mutation ao confirmar
- Obter `tenantId` via `useTenant()`.
- Usar `const { mutateAsync: updateStatus } = useUpdateAppointmentStatus(tenantId)`.
- No handler do “Sim”, chamar:
```ts
await updateStatus({ appointmentId: id, tenantId, status: 'confirmed', startsAtUTC })
```
- `startsAtUTC` pode ser usado pela invalidation (já previsto em `useAppointmentMutations.ts`).

2.4 Revalidar dados e fechar modal
- O `useUpdateAppointmentStatus` já usa `useInvalidateAgenda` na `onSuccess`.
- Fechar modal, exibir toast de sucesso e, opcionalmente, atualizar o `AppContext` via `atualizarStatusAgendamento(id, 'confirmado')` para refletir na UI até que a revalidação conclua.

2.5 Testar fluxo
- Cenário: um agendamento pendente aparece em “Próximas Consultas”. Ao clicar, o modal abre; ao confirmar, o status muda para “Confirmado”; as estatísticas (ex.: “Hoje”) e listas são revalidadas.

### 3) Considerações de UX e Estados
- Desabilitar botão “Sim” enquanto a mutation está em andamento; mostrar spinner opcional.
- Tratar erros com toast amigável.
- Garantir acessibilidade (foco dentro do modal, `aria-*`).

---

## 🔬 Plano de Teste Manual

1. Criar/identificar uma consulta com `status = pendente` no intervalo de “Próximas Consultas”.
2. Clicar no item pendente → modal deve abrir com nome do paciente, data e hora.
3. Clicar “Não” → modal fecha, nada muda.
4. Clicar “Sim” → mutation `PATCH` é disparada; ao concluir:
   - status do item vira “Confirmado”
   - stats/summary e calendário refletem a mudança após revalidação
5. Recarregar a página → as alterações persistem (dados do backend).

---

## ⚠️ Armadilhas Comuns

- Não enviar `tenantId` ou `startsAt` corretos para invalidation → listas não atualizam.
- Esquecer `credentials: 'include'` → 401 ao chamar PATCH (ver `RUNBOOK.md` e `API.md`).
- Tentar alterar apenas `AppContext` sem persistir no backend → perda ao recarregar a página.

---

## 📝 Resumo Executivo

- Problema: consultas pendentes não possuem fluxo de confirmação; UI não abre modal e não chama o backend.
- Necessidade: confirmar consultas com consentimento explícito do usuário (modal) e refletir no dashboard/agenda.
- Solução: adicionar modal de confirmação em “Próximas Consultas”, integrar `useUpdateAppointmentStatus` (PATCH no backend), invalidar cache e atualizar UI. Resultado: fluxo consistente, persistente e alinhado com a UX desejada.

---

## 📚 Referências

- `API.md` — PATCH `/api/v1/appointments/{appointment_id}`
- `ARCHITECTURE.md` — Fluxos, hooks e providers
- `RUNBOOK.md` — CORS, cookies e debugging
- `SECURITY.md` — Cookies httpOnly e autenticação
- `CHANGELOG.md` — Histórico de mudanças
- `CONTRIBUTING.md` — Como propor a implementação via PR
