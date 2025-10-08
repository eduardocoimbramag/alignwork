# Frontend - React + TypeScript

## Visão Geral

O frontend do AlignWork é uma aplicação React moderna, construída com TypeScript, Vite e uma stack de ferramentas modernas. A interface é responsiva, performática e oferece uma experiência de usuário excepcional.

---

## Stack Tecnológica

### Core
- **React 18.3.1**: UI library com Concurrent Mode
- **TypeScript 5.8.3**: Type safety e IntelliSense
- **Vite 5.4.19**: Build tool ultra-rápido com HMR

### Gerenciamento de Estado
- **React Query 5.83.0** (@tanstack/react-query): Estado assíncrono
- **Context API**: Estado global (Auth, App)
- **Local State**: useState para UI local

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS
- **shadcn/ui**: Componentes Radix UI + Tailwind
- **Lucide React**: Ícones modernos
- **CVA**: Class Variance Authority para variantes

### Formulários & Validação
- **React Hook Form 7.61.1**: Gerenciamento de formulários
- **Zod 3.25.76**: Schema validation

### Utilitários
- **Axios 1.12.2**: HTTP client
- **dayjs 1.11.18**: Manipulação de datas
- **date-fns 3.6.0**: Utilitários de data
- **React Router DOM 6.30.1**: Roteamento

---

## Estrutura do Frontend

```
src/
├── components/              # Componentes React
│   ├── auth/               # Autenticação
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── Calendar/           # Calendário
│   │   ├── InteractiveCalendar.tsx
│   │   └── CalendarModal.tsx
│   ├── Dashboard/          # Dashboard
│   │   ├── StatsCard.tsx
│   │   └── RecentAppointments.tsx
│   ├── Layout/            # Layout
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── Modals/            # Modais
│   │   ├── NovoAgendamentoModal.tsx
│   │   ├── CadastroClienteModal.tsx
│   │   ├── DesmarcarAgendamentoModal.tsx
│   │   ├── HistoricoPacientesModal.tsx
│   │   ├── TelaConsultaModal.tsx
│   │   └── CalendarioAgendamentoModal.tsx
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ... (50+ componentes)
├── contexts/              # React Contexts
│   ├── AuthContext.tsx   # Contexto de autenticação
│   └── AppContext.tsx    # Contexto da aplicação
├── hooks/                # Custom hooks
│   ├── useAuth.ts
│   ├── useAppointmentMutations.ts
│   ├── useDashboardSummary.ts
│   ├── useDashboardMegaStats.ts
│   ├── useMonthAppointments.ts
│   └── useInvalidateAgenda.ts
├── pages/               # Páginas
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── services/           # Serviços de API
│   ├── api.ts         # Cliente HTTP base
│   └── auth.ts        # Serviço de autenticação
├── types/             # Definições TypeScript
│   ├── auth.ts
│   ├── appointment.ts
│   └── consulta.ts
├── lib/              # Utilitários
│   ├── utils.ts
│   ├── calendar.ts
│   └── dayjs.ts
├── App.tsx           # Componente raiz
├── main.tsx         # Entry point
└── index.css        # Estilos globais
```

---

## Configuração e Setup

### vite.config.ts

```typescript
export default defineConfig({
  server: {
    port: 8080,        // Porta do dev server
    host: true,        // Expõe na rede local
  },
  plugins: [react()],  // Plugin React com SWC
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // Alias para imports
    },
  },
});
```

**Características:**
- Porta 8080 (evita conflito com backend 8000)
- SWC para transpilação ultra-rápida
- Alias `@` para imports limpos

### tailwind.config.ts

```typescript
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "hsl(var(--brand-purple))",
          pink: "hsl(var(--brand-pink))",
          lime: "hsl(var(--brand-lime))",
          green: "hsl(var(--brand-green))",
        },
        // ... outros temas shadcn/ui
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Cores da Marca:**
- `brand-purple`: Roxo principal
- `brand-pink`: Rosa de destaque
- `brand-lime`: Verde limão
- `brand-green`: Verde confirmação

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]  // Alias @
    }
  }
}
```

---

## Roteamento (App.tsx)

### Configuração de Rotas

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rotas Protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/perfil" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

### Hierarquia de Providers

```
QueryClientProvider (React Query)
  └─ AuthProvider (Autenticação)
      └─ AppProvider (Estado da aplicação)
          └─ TooltipProvider (shadcn/ui)
              └─ Toaster + Sonner (Notificações)
                  └─ BrowserRouter (Roteamento)
                      └─ Routes (Páginas)
```

---

## Contextos React

### AuthContext

**Arquivo:** `src/contexts/AuthContext.tsx`

**Responsabilidades:**
- Gerenciar estado de autenticação
- Prover funções de login/register/logout
- Verificar status de autenticação na inicialização
- Refresh automático de tokens

**Estado:**
```typescript
interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  doLogin: (credentials: LoginCredentials) => Promise<UserPublic>;
}
```

**Fluxo de Inicialização:**
```typescript
useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      const userData = await auth.me();  // Verifica se há sessão
      setUser(userData);
    } catch (error) {
      setUser(null);  // Não autenticado
    } finally {
      setIsLoading(false);
    }
  };

  checkAuthStatus();
}, []);
```

**Uso:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <div>Olá, {user.name}!</div>;
}
```

### AppContext

**Arquivo:** `src/contexts/AppContext.tsx`

**Responsabilidades:**
- Gerenciar dados da aplicação (clientes, agendamentos)
- Prover funções para manipular dados
- Persistir configurações no localStorage

**Interfaces de Dados:**
```typescript
interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpf: string;
  endereco: string;
  email?: string;
  observacoes?: string;
  dataCadastro: Date;
}

interface Agendamento {
  id: string;
  clienteId: string;
  cliente: string;
  tipo: 'Consulta' | 'Tratamento' | 'Retorno';
  data: Date;
  horaInicio: string;
  duracao: number;
  status: 'pendente' | 'confirmado' | 'concluido' | 'desmarcado';
  observacoes?: string;
  anotacoes?: string;
  prescriptions?: Prescription[];
}

interface UserSettings {
  notificationsEnabled: boolean;
  emailReminders: boolean;
  theme: "system" | "light" | "dark";
  language?: string;
}
```

**Funções Principais:**
- `adicionarCliente()`
- `buscarClientes(termo)`
- `adicionarAgendamento()`
- `atualizarStatusAgendamento()`
- `desmarcarAgendamento()`
- `buscarAgendamentosPorData()`
- `buscarProximosAgendamentos()`
- `salvarAnotacaoConsulta()`
- `concluirConsulta()`
- `saveSettings()`

**Uso:**
```typescript
import { useApp } from '@/contexts/AppContext';

function AgendamentosList() {
  const { agendamentos, buscarProximosAgendamentos } = useApp();
  
  const proximos = buscarProximosAgendamentos();
  
  return (
    <ul>
      {proximos.map(ag => (
        <li key={ag.id}>{ag.cliente} - {ag.horaInicio}</li>
      ))}
    </ul>
  );
}
```

---

## TypeScript Types

### src/types/appointment.ts

**Propósito:** Definições de tipos para appointments da API

```typescript
export interface Appointment {
  id: number;
  tenant_id: string;
  patient_id: string;
  starts_at: string;  // ISO 8601 UTC timestamp
  duration_min: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  tenantId: string;
  patientId: string;
  startsAt: string;  // ISO 8601 UTC timestamp
  durationMin: number;
  status?: 'pending' | 'confirmed';
}

export interface AppointmentUpdate {
  status: 'pending' | 'confirmed' | 'cancelled';
}
```

**Uso:**
```typescript
import type { Appointment } from '@/types/appointment';

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const localTime = dayjs(appointment.starts_at)
    .tz('America/Recife')
    .format('HH:mm');
  
  return (
    <div>
      <h3>Paciente: {appointment.patient_id}</h3>
      <p>Horário: {localTime}</p>
      <p>Status: {appointment.status}</p>
    </div>
  );
}
```

**Características:**
- Alinhados com schemas Pydantic do backend
- Status com union types para type safety
- Timestamps em formato ISO 8601 UTC
- Separação clara entre create, update e response types

### src/types/auth.ts

**Propósito:** Definições de tipos para autenticação

```typescript
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
```

---

## Serviços de API

### api.ts - Cliente HTTP Base

**Arquivo:** `src/services/api.ts`

```typescript
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function api<T = any>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const url = `${API_URL}${path}`;

    const config: RequestInit = {
        ...init,
        credentials: 'include',  // Envia cookies automaticamente
        headers: {
            'Content-Type': 'application/json',
            ...init.headers,
        },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(
            data?.detail || data?.message || 'Erro na requisição',
            response.status,
            data?.detail
        );
    }

    return data;
}
```

**Helper Methods:**
```typescript
// GET com query params
api.get = async function<T = any>(
    path: string,
    options: { params?: Record<string, any>; headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    // Converte params em query string
    // Retorna { data, status, ok }
};

// POST com body JSON
api.post = async function<T = any>(
    path: string,
    body: any,
    options: { headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    // Serializa body como JSON
    // Retorna { data, status, ok }
};

// PATCH com body JSON
api.patch = async function<T = any>(
    path: string,
    body: any,
    options: { headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    // Serializa body como JSON
    // Retorna { data, status, ok }
};
```

**Uso dos helpers:**
```typescript
// GET com query params
const { data } = await api.get<Appointment[]>('/v1/appointments/', {
  params: { tenantId: 'abc', from: '2025-10-01T00:00:00Z' },
  headers: { 'Cache-Control': 'no-cache' }
});

// POST
const { data } = await api.post('/v1/appointments/', {
  tenantId: 'abc',
  patientId: '123',
  startsAt: '2025-10-10T14:00:00Z',
  durationMin: 60
});

// PATCH
const { data } = await api.patch('/v1/appointments/1', {
  status: 'confirmed'
});
```

**Características:**
- `credentials: 'include'`: Envia cookies httpOnly
- Error handling customizado
- Type-safe com generics
- Base URL configurável via .env
- Helper methods para GET/POST/PATCH
- Query params automáticos em GET
- Response wrapper com status e ok

### auth.ts - Serviço de Autenticação

**Arquivo:** `src/services/auth.ts`

```typescript
export const auth = {
    async register({ name, email, password }): Promise<UserPublic> {
        await api<AuthTokens>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                username: name,
                password,
                full_name: name
            })
        });
        return await this.me();
    },

    async login({ email, password }): Promise<UserPublic> {
        await api<AuthTokens>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return await this.me();
    },

    async me(): Promise<UserPublic> {
        const user = await api<User>('/api/auth/me');
        return {
            id: user.id.toString(),
            name: user.full_name || user.username,
            email: user.email
        };
    },

    async refresh(): Promise<UserPublic> {
        await api<AuthTokens>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({})
        });
        return await this.me();
    },

    async logout(): Promise<void> {
        await api('/api/auth/logout', {
            method: 'POST'
        });
    }
};
```

---

## Custom Hooks

### useAppointmentMutations

**Arquivo:** `src/hooks/useAppointmentMutations.ts`

**Propósito:** Mutations para criar e atualizar agendamentos

```typescript
export function useCreateAppointment(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId);
    
    return useMutation({
        mutationFn: async (payload: Omit<CreateInput, 'tenantId'>) => {
            // Converte data local para UTC
            const startsAtUTC = dayjs
                .tz(payload.startsAtLocal, 'America/Recife')
                .utc()
                .toISOString();
            
            const body = { ...payload, tenantId, startsAt: startsAtUTC };
            const { data } = await api.post('/v1/appointments', body);
            return data;
        },
        onSuccess: (created) => invalidate(created?.startsAt)
    });
}

export function useUpdateAppointmentStatus(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId);
    
    return useMutation({
        mutationFn: async (payload: UpdateStatusInput) => {
            const { data } = await api.patch(
                `/v1/appointments/${payload.appointmentId}`,
                { status: payload.status }
            );
            return data;
        },
        onSuccess: (_data, vars) => invalidate(vars.startsAtUTC)
    });
}
```

**Uso:**
```typescript
function NovoAgendamento() {
  const createMutation = useCreateAppointment('tenant-123');
  
  const handleSubmit = (data) => {
    createMutation.mutate({
      patientId: data.patientId,
      startsAtLocal: data.dateTime,
      durationMin: 60,
      status: 'pending'
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### useDashboardSummary

**Arquivo:** `src/hooks/useDashboardSummary.ts`

**Propósito:** Buscar resumo de agendamentos (hoje e amanhã)

```typescript
export function useDashboardSummary(tenantId: string) {
    const fromISO = dayjs().tz('America/Recife').startOf('day').toISOString();
    const toISO = dayjs().tz('America/Recife').add(2, 'day').startOf('day').toISOString();

    return useQuery({
        queryKey: ['dashboardSummary', tenantId, fromISO, toISO],
        queryFn: async () => {
            const { data } = await api.get<DashboardSummary>(
                '/v1/appointments/summary',
                {
                    params: { tenantId, from: fromISO, to: toISO, tz: 'America/Recife' }
                }
            );
            return data;
        },
        staleTime: 30_000,        // Cache por 30 segundos
        refetchOnWindowFocus: true  // Recarrega ao focar janela
    });
}
```

**Uso:**
```typescript
function DashboardStats() {
  const { data, isLoading } = useDashboardSummary('tenant-123');
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <p>Hoje: {data.today.total} consultas</p>
      <p>Amanhã: {data.tomorrow.total} consultas</p>
    </div>
  );
}
```

### useDashboardMegaStats

**Arquivo:** `src/hooks/useDashboardMegaStats.ts`

**Propósito:** Estatísticas agregadas (hoje, semana, mês, próximo mês)

```typescript
export function useDashboardMegaStats(tenantId: string) {
    return useQuery({
        queryKey: ['dashboardMegaStats', tenantId],
        queryFn: async () => {
            const { data } = await api.get('/v1/appointments/mega-stats', {
                params: { tenantId, tz: 'America/Recife' },
                headers: { 'Cache-Control': 'no-cache' }
            });
            return data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true
    });
}
```

### useMonthAppointments

**Arquivo:** `src/hooks/useMonthAppointments.ts`

**Propósito:** Buscar agendamentos de um mês específico para o calendário

```typescript
export function useMonthAppointments(tenantId: string, year: number, month: number) {
    // Início do mês no timezone local
    const monthStart = dayjs()
        .tz('America/Recife')
        .year(year)
        .month(month)
        .startOf('month')
        .toISOString();

    // Início do próximo mês
    const nextMonthStart = dayjs()
        .tz('America/Recife')
        .year(year)
        .month(month)
        .add(1, 'month')
        .startOf('month')
        .toISOString();

    return useQuery({
        queryKey: ['appointments', tenantId, year, month],
        queryFn: async () => {
            const { data } = await api.get<Appointment[]>('/v1/appointments/', {
                params: { 
                    tenantId, 
                    from: monthStart, 
                    to: nextMonthStart, 
                },
                headers: { 'Cache-Control': 'no-cache' }
            });
            return data;
        },
        staleTime: 30_000,        // Cache por 30 segundos
        refetchOnWindowFocus: true  // Recarrega ao focar janela
    });
}
```

**Uso:**
```typescript
function CalendarModal({ tenantId }: { tenantId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: appointments, isLoading } = useMonthAppointments(tenantId, year, month);
  
  // Navegar para próximo mês
  const handleNextMonth = () => {
    setCurrentDate(prev => dayjs(prev).add(1, 'month').toDate());
  };
  
  return (
    <div>
      <Calendar appointments={appointments} />
      <button onClick={handleNextMonth}>Próximo Mês</button>
    </div>
  );
}
```

**Características:**
- Query key dinâmico baseado em tenant, ano e mês
- Cache automático por 30 segundos
- Refetch ao focar janela
- Timezone America/Recife
- Retorna lista completa de appointments do mês

### useInvalidateAgenda

**Arquivo:** `src/hooks/useInvalidateAgenda.ts`

**Propósito:** Invalidar cache de agendamentos após mutações

```typescript
export function useInvalidateAgenda(tenantId: string) {
    const queryClient = useQueryClient();
    
    return useCallback((startsAtUTC?: string) => {
        // Invalida todos os queries relacionados
        queryClient.invalidateQueries(['dashboardSummary', tenantId]);
        queryClient.invalidateQueries(['dashboardMegaStats', tenantId]);
        
        if (startsAtUTC) {
            // Invalida queries específicos da data
            const localDate = dayjs(startsAtUTC).tz('America/Recife');
            queryClient.invalidateQueries(['appointments', tenantId, localDate.format('YYYY-MM')]);
        }
    }, [queryClient, tenantId]);
}
```

---

## Componentes Principais

### ProtectedRoute

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

**Propósito:** HOC para proteger rotas que requerem autenticação

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

### Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

**Estrutura:**
```
Dashboard
├── Header (navegação)
├── Boas-vindas
├── Grid de Estatísticas (4 cards)
│   ├── StatsCard (Consultas Hoje)
│   ├── StatsCard (Total Clientes)
│   ├── StatsCard (Próxima Consulta)
│   └── StatsCard (Clientes Inativos)
├── Grid Principal (3 colunas)
│   ├── RecentAppointments (esquerda)
│   ├── InteractiveCalendar (centro)
│   └── Ações Rápidas (direita)
└── Modais
    ├── CadastroClienteModal
    ├── NovoAgendamentoModal
    ├── DesmarcarAgendamentoModal
    └── HistoricoPacientesModal
```

**Características:**
- Responsivo (grid adapta em mobile)
- Estatísticas em tempo real
- Ações rápidas sempre acessíveis
- Modais para fluxos complexos

### InteractiveCalendar

**Arquivo:** `src/components/Calendar/InteractiveCalendar.tsx`

**Propósito:** Calendário compacto no dashboard

```typescript
const InteractiveCalendar = ({ tenantId }: { tenantId: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <Card onClick={() => setIsModalOpen(true)}>
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCalendarStats tenantId={tenantId} />
          <DashboardCalendarCard tenantId={tenantId} />
          <Button>Ver Calendário Completo</Button>
        </CardContent>
      </Card>
      
      <CalendarModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
```

### StatsCard

**Arquivo:** `src/components/Dashboard/StatsCard.tsx`

**Propósito:** Card de estatística com gradiente

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  gradient: string;
  actionButton?: ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title, value, description, icon, gradient, actionButton
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {actionButton}
      </CardContent>
    </Card>
  );
};
```

---

## Gerenciamento de Estado

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // 30 segundos
      cacheTime: 5 * 60 * 1000,       // 5 minutos
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Cache Strategy

1. **Queries:**
   - `staleTime: 30s` - Dados considerados frescos por 30s
   - Auto refetch ao focar janela
   - 1 retry automático em caso de erro

2. **Mutations:**
   - Sem retry automático
   - Invalidação manual de cache relacionado
   - Optimistic updates em alguns casos

3. **Query Keys:**
   ```typescript
   ['dashboardSummary', tenantId, fromISO, toISO]
   ['dashboardMegaStats', tenantId]
   ['appointments', tenantId, monthKey]
   ```

---

## Formulários com React Hook Form + Zod

### Exemplo: LoginForm

```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Login realizado!');
    } catch (error) {
      toast.error('Credenciais inválidas');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... password field ... */}
        <Button type="submit">Entrar</Button>
      </form>
    </Form>
  );
}
```

**Benefícios:**
- Validação em tempo real
- Type-safe com TypeScript
- Mensagens de erro automáticas
- Controle fino do estado do formulário

---

## Estilização

### Tailwind CSS

**Uso:**
```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all">
  <h2 className="text-2xl font-bold text-gray-800">Título</h2>
  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
    Ação
  </Button>
</div>
```

### Temas e Cores

**Cores da Marca:**
```css
--brand-purple: 270 70% 60%;
--brand-pink: 330 80% 70%;
--brand-lime: 80 70% 60%;
--brand-green: 150 70% 50%;
```

**Gradientes Comuns:**
```typescript
// Purple to Pink
className="bg-gradient-to-r from-brand-purple to-brand-pink"

// Lime to Pink
className="bg-gradient-to-r from-brand-lime to-brand-pink"

// Background com opacidade
className="bg-gradient-to-br from-brand-pink/30 via-background to-brand-lime/20"
```

---

## Performance

### Code Splitting

```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Suspense para loading
<Suspense fallback={<LoadingScreen />}>
  <Dashboard />
</Suspense>
```

### Memoization

```typescript
// Componentes pesados
const ExpensiveComponent = memo(({ data }) => {
  // ... renderização complexa
});

// Callbacks
const handleClick = useCallback(() => {
  // ... lógica
}, [dependency]);

// Valores computados
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### React Query Optimizations

- Prefetching de dados
- Deduplicação automática de requests
- Background refetching
- Cache persistence (futuro)

---

## Acessibilidade

### ARIA Labels

```typescript
<button aria-label="Fechar modal" onClick={onClose}>
  <X className="w-4 h-4" />
</button>
```

### Keyboard Navigation

- Todos os botões acessíveis via Tab
- Enter/Space para acionar
- Escape para fechar modais
- Focus trapping em modais

### Semântica HTML

- Uso correto de `<header>`, `<nav>`, `<main>`, `<section>`
- Formulários com `<label>` associados
- Landmarks para screen readers

---

## Responsividade

### Breakpoints Tailwind

```typescript
// Mobile first
<div className="
  grid 
  grid-cols-1      // Mobile: 1 coluna
  md:grid-cols-2   // Tablet: 2 colunas
  lg:grid-cols-3   // Desktop: 3 colunas
  gap-6
">
```

### Mobile Nav

- Menu hambúrguer em telas pequenas
- Drawer animado com Vaul
- Touch-friendly (botões grandes)

---

## Testes

**Status Atual:** Sem testes automatizados

**Plano Futuro:**
- Vitest para unit tests
- React Testing Library para component tests
- Playwright/Cypress para E2E tests
- MSW para mock de API

---

## Build e Deploy

### Desenvolvimento

```bash
npm run dev  # Vite dev server com HMR
```

### Produção

```bash
npm run build           # Build otimizado
npm run preview         # Prevê build localmente
```

**Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # JavaScript minificado
│   ├── index-[hash].css   # CSS minificado
│   └── [images]/          # Assets otimizados
└── ...
```

### Environment Variables

```env
# .env.production
VITE_API_URL=https://api.alignwork.com
```

---

**Última atualização:** Outubro 2025

