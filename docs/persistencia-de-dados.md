# 📦 Persistência de Dados entre Logins

> Última atualização: Outubro 2025  
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`RUNBOOK.md`](./RUNBOOK.md), [`SECURITY.md`](./SECURITY.md), [`README.md`](./README.md), [`INDEX.md`](./INDEX.md), [`CHANGELOG.md`](./CHANGELOG.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`ROADMAP.md`](./ROADMAP.md)

---

## 🎯 Objetivo

Descrever por que, após login, o sistema parece “zerado” (sem registros do usuário) e orientar a correção para que, ao autenticar, os dados reais sejam carregados e mantidos durante a sessão.

---

## 🧩 Sintoma

- Após efetuar login com sucesso, o usuário vê o sistema como se fosse um primeiro acesso, sem consultas/clientes exibidos.
- Os dados existem no banco (confirmado no backend), mas o frontend não os carrega/rehidrata automaticamente entre logins.

---

## 🔎 Causa Técnica (diagnóstico)

Na arquitetura atual:
- A autenticação usa JWT em httpOnly cookies (ver `API.md` e `SECURITY.md`).
- O cookie de sessão (access_token) não é lido no JavaScript (por design), mas é enviado automaticamente quando `credentials: 'include'` (ou `withCredentials: true` no Axios) está configurado.

O comportamento “zerado” costuma ocorrer por uma ou mais falhas combinadas:

1) Ausência de sincronização inicial pós-login (bootstrap)
- Depois que o backend define os cookies, o frontend não executa uma rotina imediata para buscar o usuário atual (`GET /api/auth/me`) e nem os dados iniciais (ex.: stats, agenda do mês).  
- Resultado: contextos/estados (AuthContext, AppContext, React Query cache) ficam vazios até que o usuário navegue manualmente ou acione telas específicas.

2) Revalidação de sessão não executada ao iniciar a aplicação
- Ao recarregar a página, não há uma verificação automática do usuário autenticado (`/api/auth/me`).  
- Sem essa verificação, a UI assume estado não autenticado ou sem dados, mesmo com cookies válidos.

3) Falta de re-hidratação do estado global
- React Query/Context não são re-hidratados após login/reload.  
- As queries que dependem de `tenantId`, `tz` ou do `user` não são pré-carregadas/prefetchadas.

4) URLs incorretas ou sem `credentials`
- Hooks chamando endpoints sem o prefixo `/api` podem retornar 404 (ver “Troubleshooting” em `API.md`/`RUNBOOK.md`).
- Requisições sem `credentials: 'include'` ou `withCredentials: true` impedem o envio de cookies, causando 401 e listas vazias.

5) `tenantId` ausente
- Os endpoints de agenda exigem `tenantId`. Se o valor não é restaurado (ex.: do perfil do usuário ou storage), as queries retornam vazio/erro.

---

## ✅ Comportamento Esperado

- Ao logar, o sistema deve:
  - Confirmar sessão com `GET /api/auth/me` (cookies enviados automaticamente).
  - Descobrir e fixar o `tenantId` ativo do usuário.
  - Executar um “bootstrap” de dados iniciais (ex.: stats do dashboard, resumo, agenda do mês atual) e popular o estado global (Contexts + React Query cache).
  - Em recarregamentos de página, repetir a verificação de sessão e re-hidratar dados essenciais, sem exigir nova interação do usuário.

---

## 🧠 Opções de Solução

1) Corrigir o fluxo de autenticação para salvar/reutilizar sessão (cookies) e disparar o bootstrap
- Garantir que todas as requisições usem cookies: `credentials: 'include'` (fetch) ou `withCredentials: true` (Axios).  
- Após `POST /api/auth/login`, chamar `GET /api/auth/me` e, então, pré-carregar dados iniciais.

2) Criar um endpoint de “bootstrap” pós-login
- Endpoint único que retorna: `user`, `tenantId` ativo e um “pacote” de dados iniciais (ex.: `mega-stats`, `summary`, recorte de agenda).  
- Reduz latência (menos round-trips) e simplifica o fluxo no frontend.

3) Implementar rotina de re-hidratação do estado global
- No `AuthContext` (montagem da aplicação) e imediatamente após login:  
  - verificar sessão (`/api/auth/me`),  
  - definir `user`/`tenantId` no estado,  
  - executar `prefetch`/`invalidate` das queries críticas (dashboard e calendário).  
- Opcional: persistir `tenantId` no storage para restauração rápida.

As opções 1, 2 e 3 são complementares. Em muitos produtos, adotamos (1) + (3) inicialmente; (2) é uma otimização/conveniência.

---

## 🛠️ Passo a Passo de Implementação

### 1) Backend (FastAPI)

Garantias básicas (ver `SECURITY.md` e `RUNBOOK.md`):
- CORS com `allow_credentials=True` e `allow_origins` corretos.
- Cookies httpOnly configurados nos endpoints de login/refresh.

Opção A — Usar endpoints existentes e adicionar “bootstrap” lógico no frontend:
- Confirmar que `GET /api/auth/me` está funcional e retorna o usuário autenticado.
- Já existem endpoints para stats/agenda (ver `API.md`: `/api/v1/appointments/*`).

Opção B — Criar um endpoint de Bootstrap (sugestão):

```python
# Exemplo ilustrativo (não implementado ainda)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api", tags=["bootstrap"])

@router.get("/bootstrap")
def bootstrap(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tz: str = "America/Recife",
):
    tenant_id = user.tenant_id if hasattr(user, "tenant_id") else "default-tenant"
    # Consultas agregadas (ex.: mega-stats, summary de hoje/amanhã)
    mega_stats = compute_mega_stats(db, tenant_id=tenant_id, tz=tz)
    summary = compute_summary(db, tenant_id=tenant_id, tz=tz)
    # Retorno consolidado
    return {
        "user": UserResponse.model_validate(user),
        "tenantId": tenant_id,
        "megaStats": mega_stats,
        "summary": summary,
    }
```

Observações:
- Proteja o endpoint com `get_current_user` (cookies httpOnly).  
- Respeite filtros por `tenantId` e timezone.

### 2) Frontend (React + TypeScript)

Arquivos envolvidos (referência):
- `src/services/api.ts` (cliente HTTP)
- `src/services/auth.ts` (serviços de login/logout/me)
- `src/contexts/AuthContext.tsx` (estado de autenticação)
- Hooks: `useDashboardMegaStats.ts`, `useDashboardSummary.ts`, `useMonthAppointments.ts`, `useAppointmentMutations.ts`

Passos recomendados:

2.1 Configurar envio de cookies em TODAS as requisições
- Fetch: `credentials: 'include'`.
- Axios: `withCredentials: true` no cliente (ver `RUNBOOK.md`).

2.2 Pós-login: validar sessão e iniciar bootstrap

```typescript
// Fluxo conceitual (exemplo)
const login = async (credentials) => {
  await api.post('/api/auth/login', credentials); // cookies definidos
  const user = await api.get('/api/auth/me');     // valida sessão
  setUser(user);

  const tenantId = user.tenantId ?? restoreTenantFromStorage();
  setTenantId(tenantId);

  // Prefetch de dados críticos do dashboard/calendário
  await Promise.all([
    queryClient.prefetchQuery(['dashboardMegaStats', tenantId, tz], () =>
      api.get('/api/v1/appointments/mega-stats', { params: { tenantId, tz } })
    ),
    queryClient.prefetchQuery(['dashboardSummary', tenantId, range], () =>
      api.get('/api/v1/appointments/summary', { params: { tenantId, ...range, tz } })
    ),
  ]);
};
```

2.3 Re-hidratação ao iniciar a aplicação

```typescript
// Em AuthContext.tsx (efeito de montagem)
useEffect(() => {
  (async () => {
    try {
      const user = await api.get('/api/auth/me'); // cookies enviados
      setUser(user);
      const tenantId = user.tenantId ?? restoreTenantFromStorage();
      setTenantId(tenantId);
      // Prefetch básico (evita “tela vazia”)
      queryClient.prefetchQuery(['dashboardMegaStats', tenantId, tz], ...);
    } catch {
      setUser(null);
    }
  })();
}, []);
```

2.4 Garantir URLs corretas e parâmetros obrigatórios
- Sempre usar o prefixo `/api` (ver “Troubleshooting” em `API.md`/`RUNBOOK.md`).
- Garantir `tenantId` nos hooks de agenda/estatísticas.  
- Definir `headers: { 'Cache-Control': 'no-cache' }` onde apropriado (stats).

2.5 Persistir/Restaurar `tenantId` (opcional)
- Persistir `tenantId` em `localStorage` ao selecioná-lo/obtê-lo.
- Restaurar no bootstrap; se indisponível, usar um default seguro.

2.6 Logout limpo
- Limpar caches e estados locais. Cookies httpOnly são limpos pelo backend (ver `API.md` › `/api/auth/logout`).

---

## 🧪 Plano de Teste Manual

1. Limpar estado local (storage) e iniciar backend/frontend (ver `RUNBOOK.md`).
2. Login válido → esperar redirecionamento/tela inicial.
3. Verificar chamadas de rede:
   - `POST /api/auth/login` → 200, cookies definidos.
   - `GET /api/auth/me` → 200, dados do usuário.
   - `GET /api/v1/appointments/mega-stats`/`summary` → 200 com `tenantId` e `tz`.
4. Recarregar a página → confirmar que `me` é chamado e dados iniciais são re-hidratados sem interação do usuário.
5. Sair (logout) → confirmar que caches foram limpos e próxima tela exige login.

---

## ⚠️ Armadilhas Comuns

- Esquecer `credentials: 'include'`/`withCredentials: true` → 401 silencioso.
- Chamar `/v1/...` sem o prefixo `/api` → 404 e listas vazias (ver `API.md`).
- Não enviar `tenantId` nas queries de agenda/estatística.
- Não invalidar/prefetchar queries pós-login.

---

## 📝 Resumo Executivo

- Problema: Após login, a UI não sincroniza/re-hidrata dados do usuário, aparentando “zerar” o sistema.
- Causa: Falta de bootstrap pós-login, ausência de verificação de sessão ao iniciar e não envio de cookies/`tenantId` nas queries.
- Solução: Garantir envio de cookies, executar `me` e bootstrap de dados (via endpoints existentes ou novo endpoint `/api/bootstrap`), e implementar re-hidratação do estado global (Contexts + React Query) imediatamente após login e em recargas de página.

---

## 📚 Referências

- `API.md` — Endpoints de autenticação e agendamentos (inclusive “Troubleshooting de URLs”).
- `ARCHITECTURE.md` — Fluxo de autenticação, camadas e hooks principais.
- `RUNBOOK.md` — CORS, cookies e comandos de execução.
- `SECURITY.md` — Configuração de cookies httpOnly e proteção.
- `CHANGELOG.md` — Evolução de endpoints/hook de agenda.
- `CONTRIBUTING.md` — Boas práticas (fluxo de PR) para implementar a mudança.


