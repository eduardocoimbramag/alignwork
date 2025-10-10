# 👥 Correção do Card “Total de Clientes” exibindo 0

> Última atualização: Outubro 2025  
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md)

---

## 1) Diagnóstico técnico (causas prováveis)

- Rota incorreta: chamadas usando `/v1/...` em vez de `/api/v1/...` (retorna 404/vazio).
- Endpoint inexistente para contagem: o frontend tenta ler “total” de uma rota que não fornece metadados/contador.
- Falta de `tenantId`/`organizationId` na querystring: o backend requer filtro multi-tenant; sem ele, retorna 0/lista vazia.
- Hook executando antes de termos `tenantId`: precisa de `enabled: !!tenantId` para evitar request prematura.
- Leitura incorreta do wrapper HTTP: nosso cliente retorna `{ data, status, ok }`; o hook deve usar `res.data` e não o objeto inteiro.
- Cache desatualizado: após criar/editar/deletar cliente, não há `invalidate/refetch` de `['clientsCount']`/listas, mantendo 0.
- Filtro de status: contagem considera apenas `active`, mas dados seed podem estar `pending/inactive`.
- CORS/auth: requisição sem credenciais (`credentials: 'include'`) → 401/403 silencioso; a UI mostra 0 como fallback.

---

## 2) Comportamento esperado

- O card exibe o número real de clientes do tenant atual (multi-tenant) conforme filtros de negócio.
- Ao cadastrar um novo cliente, o card atualiza automaticamente (invalidate/refetch) sem recarregar a página.
- Contagem considera somente estados contabilizáveis (ex.: `active`), ignorando `inactive/soft-deleted` (definir regras claras).

---

## 3) API contratual (proposta)

Verificar se já existe endpoint de contagem:

- Opção A — Endpoint dedicado (recomendado):
  - Método: `GET`
  - Rota: `/api/v1/clients/count`
  - Parâmetros (query): `tenantId` (obrigatório), `status=active` (opcional)
  - Resposta (200):
    ```json
    { "count": 42 }
    ```

- Opção B — Endpoint de lista com total (meta):
  - Método: `GET`
  - Rota: `/api/v1/clients`
  - Parâmetros (query): `tenantId` (obrigatório), `limit=1`, `includeTotal=true`, `status=active`
  - Resposta (200):
    ```json
    {
      "data": [ { "id": "...", "name": "..." } ],
      "meta": { "total": 42 }
    }
    ```

Requisitos de auth/segurança:
- Cookies httpOnly ou Bearer Token (conforme padrão do projeto) — ver `SECURITY.md`.
- Sempre enviar `credentials: 'include'` no frontend.

Observações:
- Filtrar por `tenantId` é obrigatório para multi-tenant.
- Definir claramente o conjunto de estados contabilizáveis (ex.: `active`).

---

## 4) Frontend (Query + Service)

Hook (TanStack Query):
- `queryKey`: `['clientsCount', tenantId, status]`
- `enabled`: `!!tenantId` (evita request prematura)
- `queryFn`:
  - Chamar o serviço HTTP correto (endpoint de contagem ou lista com `includeTotal=true`).
  - Retornar `res.data` (lembrar do wrapper `{ data, status, ok }`).
- Recomendações: `staleTime: 30_000` e `refetchOnWindowFocus: true`.

Service (HTTP):
- Função tipada para `GET /api/v1/clients/count` (ou `/clients?includeTotal=true`).
- Base URL correta (com `/api`); garantir `credentials: 'include'`.

Atualização pós-mutation:
- Após criar/editar/deletar cliente → `invalidateQueries(['clientsCount'])` e listas relacionadas (`['clients', ...]`).

Erros e loading:
- Mostrar skeleton/placeholder enquanto carrega.
- Em erro, exibir toast amigável e oferecer “tentar novamente”.

---

## 5) Testes e validação

- Cenário 1: existir ≥1 cliente ativo → card deve exibir o número correto.
- Cenário 2: criar novo cliente → total incrementa após `invalidate/refetch`.
- Cenário 3: usuário sem clientes → card mostra “0” com UI consistente.
- Cenário 4: `tenantId` ausente/incorreto → a query não dispara (`enabled` bloqueia) ou retorna 0 de forma explícita.
- Cenário 5: wrapper vs data direta → validar que o hook lê `res.data` e não `{ data, status, ok }` inteiro.
- Cenário 6: auth/CORS → validar cookies; requisições não autenticadas devem exibir erro, não 0 silencioso.

---

## 6) Critérios de aceitação

- O card apresenta o total correto para o tenant logado.
- O número atualiza imediatamente após operações de cliente, sem reload.
- Não há 404/401/403 silenciosos; erros são tratados e visíveis (toast/log).
- Contrato de API e filtros padronizados e documentados.

---

## Resumo curto

O card exibe 0 porque a contagem está sendo lida/contada de forma incorreta (rota sem `/api`, ausência de `tenantId`, leitura errada do wrapper `{ data, status, ok }`, falta de `invalidate/refetch`, ou auth/CORS). A correção: usar endpoint/contrato de contagem padronizado, enviar `tenantId` e credenciais, ler via `res.data`, e invalidar `['clientsCount']` após mutations — garantindo que o total de clientes no dashboard reflita o estado real do backend de forma consistente e imediata.
