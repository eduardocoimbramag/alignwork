# 🏗️ AlignWork - Arquitetura do Sistema

> **Fonte:** Consolidado de `_archive/arquitetura.md`, `_archive/autenticacao.md`, `_archive/backend.md`, `_archive/frontend.md`  
> **Última atualização:** Outubro 2025

---

## 🎯 Quando usar este documento

Use este documento para:
- Entender a arquitetura geral do sistema AlignWork
- Tomar decisões técnicas sobre tecnologias e padrões
- Onboarding de novos desenvolvedores
- Planejar escalabilidade e refactor

---

## 📋 Índice

- [Visão Geral](#visao-geral)
- [Stack Tecnológica](#stack-tecnologica)
- [Arquitetura de Alto Nível](#arquitetura-de-alto-nivel)
- [Backend (FastAPI)](#backend-fastapi)
- [Frontend (React + TypeScript)](#frontend-react-typescript)
- [Autenticação e Segurança](#autenticacao-e-seguranca)
- [Banco de Dados](#banco-de-dados)
- [Fluxo de Dados](#fluxo-de-dados)
- [Padrões Arquiteturais](#padroes-arquiteturais)
- [Decisões Arquiteturais](#decisoes-arquiteturais)
- [Componentes Principais](#componentes-principais)
- [Performance e Escalabilidade](#performance-e-escalabilidade)

---

## Visão Geral

O AlignWork é uma aplicação SaaS para gestão de consultórios e clínicas, seguindo uma arquitetura **cliente-servidor** moderna com separação completa entre frontend e backend.

**Características principais:**
- API RESTful com FastAPI (Python)
- SPA com React 18 + TypeScript
- Autenticação JWT com httpOnly cookies
- Banco SQLite (dev) / PostgreSQL (prod futuro)
- Real-time updates com React Query
- Multi-tenancy preparado

---

## Stack Tecnológica

### Backend
```
FastAPI 0.115+          → Framework web async
Python 3.11+            → Linguagem
SQLAlchemy 2.0+         → ORM
Pydantic 2.0+           → Validação
python-jose             → JWT
bcrypt                  → Hash de senhas
uvicorn                 → ASGI server
SQLite                  → Banco (dev)
```

### Frontend
```
React 18.3.1            → UI Library
TypeScript 5.8.3        → Type safety
Vite 5.4.19             → Build tool
React Query 5.83.0      → Estado assíncrono
React Router DOM 6.30.1 → Roteamento
Tailwind CSS 3.4.17     → Styling
shadcn/ui               → Componentes (Radix UI)
dayjs 1.11.18           → Datas e timezone
React Hook Form 7.61.1  → Formulários
Zod 3.25.76             → Validação
```

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Application (SPA)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐│   │
│  │  │  Pages   │  │Components│  │    Contexts    ││   │
│  │  │(Routes)  │  │   (UI)   │  │(State + Auth)  ││   │
│  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘│   │
│  │       │             │                 │          │   │
│  │       └─────────────┴─────────────────┘          │   │
│  │                     │                             │   │
│  │              ┌──────┴──────┐                      │   │
│  │              │   Services  │                      │   │
│  │              │ (API Calls) │                      │   │
│  │              └──────┬──────┘                      │   │
│  └─────────────────────┼─────────────────────────────┘   │
│                        │                                  │
│                        │ HTTP/JSON                        │
│                        │ JWT in httpOnly cookies          │
└────────────────────────┼──────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────┐
│                        │          SERVIDOR                 │
│  ┌─────────────────────┴─────────────────────────────┐   │
│  │           FastAPI Application                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐│   │
│  │  │  Routes  │  │   Auth   │  │  Dependencies   ││   │
│  │  │  (API)   │  │  (JWT)   │  │  (Middleware)   ││   │
│  │  └────┬─────┘  └────┬─────┘  └────────┬────────┘│   │
│  │       │             │                  │          │   │
│  │       └─────────────┴──────────────────┘          │   │
│  │                     │                              │   │
│  │              ┌──────┴──────┐                       │   │
│  │              │   Schemas   │                       │   │
│  │              │(Validation) │                       │   │
│  │              └──────┬──────┘                       │   │
│  │                     │                              │   │
│  │              ┌──────┴──────┐                       │   │
│  │              │   Models    │                       │   │
│  │              │(SQLAlchemy) │                       │   │
│  │              └──────┬──────┘                       │   │
│  └─────────────────────┼───────────────────────────────┘   │
│                        │                                    │
│                        │ SQL                                │
│  ┌─────────────────────┴───────────────────────────────┐   │
│  │              SQLite Database                         │   │
│  │  ┌──────────────┐           ┌──────────────────┐   │   │
│  │  │ users table  │           │ appointments     │   │   │
│  │  └──────────────┘           │     table        │   │   │
│  │                             └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend (FastAPI)

> **Fonte:** `_archive/backend.md`

### Estrutura de Diretórios

```
backend/
├── auth/
│   ├── dependencies.py     # get_current_user, get_db
│   └── utils.py           # JWT, bcrypt, tokens
├── models/
│   ├── user.py           # Model User
│   └── appointment.py    # Model Appointment
├── schemas/
│   ├── auth.py          # UserRegister, UserLogin, Token
│   ├── user.py         # UserBase, UserCreate, UserResponse
│   └── appointment.py  # AppointmentCreate, AppointmentUpdate
├── routes/
│   ├── auth.py        # /api/auth/*
│   └── appointments.py # /api/v1/appointments/*
└── main.py           # App principal
```

### Modelos de Dados

#### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**Características:**
- Email e username únicos e indexados
- Senha sempre em hash (bcrypt)
- Timestamps automáticos
- Flags de controle (ativo, verificado)

#### Appointment Model
```python
class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)  # Multi-tenancy
    patient_id = Column(String, nullable=False)
    starts_at = Column(DateTime, nullable=False)  # UTC
    duration_min = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Características:**
- `tenant_id` para multi-tenancy
- `starts_at` sempre em UTC
- Status: pending, confirmed, cancelled
- Indexado por tenant_id

### Schemas de Validação (Pydantic)

```python
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Must contain number')
        return v
```

### Rotas Principais

#### Auth Routes (`/api/auth/*`)
- `POST /register` - Criar usuário
- `POST /login` - Autenticar
- `POST /refresh` - Renovar tokens
- `POST /logout` - Limpar cookies
- `GET /me` - Dados do usuário

#### Appointment Routes (`/api/v1/appointments/*`)
- `GET /summary` - Resumo hoje/amanhã
- `GET /mega-stats` - Stats agregadas
- `GET /` - Lista com filtros
- `POST /` - Criar agendamento
- `PATCH /{id}` - Atualizar status

---

## Frontend (React + TypeScript)

> **Fonte:** `_archive/frontend.md`

### Estrutura de Diretórios

```
src/
├── components/
│   ├── auth/               # Login, Register, ProtectedRoute
│   ├── Calendar/           # InteractiveCalendar, CalendarModal
│   ├── Dashboard/          # StatsCard, RecentAppointments
│   ├── Layout/            # Header, MobileNav
│   ├── Modals/            # Vários modais do sistema
│   └── ui/                # shadcn/ui (50+ componentes)
├── contexts/
│   ├── AuthContext.tsx   # Estado de autenticação
│   └── AppContext.tsx    # Estado da aplicação
├── hooks/
│   ├── useAuth.ts
│   ├── useAppointmentMutations.ts
│   ├── useDashboardSummary.ts
│   ├── useDashboardMegaStats.ts
│   ├── useMonthAppointments.ts
│   └── useInvalidateAgenda.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   └── Settings.tsx
├── services/
│   ├── api.ts         # Cliente HTTP
│   └── auth.ts        # Serviço de auth
├── types/
│   ├── auth.ts
│   ├── appointment.ts
│   └── consulta.ts
└── lib/
    ├── utils.ts
    ├── calendar.ts
    └── dayjs.ts
```

### Hierarquia de Providers

```typescript
QueryClientProvider    // React Query
  └─ AuthProvider      // Autenticação
      └─ AppProvider   // Estado da app
          └─ TooltipProvider
              └─ Toaster + Sonner
                  └─ BrowserRouter
                      └─ Routes
```

### Custom Hooks Principais

#### useAppointmentMutations
```typescript
export function useCreateAppointment(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId)
    return useMutation({
        mutationFn: async (payload: Omit<CreateInput, 'tenantId'>) => {
            const startsAtUTC = dayjs
                .tz(payload.startsAtLocal, 'America/Recife')
                .utc()
                .toISOString();
            
            const body = { ...payload, tenantId, startsAt: startsAtUTC };
            const { data } = await api.post('/api/v1/appointments', body);
            return data;
        },
        onSuccess: (created) => invalidate(created?.startsAt)
    });
}
```

#### useDashboardMegaStats
```typescript
export function useDashboardMegaStats(tenantId: string, tz = 'America/Recife') {
    return useQuery({
        queryKey: ['dashboardMegaStats', tenantId, tz],
        queryFn: async () => {
            const { data } = await api.get<MegaStats>(
                '/api/v1/appointments/mega-stats',
                {
                    params: { tenantId, tz },
                    headers: { 'Cache-Control': 'no-cache' }
                }
            );
            return data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true
    });
}
```

---

## Autenticação e Segurança

> **Fonte:** `_archive/autenticacao.md`

### Fluxo de Autenticação

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Cliente   │          │   FastAPI   │          │   Database  │
│  (React)    │          │   Backend   │          │  (SQLite)   │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  1. POST /auth/login   │                        │
       ├───────────────────────>│                        │
       │  { email, password }   │                        │
       │                        │  2. Query User         │
       │                        ├───────────────────────>│
       │                        │  3. User Data          │
       │                        │<───────────────────────┤
       │                        │  4. Verify Password    │
       │                        │     (bcrypt)           │
       │                        │  5. Generate Tokens    │
       │                        │     - Access (15min)   │
       │                        │     - Refresh (7days)  │
       │  6. Set HttpOnly       │                        │
       │     Cookies + JSON     │                        │
       │<───────────────────────┤                        │
       │                        │                        │
```

### JWT Tokens

#### Access Token (15 minutos)
```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "type": "access",
  "exp": 1696512000
}
```

#### Refresh Token (7 dias)
```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "type": "refresh",
  "exp": 1697116800
}
```

### HttpOnly Cookies

**Configuração Backend:**
```python
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,        # Não acessível via JS
    secure=True,          # Apenas HTTPS (produção)
    samesite="lax",       # Proteção CSRF
    max_age=900           # 15 minutos
)
```

**Configuração Frontend:**
```typescript
const response = await fetch(url, {
  credentials: 'include',  // Envia cookies automaticamente
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Proteção de Rotas

```typescript
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

## Banco de Dados

### Configuração SQLite (Desenvolvimento)

```python
DATABASE_URL = "sqlite:///../alignwork.db"
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)
```

### Esquema de Tabelas

```sql
-- users
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- appointments
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    patient_id VARCHAR NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    duration_min INTEGER NOT NULL,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
```

### Migração para PostgreSQL (Futuro)

```python
# Produção
DATABASE_URL = "postgresql://user:pass@host:5432/alignwork"
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)
```

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

Cada camada tem responsabilidade bem definida:
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
user = db.query(User).filter(User.email == email).first()
```

### 4. Service Layer

**Frontend:**
```typescript
export const auth = {
  async login(credentials) { ... },
  async logout() { ... }
};
```

**Backend:**
```python
def create_access_token(data: dict) -> str:
    ...
```

### 5. DTO (Data Transfer Objects)

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

---

## Decisões Arquiteturais

### JWT em httpOnly Cookies

**Por quê?**
- ✅ Segurança contra XSS
- ✅ Automático (browser gerencia)
- ❌ Mais complexo para mobile apps

**Alternativas consideradas:**
- LocalStorage: Vulnerável a XSS
- SessionStorage: Perde estado ao fechar aba
- Authorization Header: Requer gerenciamento manual

### React Query para Estado Assíncrono

**Por quê?**
- ✅ Cache automático
- ✅ Background refetching
- ✅ Deduplicação de requests
- ✅ Menos código boilerplate

**Alternativas:**
- Redux: Muito boilerplate
- Zustand: Não tem cache inteligente
- SWR: Similar, mas React Query tem mais features

### SQLite para Desenvolvimento

**Por quê?**
- ✅ Zero configuração
- ✅ Fácil debug
- ✅ Arquivo único
- ❌ Não escalável para produção

**Plano:** Migrar para PostgreSQL

### FastAPI ao invés de Django/Flask

**Por quê?**
- ✅ Async nativo
- ✅ Type hints (Pydantic)
- ✅ Documentação automática
- ✅ Performance superior
- ✅ Moderna e com boa DX

### Vite ao invés de CRA

**Por quê?**
- ✅ Build 10x mais rápido
- ✅ HMR instantâneo
- ✅ ES modules nativos
- ✅ Configuração simples

---

## Componentes Principais

### DashboardCalendarStats

> **Atualização:** Outubro 2025

**Componente que exibe estatísticas de agendamentos**

```typescript
function DashboardCalendarStats({ tenantId }: { tenantId: string }) {
    const { data, isLoading, error } = useDashboardMegaStats(tenantId)
    
    const periods = [
        {
            label: 'Hoje',
            confirmed: data.today.confirmed,
            pending: data.today.pending,
            color: 'bg-brand-green',
            gradient: 'from-brand-purple/10 to-brand-pink/10'
        },
        // ... outros períodos
    ]
    
    return (
        <div className="space-y-1.5 mt-2">
            {periods.map((period) => (
                <div className={`py-2 px-3 rounded-lg bg-gradient-to-r ${period.gradient}`}>
                    {/* Conteúdo */}
                </div>
            ))}
        </div>
    )
}
```

**Mudanças recentes:**
- Padronização de gradiente (roxo-rosa para todos)
- Espaçamento compactado (py-2 px-3)
- Labels atualizados: "Mês vigente", "Mês subsequente"
- Bolinhas: verde apenas para "Hoje", roxo para demais

### InteractiveCalendar e CalendarModal

**Componentes do calendário interativo**

**Mudanças recentes:**
- Remoção de `DashboardCalendarCard` (duplicação eliminada)
- Alinhamento à esquerda aplicado
- Espaçamento compactado no header (pb-2)
- Título do mês reduzido (text-lg)

---

## Performance e Escalabilidade

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
- [ ] Virtual scrolling
- [ ] Prefetching de rotas

### Backend

**Otimizações Implementadas:**
- ✅ Indexação de DB (email, username, tenant_id)
- ✅ Async/await nativo
- ✅ Pydantic validação rápida

**Futuras:**
- [ ] Query optimization (eager loading)
- [ ] Redis caching
- [ ] Connection pooling
- [ ] API response caching

### Escalabilidade Futura

```
┌──────────────┐
│     CDN      │
│   (React)    │
└──────┬───────┘
       │
┌──────┴──────┐
│Load Balancer│
└──┬────────┬─┘
   │        │
┌──┴────┐ ┌┴──────┐
│FastAPI│ │FastAPI│
│  #1   │ │  #2   │
└───┬───┘ └───┬───┘
    └─────┬───┘
    ┌─────┴──────┐
┌───┴────┐ ┌────┴─────┐
│Postgre │ │  Redis   │
│SQL     │ │  (Cache) │
└────────┘ └──────────┘
```

---

## Monitoramento e Observabilidade

### Atual
- Console logs (backend)
- Browser DevTools (frontend)

### Futuro
- Structured logging (loguru)
- Error tracking (Sentry)
- Metrics (Prometheus)
- APM
- Uptime monitoring

---

**Próximas seções:** Ver [SECURITY.md](./SECURITY.md) para detalhes de segurança e [API.md](./API.md) para referência completa de endpoints.

