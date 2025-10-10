# 📊 Correção dos Contadores do Card “Calendário” (Hoje, Semana, Mês, Próximo Mês)

> Última atualização: Outubro 2025  
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md)

---

## Contexto

Após criar/alterar/cancelar uma consulta, os quatro contadores do card “Calendário” continuam em 0. Os endpoints de estatísticas existem, mas o dashboard não atualiza. Os contadores devem refletir a quantidade de consultas “confirmadas” e “pendentes” por período.

---

## Comportamento Esperado

- Atualização imediata (sem reload) após qualquer mutation de consulta (create/update/cancel).
- Contabilizar apenas status “confirmed” e “pending” (ignorar “cancelled”).
- Períodos (em timezone da aplicação):
  - Hoje: 00:00–23:59 do dia atual
  - Semana vigente: domingo 00:00 até sábado 23:59
  - Mês vigente: 1º dia 00:00 até último dia 23:59
  - Mês subsequente: 1º dia do próximo mês 00:00 até último dia 23:59

---

## Diagnóstico (Checklist)

1) Rota e baseURL
- Hooks devem chamar `/api/v1/appointments/mega-stats` (e/ou `/summary`) usando a baseURL com `/api` e `credentials: 'include'`.

2) Parâmetros obrigatórios
- `tenantId` presente na querystring; `tz` definido (ex.: `America/Recife`).

3) Leitura de resposta (wrapper)
- O cliente HTTP retorna `{ data, status, ok }`. Os hooks devem usar `res.data`, não o objeto inteiro.

4) Disparo da query
- Usar `enabled: !!tenantId` para evitar request prematura sem tenant.

5) Cache/invalidations
- Após mutations de consulta, invalidar/refetch as queryKeys dos contadores:
  - `['dashboardMegaStats', tenantId]`
  - (Se usado) `['dashboardSummary', tenantId, from, to]`
  - Invalidar também listas de agenda que alimentam o dashboard.

6) Timezone
- Converter UTC → TZ local antes de montar intervalos para evitar off-by-one (virada de dia).

7) Filtros de status
- Garantir que o backend soma apenas `confirmed` e `pending` (ignora `cancelled`).

8) Erros silenciosos
- Inspecionar 401/403/404/500; tratar `ApiError` e exibir fallback + “tentar novamente”.

---

## Especificação Técnica (para implementar depois)

### Hook: `useDashboardMegaStats(tenantId: string, tz = 'America/Recife')`
- `queryKey`: `['dashboardMegaStats', tenantId, tz]`
- `enabled`: `!!tenantId`
- `queryFn`:
  - `GET /api/v1/appointments/mega-stats?tenantId=...&tz=America/Recife`
  - Retornar `res.data` no formato:
    ```json
    {
      "today": { "confirmed": 0, "pending": 0 },
      "week": { "confirmed": 0, "pending": 0 },
      "month": { "confirmed": 0, "pending": 0 },
      "nextMonth": { "confirmed": 0, "pending": 0 }
    }
    ```
- Recomendações: `staleTime: 30_000` e `refetchOnWindowFocus: true`.

### Serviço HTTP (tipado)
- `appointmentsService.getMegaStats({ tenantId, tz })` → `api.get('/api/v1/appointments/mega-stats', { params: { tenantId, tz } })` → `res.data`.

### Invalidações após mutations de consultas
- Em `useCreateAppointment`/`useUpdateAppointmentStatus`/`useCancelAppointment`:
  - `invalidateQueries(['dashboardMegaStats', tenantId])`.
  - (Se usado) `invalidateQueries(['dashboardSummary', tenantId])`.
  - Invalidar também queries de agenda mensal/diária relacionadas.

### Backend (se faltar algo)
- Garantir que o endpoint `/api/v1/appointments/mega-stats` agrega apenas `confirmed` e `pending`, calculando os buckets em TZ local e convertendo para UTC ao consultar o banco.
- Documentar contrato e exemplos em `API.md`.

---

## Testes Sugeridos

- Criar uma consulta para hoje → “Hoje” sobe de 0 para 1 (pendente/confirmada conforme status).
- Mudar status pendente → confirmada → contadores refletem a alteração.
- Criar consulta no mês seguinte → apenas “Mês subsequente” altera.
- Trocar `tenantId` → contadores mudam conforme dados do tenant.
- Desconectar/auth inválida → exibir fallback e botão “tentar novamente”.

---

## Critérios de Aceitação

- Após criar/editar/cancelar consulta, os contadores atualizam sem reload.
- Os quatro períodos exibem números consistentes com o backend.
- Nenhum erro silencioso; fallback e retry visíveis em caso de falha.

---

## Resumo

O dashboard não revalida os contadores após mudanças de agenda e/ou chama a rota/params errados. A solução é padronizar a chamada ao endpoint de `mega-stats`, respeitar `tenantId/tz`, ler `res.data` corretamente e invalidar/refetch as queries de contadores após qualquer mutation de consulta — garantindo números atualizados para Hoje, Semana, Mês e Próximo Mês.
