# Arquitetura do Sistema

## Visão Geral

O AlignWork segue uma arquitetura **cliente-servidor** moderna, separando completamente o frontend (React) do backend (FastAPI). A comunicação entre as camadas é feita exclusivamente via API RESTful com autenticação JWT.

---

## Diagrama de Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Application                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │    │
│  │  │  Pages   │  │Components│  │  Contexts     │   │    │
│  │  │ (Routes) │  │  (UI)    │  │ (State Mgmt)  │   │    │
│  │  └────┬─────┘  └────┬─────┘  └───────┬───────┘   │    │
│  │       │             │                 │            │    │
│  │       └─────────────┴─────────────────┘            │    │
│  │                     │                               │    │
│  │              ┌──────┴──────┐                        │    │
│  │              │   Services  │                        │    │
│  │              │ (API Calls) │                        │    │
│  │              └──────┬──────┘                        │    │
│  └─────────────────────┼───────────────────────────────┘    │
│                        │                                     │
│                        │ HTTP/JSON                           │
│                        │ (JWT in httpOnly cookies)           │
└────────────────────────┼─────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                        │            SERVIDOR                  │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │              FastAPI Application                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Routes  │  │ Auth     │  │   Dependencies   │  │    │
│  │  │  (API)   │  │ (JWT)    │  │   (Middleware)   │  │    │
│  │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │    │
│  │       │             │                  │             │    │
│  │       └─────────────┴──────────────────┘             │    │
│  │                     │                                │    │
│  │              ┌──────┴──────┐                         │    │
│  │              │   Schemas   │                         │    │
│  │              │ (Validation)│                         │    │
│  │              └──────┬──────┘                         │    │
│  │                     │                                │    │
│  │              ┌──────┴──────┐                         │    │
│  │              │   Models    │                         │    │
│  │              │ (SQLAlchemy)│                         │    │
│  │              └──────┬──────┘                         │    │
│  └─────────────────────┼───────────────────────────────┘    │
│                        │                                     │
│                        │ SQL                                 │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │                SQLite Database                       │    │
│  │  ┌──────────────┐           ┌──────────────────┐    │    │
│  │  │ users table  │           │ appointments     │    │    │
│  │  └──────────────┘           │     table        │    │    │
│  │                             └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Camadas da Aplicação

### 1. Frontend (React)

#### 1.1. Camada de Apresentação (Pages)
- **Responsabilidade:** Renderização das telas principais
- **Componentes:** Dashboard, Login, Register, Profile, Settings
- **Tecnologias:** React Router DOM para navegação

#### 1.2. Camada de Componentes (Components)
- **Responsabilidade:** Componentes reutilizáveis de UI
- **Estrutura:**
  - `ui/`: Componentes base (shadcn/ui)
  - `auth/`: Componentes de autenticação
  - `Calendar/`: Componentes de calendário
  - `Dashboard/`: Componentes do dashboard
  - `Modals/`: Modais da aplicação
- **Tecnologias:** Radix UI, Tailwind CSS

#### 1.3. Camada de Estado (Contexts + Hooks)
- **Responsabilidade:** Gerenciamento de estado global e lógica de negócio
- **Contextos:**
  - `AuthContext`: Estado de autenticação
  - `AppContext`: Estado da aplicação (clientes, agendamentos)
- **Hooks:**
  - React Query hooks para data fetching
  - Custom hooks para lógica compartilhada
- **Tecnologias:** React Context API, React Query

#### 1.4. Camada de Serviços (Services)
- **Responsabilidade:** Comunicação com a API
- **Serviços:**
  - `api.ts`: Cliente HTTP base
  - `auth.ts`: Operações de autenticação
- **Tecnologias:** fetch API nativo, Axios (futuro)

---

### 2. Backend (FastAPI)

#### 2.1. Camada de Apresentação (Routes)
- **Responsabilidade:** Definição de endpoints e roteamento
- **Routers:**
  - `auth.py`: Autenticação (register, login, logout, me)
  - `appointments.py`: Agendamentos (CRUD, summary, stats)
- **Padrão:** RESTful API

#### 2.2. Camada de Validação (Schemas)
- **Responsabilidade:** Validação de entrada/saída
- **Schemas:**
  - `auth.py`: UserRegister, UserLogin, Token
  - `user.py`: UserCreate, UserResponse
  - `appointment.py`: AppointmentCreate, AppointmentUpdate
- **Tecnologias:** Pydantic para validação declarativa

#### 2.3. Camada de Negócio (Auth + Dependencies)
- **Responsabilidade:** Lógica de negócio e autenticação
- **Módulos:**
  - `auth/utils.py`: JWT, hash de senhas
  - `auth/dependencies.py`: Injeção de dependências
- **Tecnologias:** python-jose, bcrypt

#### 2.4. Camada de Dados (Models)
- **Responsabilidade:** Definição de modelos de dados
- **Models:**
  - `User`: Usuários do sistema
  - `Appointment`: Agendamentos
- **Tecnologias:** SQLAlchemy ORM

#### 2.5. Camada de Persistência (Database)
- **Responsabilidade:** Armazenamento de dados
- **Banco:** SQLite (desenvolvimento), PostgreSQL (produção futura)
- **Tecnologias:** SQLAlchemy, SQLite

---

## Fluxo de Dados

### Request Flow (Cliente → Servidor)

```
1. User Action (UI)
   ↓
2. Event Handler (Component)
   ↓
3. Context/Hook (State Management)
   ↓
4. Service Method (API Call)
   ↓
5. HTTP Request
   → Cookies (JWT)
   → Headers (Content-Type)
   → Body (JSON)
   ↓
6. FastAPI Middleware
   → CORS
   → Cookie parsing
   ↓
7. Route Handler
   → Dependency injection
   → get_current_user (se protegido)
   ↓
8. Schema Validation (Pydantic)
   ↓
9. Business Logic
   → Auth checks
   → Data processing
   ↓
10. Database Query (SQLAlchemy)
    ↓
11. Database (SQLite)
```

### Response Flow (Servidor → Cliente)

```
1. Database Result
   ↓
2. Model to Schema (Pydantic)
   ↓
3. JSON Serialization
   ↓
4. HTTP Response
   → Status Code
   → Headers (Cache-Control, Set-Cookie)
   → Body (JSON)
   ↓
5. Service Method Return
   ↓
6. Context/Hook Update
   → React Query cache update
   → Context state update
   ↓
7. Component Re-render
   ↓
8. UI Update
```

---

## Padrões Arquiteturais

### 1. Separation of Concerns

Cada camada tem uma responsabilidade bem definida:
- **Frontend:** Apresentação e UX
- **Backend:** Lógica de negócio e persistência
- **Database:** Armazenamento de dados

### 2. Dependency Injection

**Backend (FastAPI):**
```python
def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    ...

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user
```

**Frontend (React):**
```typescript
// Context Provider injeta dependências
<AuthProvider>
  <AppProvider>
    <App />
  </AppProvider>
</AuthProvider>

// Componentes consomem via hooks
const { user } = useAuth();
```

### 3. Repository Pattern (Implícito)

SQLAlchemy ORM atua como repository:
```python
# Abstração do acesso ao banco
user = db.query(User).filter(User.email == email).first()
```

### 4. Service Layer

**Frontend:**
```typescript
// services/auth.ts
export const auth = {
  async login(credentials) { ... },
  async logout() { ... }
};
```

**Backend:**
```python
# auth/utils.py
def create_access_token(data: dict) -> str:
    ...
```

### 5. DTO (Data Transfer Objects)

**Pydantic Schemas como DTOs:**
```python
class UserRegister(BaseModel):  # Input DTO
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):  # Output DTO
    id: int
    email: str
    username: str
```

### 6. Context API for State Management

```typescript
// Global state sem prop drilling
const AuthContext = createContext<AuthContextType>();

export const useAuth = () => useContext(AuthContext);
```

---

## Decisões Arquiteturais

### 1. JWT em httpOnly Cookies

**Por quê?**
- ✅ Segurança contra XSS
- ✅ Automático (browser gerencia)
- ❌ Mais complexo para mobile apps

**Alternativas consideradas:**
- LocalStorage: Vulnerável a XSS
- SessionStorage: Perde estado ao fechar aba
- Authorization Header: Requer gerenciamento manual

### 2. React Query para Estado Assíncrono

**Por quê?**
- ✅ Cache automático
- ✅ Background refetching
- ✅ Deduplicação de requests
- ✅ Menos código boilerplate

**Alternativas consideradas:**
- Redux: Muito boilerplate
- Zustand: Não tem cache inteligente
- SWR: Similar, mas React Query tem mais features

### 3. SQLite para Desenvolvimento

**Por quê?**
- ✅ Zero configuração
- ✅ Fácil debug
- ✅ Arquivo único
- ❌ Não escalável para produção

**Plano:** Migrar para PostgreSQL em produção

### 4. FastAPI ao invés de Django/Flask

**Por quê?**
- ✅ Async nativo
- ✅ Type hints (Pydantic)
- ✅ Documentação automática
- ✅ Performance superior
- ✅ Moderna e com boa developer experience

### 5. Vite ao invés de Create React App

**Por quê?**
- ✅ Build 10x mais rápido
- ✅ HMR instantâneo
- ✅ ES modules nativos
- ✅ Configuração simples

---

## Segurança

### Camadas de Segurança

```
┌─────────────────────────────────────────┐
│        1. CORS (Backend)                │
│   Whitelist de origins permitidas       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    2. HttpOnly Cookies                  │
│   Tokens não acessíveis via JS          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    3. JWT Token Validation              │
│   Verifica assinatura e expiração       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    4. User Active Check                 │
│   Valida se usuário está ativo          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    5. bcrypt Password Hashing           │
│   Senhas nunca em texto plano           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    6. Pydantic Validation               │
│   Valida todos os inputs                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    7. SQLAlchemy ORM                    │
│   Previne SQL injection                 │
└─────────────────────────────────────────┘
```

---

## Escalabilidade

### Atual (MVP)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │────▶│ FastAPI  │────▶│  SQLite  │
│  (SPA)   │     │ (Uvicorn)│     │  (File)  │
└──────────┘     └──────────┘     └──────────┘
```

**Limitações:**
- 1 instância backend
- 1 arquivo SQLite
- Sem cache
- Sem load balancing

### Futuro (Produção)

```
                    ┌──────────────┐
                    │     CDN      │
                    │   (React)    │
                    └──────────────┘
                           │
┌─────────────────────────┴─────────────────────┐
│                                                │
│              Load Balancer                     │
│                                                │
└─────────┬──────────────────────┬───────────────┘
          │                      │
┌─────────┴────────┐   ┌─────────┴────────┐
│   FastAPI        │   │   FastAPI        │
│   Instance 1     │   │   Instance 2     │
└─────────┬────────┘   └─────────┬────────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌──────────┴───────────┐
          │                      │
   ┌──────┴──────┐      ┌───────┴────────┐
   │  PostgreSQL │      │   Redis        │
   │  (Primary)  │      │   (Cache)      │
   └─────────────┘      └────────────────┘
```

**Melhorias:**
- CDN para static files
- Load balancer (Nginx/Traefik)
- Múltiplas instâncias FastAPI
- PostgreSQL para produção
- Redis para cache e sessions
- Docker para deployment
- Kubernetes para orquestração (opcional)

---

## Performance

### Frontend

**Otimizações Implementadas:**
- ✅ Code splitting (React.lazy)
- ✅ React Query cache
- ✅ Memoization (useMemo, useCallback)
- ✅ Tailwind CSS purge
- ✅ Vite tree-shaking

**Futuras:**
- [ ] Service Worker (PWA)
- [ ] Image optimization
- [ ] Virtual scrolling para listas longas
- [ ] Prefetching de rotas

### Backend

**Otimizações Implementadas:**
- ✅ Indexação de DB (email, username, tenant_id)
- ✅ Async/await nativo
- ✅ Pydantic validação rápida

**Futuras:**
- [ ] Query optimization (eager loading)
- [ ] Redis caching
- [ ] Database connection pooling
- [ ] API response caching
- [ ] GraphQL para queries complexas (opcional)

---

## Monitoramento e Observabilidade

### Atual

**Logs:**
- Console logs (backend)
- Browser DevTools (frontend)

### Futuro

**Backend:**
- Structured logging (loguru)
- APM (Application Performance Monitoring)
- Error tracking (Sentry)
- Metrics (Prometheus)

**Frontend:**
- Error tracking (Sentry)
- Analytics (Plausible/Google Analytics)
- Performance monitoring (Lighthouse CI)

**Infrastructure:**
- Uptime monitoring (UptimeRobot)
- Log aggregation (ELK Stack)
- Distributed tracing (Jaeger)

---

## Deployment

### Desenvolvimento

```
# Frontend
npm run dev → http://localhost:8080

# Backend
uvicorn main:app --reload → http://localhost:8000

# Database
SQLite file: ./alignwork.db
```

### Produção (Recomendado)

```
┌─────────────────────────────────────────┐
│           Vercel/Netlify                │
│         (Frontend - React)              │
│  - CDN global                           │
│  - Auto SSL                             │
│  - Preview deployments                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Railway/Render/Fly.io           │
│        (Backend - FastAPI)              │
│  - Docker container                     │
│  - Auto scaling                         │
│  - Managed PostgreSQL                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Supabase/Neon                   │
│         (Database - PostgreSQL)         │
│  - Managed database                     │
│  - Automatic backups                    │
│  - Connection pooling                   │
└─────────────────────────────────────────┘
```

---

## Testes

### Pirâmide de Testes (Planejado)

```
         ┌────────────┐
         │    E2E     │  ← Playwright/Cypress (10%)
         │  (poucos)  │
         └────────────┘
       ┌────────────────┐
       │  Integration   │  ← pytest + TestClient (30%)
       │    (médio)     │
       └────────────────┘
     ┌──────────────────────┐
     │       Unit           │  ← pytest + Vitest (60%)
     │      (muitos)        │
     └──────────────────────┘
```

**Backend (pytest):**
- Unit: Funções isoladas (auth/utils.py)
- Integration: Endpoints completos (routes/)
- Database: Fixtures para testes com DB

**Frontend (Vitest + RTL):**
- Unit: Hooks, utils
- Component: Componentes isolados
- Integration: Fluxos completos

**E2E (Playwright):**
- User flows críticos (login → dashboard → criar agendamento)

---

## Documentação

### Gerada Automaticamente

1. **FastAPI Swagger UI:** `/docs`
2. **FastAPI ReDoc:** `/redoc`
3. **OpenAPI Schema:** `/openapi.json`

### Escrita Manualmente

1. **README.md:** Visão geral do projeto
2. **docs/**: Documentação técnica detalhada

---

**Última atualização:** Outubro 2025

