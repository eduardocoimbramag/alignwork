# 🔌 AlignWork - API Reference

> **Fonte:** Consolidado de `_archive/api-reference.md`  
> **Última atualização:** Outubro 2025  
> **Base URL:** `http://localhost:8000`

---

## 🎯 Quando usar este documento

Use este documento para:
- Consumir a API REST do AlignWork
- Integrar frontend com backend
- Testar endpoints manualmente
- Debugar problemas de comunicação HTTP
- Documentação para integrações externas

---

## 📋 Índice

- [Autenticação](#autenticacao)
- [Appointments](#appointments)
- [Health Checks](#health-checks)
- [Códigos de Status](#codigos-de-status)
- [Formato de Erros](#formato-de-erros)
- [Timezone Handling](#timezone-handling)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Autenticação

**Base Path:** `/api/auth`  
**Autenticação:** JWT via httpOnly cookies

### POST /api/auth/register

Registra um novo usuário no sistema.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

**Validações:**
- `email`: Email válido, único
- `username`: Mínimo 3 caracteres, apenas letras/números/underscore, único
- `password`: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
- `full_name`: Opcional

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 400 | Email already registered | Email já existe no banco |
| 400 | Username already taken | Username já existe no banco |
| 422 | Validation Error | Dados inválidos (ver validações) |

---

### POST /api/auth/login

Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Cookies Definidos:**
```
access_token=eyJ...; HttpOnly; SameSite=Lax; Max-Age=900
refresh_token=eyJ...; HttpOnly; SameSite=Lax; Max-Age=604800
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 401 | Incorrect email or password | Credenciais inválidas |
| 400 | Inactive user | Usuário desativado |
| 422 | Validation Error | Email inválido |

---

### POST /api/auth/refresh

Renova o access token usando o refresh token.

**Cookies Requeridos:**
```
Cookie: refresh_token=eyJ...
```

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "access_token": "novo_token...",
  "refresh_token": "novo_refresh_token...",
  "token_type": "bearer"
}
```

**Cookies Atualizados:**
```
access_token=novo_token...; HttpOnly; SameSite=Lax; Max-Age=900
refresh_token=novo_refresh_token...; HttpOnly; SameSite=Lax; Max-Age=604800
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 401 | Refresh token not found | Cookie não enviado |
| 401 | Invalid refresh token | Token expirado ou inválido |
| 401 | Invalid token type | Token não é do tipo refresh |

---

### POST /api/auth/logout

Desloga o usuário limpando os cookies.

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Cookies Removidos:**
- `access_token`
- `refresh_token`

---

### GET /api/auth/me

Retorna informações do usuário autenticado.

**⚠️ Autenticação Requerida**

**Cookies Requeridos:**
```
Cookie: access_token=eyJ...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "usuario@exemplo.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-05T10:30:00Z"
}
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 401 | Not authenticated | Cookie não enviado |
| 401 | User not found | Usuário deletado após token gerado |
| 400 | Inactive user | Usuário desativado |

---

## Appointments

**Base Path:** `/api/v1/appointments`  
**Autenticação:** Não requerida (futuro: será protegida)

### GET /api/v1/appointments/summary

Retorna resumo de agendamentos para hoje e amanhã.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tenantId` | string | Sim | ID do tenant/consultório |
| `from` | string | Sim | Data início (ISO 8601 UTC) |
| `to` | string | Sim | Data fim (ISO 8601 UTC) |
| `tz` | string | Não | Timezone (default: "America/Recife") |

**Exemplo Request:**
```
GET /api/v1/appointments/summary?tenantId=tenant-123&from=2025-10-05T03:00:00.000Z&to=2025-10-07T03:00:00.000Z&tz=America/Recife
```

**Response (200 OK):**
```json
{
  "today": {
    "total": 5,
    "confirmed": 3,
    "pending": 2
  },
  "tomorrow": {
    "total": 3,
    "confirmed": 2,
    "pending": 1
  }
}
```

**Lógica:**
- Filtra appointments por `tenantId` e intervalo de datas
- Converte `starts_at` (UTC) para timezone local
- Agrupa por "hoje" e "amanhã" no timezone local
- Conta por status (apenas `confirmed` e `pending`, ignora `cancelled`)

**Headers Response:**
```
Cache-Control: no-store
```

---

### GET /api/v1/appointments/mega-stats

Retorna estatísticas agregadas por período (hoje, semana, mês, próximo mês).

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tenantId` | string | Sim | ID do tenant/consultório |
| `tz` | string | Não | Timezone (default: "America/Recife") |

**Exemplo Request:**
```
GET /api/v1/appointments/mega-stats?tenantId=tenant-123&tz=America/Recife
```

**Response (200 OK):**
```json
{
  "today": {
    "confirmed": 3,
    "pending": 2
  },
  "week": {
    "confirmed": 15,
    "pending": 8
  },
  "month": {
    "confirmed": 45,
    "pending": 20
  },
  "nextMonth": {
    "confirmed": 10,
    "pending": 5
  }
}
```

**Definições de Períodos:**
- **today**: Hoje (00:00 - 23:59 no timezone local)
- **week**: Semana corrente (Domingo 00:00 - Sábado 23:59)
- **month**: Mês corrente (dia 1 00:00 - último dia 23:59)
- **nextMonth**: Próximo mês completo

**Headers Response:**
```
Cache-Control: no-store
```

**⚠️ Importante:** Este endpoint é usado pelo componente `DashboardCalendarStats`. Certifique-se de usar a URL correta `/api/v1/appointments/mega-stats` (com prefixo `/api`).

---

### GET /api/v1/appointments/

Lista todos os agendamentos com filtros opcionais por data.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tenantId` | string | Sim | ID do tenant/consultório |
| `from` | string | Não | Data início (ISO 8601 UTC) |
| `to` | string | Não | Data fim (ISO 8601 UTC) |

**Exemplo Request:**
```
GET /api/v1/appointments/?tenantId=tenant-123&from=2025-10-01T00:00:00.000Z&to=2025-10-31T23:59:59.999Z
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tenant_id": "tenant-123",
    "patient_id": "patient-456",
    "starts_at": "2025-10-10T14:00:00",
    "duration_min": 60,
    "status": "confirmed",
    "created_at": "2025-10-05T10:30:00",
    "updated_at": "2025-10-05T10:30:00"
  },
  {
    "id": 2,
    "tenant_id": "tenant-123",
    "patient_id": "patient-789",
    "starts_at": "2025-10-15T10:00:00",
    "duration_min": 30,
    "status": "pending",
    "created_at": "2025-10-05T11:00:00",
    "updated_at": "2025-10-05T11:00:00"
  }
]
```

**Lógica:**
- Filtra appointments por `tenantId` (obrigatório)
- Se `from` fornecido, filtra `starts_at >= from`
- Se `to` fornecido, filtra `starts_at < to`
- Ordena por `starts_at` crescente
- Retorna todos os status (pending, confirmed, cancelled)

**Uso comum:**
- Calendário mensal: `/api/v1/appointments/?tenantId=X&from=2025-10-01T00:00:00Z&to=2025-11-01T00:00:00Z`
- Todos appointments: `/api/v1/appointments/?tenantId=X`
- Intervalo específico: `/api/v1/appointments/?tenantId=X&from=START&to=END`

---

### POST /api/v1/appointments/

Cria um novo agendamento.

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "patientId": "patient-456",
  "startsAt": "2025-10-10T14:00:00Z",
  "durationMin": 60,
  "status": "pending"
}
```

**Validações:**
- `tenantId`: String não vazia
- `patientId`: String não vazia
- `startsAt`: ISO 8601 UTC timestamp
- `durationMin`: Inteiro positivo (minutos)
- `status`: "pending", "confirmed" ou "cancelled" (default: "pending")

**Response (200 OK):**
```json
{
  "id": 1,
  "tenant_id": "tenant-123",
  "patient_id": "patient-456",
  "starts_at": "2025-10-10T14:00:00",
  "duration_min": 60,
  "status": "pending",
  "created_at": "2025-10-05T10:30:00",
  "updated_at": "2025-10-05T10:30:00"
}
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 422 | Validation Error | Dados inválidos |

---

### PATCH /api/v1/appointments/{appointment_id}

Atualiza o status de um agendamento.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `appointment_id` | integer | ID do agendamento |

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valores permitidos:**
- `"pending"`: Agendamento pendente
- `"confirmed"`: Agendamento confirmado
- `"cancelled"`: Agendamento cancelado

**Response (200 OK):**
```json
{
  "id": 1,
  "tenant_id": "tenant-123",
  "patient_id": "patient-456",
  "starts_at": "2025-10-10T14:00:00",
  "duration_min": 60,
  "status": "confirmed",
  "created_at": "2025-10-05T10:30:00",
  "updated_at": "2025-10-05T11:00:00"
}
```

**Erros:**
| Status | Detail | Causa |
|--------|--------|-------|
| 404 | Appointment not found | ID não existe |
| 422 | Validation Error | Status inválido |

---

## Health Checks

### GET /

Health check básico da API.

**Response (200 OK):**
```json
{
  "message": "AlignWork API is running!"
}
```

---

### GET /health

Health check detalhado da API.

**Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

## Códigos de Status

| Código | Nome | Quando é usado |
|--------|------|----------------|
| 200 | OK | Sucesso |
| 400 | Bad Request | Erro de validação de negócio |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Não autorizado (autenticado mas sem permissão) |
| 404 | Not Found | Recurso não encontrado |
| 422 | Unprocessable Entity | Erro de validação de schema |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Formato de Erros

Todos os erros seguem o formato padrão do FastAPI.

### Erro Simples (400, 401, 404)
```json
{
  "detail": "Email already registered"
}
```

### Erro de Validação (422)
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters long",
      "type": "value_error"
    }
  ]
}
```

**Campos:**
- `loc`: Localização do erro (path no JSON)
- `msg`: Mensagem de erro
- `type`: Tipo do erro

---

## Timezone Handling

### Regras

1. **Armazenamento:** Todas as datas são armazenadas em UTC no banco
2. **API Input:** Aceita ISO 8601 UTC timestamps
3. **API Output:** Retorna datetime em UTC (sem Z sufixo, conforme SQLAlchemy)
4. **Frontend:** Converte UTC para timezone local (America/Recife)

### Exemplo de Conversão

**Frontend → Backend:**
```typescript
// Usuário seleciona: 2025-10-10 14:00 (America/Recife)
const local = dayjs.tz("2025-10-10 14:00", "America/Recife");
const utc = local.utc().toISOString();
// Envia: "2025-10-10T17:00:00.000Z"
```

**Backend → Frontend:**
```typescript
// Recebe: "2025-10-10T17:00:00" (UTC sem Z)
const utc = dayjs.utc("2025-10-10T17:00:00");
const local = utc.tz("America/Recife");
// Exibe: "2025-10-10 14:00"
```

---

## Exemplos de Uso

### cURL

#### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123",
    "full_name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -b cookies.txt
```

#### Create Appointment
```bash
curl -X POST http://localhost:8000/api/v1/appointments/ \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "patientId": "patient-456",
    "startsAt": "2025-10-10T14:00:00Z",
    "durationMin": 60,
    "status": "pending"
  }'
```

### JavaScript (fetch)

```javascript
// Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // Importante para cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();

// Requests subsequentes enviam cookie automaticamente
const user = await fetch('http://localhost:8000/api/auth/me', {
  credentials: 'include'
});
```

### Python (requests)

```python
import requests

session = requests.Session()

# Login
response = session.post('http://localhost:8000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'SecurePass123'
})

# Requests subsequentes usam cookies da sessão
user = session.get('http://localhost:8000/api/auth/me')
print(user.json())
```

---

## Documentação Interativa

### Swagger UI
**URL:** `http://localhost:8000/docs`

- Interface interativa para testar endpoints
- Documentação automática via FastAPI
- Permite executar requests diretamente

### ReDoc
**URL:** `http://localhost:8000/redoc`

- Documentação alternativa mais limpa
- Melhor para leitura (não permite testes)

### OpenAPI JSON
**URL:** `http://localhost:8000/openapi.json`

- Schema OpenAPI 3.0 completo
- Pode ser importado em ferramentas (Postman, Insomnia)

---

## Troubleshooting Comum

### Erro: URLs incorretas nos hooks

**Problema:** Hooks retornam 404 ao tentar acessar endpoints.

**Causa:** Falta do prefixo `/api` nas URLs.

**Solução:** Verificar que todos os hooks usam URLs com `/api`:
- ✅ `/api/v1/appointments/mega-stats`
- ❌ `/v1/appointments/mega-stats`

**Arquivos afetados:**
- `useDashboardMegaStats.ts`
- `useDashboardSummary.ts`
- `useMonthAppointments.ts`
- `useAppointmentMutations.ts`

### Erro: CORS

**Sintoma:**
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

**Solução:** Verificar `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Erro: Cookie não funciona

**Sintoma:** Requests autenticados retornam 401.

**Solução Frontend:**
```typescript
fetch(url, {
  credentials: 'include'  // IMPORTANTE
});
```

### Tela “zerada” após login (dados não aparecem)

**Sintoma:** Pós-login ou após recarregar a página, listas e estatísticas aparecem vazias.

**Causas comuns:**
- Falta de chamada a `GET /api/auth/me` para validar sessão e disparar bootstrap de dados.
- `tenantId` não definido/recuperado antes de chamar endpoints de agenda.
- URLs sem o prefixo `/api`.

**Solução:**
- Após login, chamar `/api/auth/me` e, em seguida, pré-carregar `/api/v1/appointments/mega-stats` e `/api/v1/appointments/summary` informando `tenantId` e `tz`.
- Em reloads, repetir o processo de validação e bootstrap automaticamente.
- Garantir `credentials: 'include'` em todas as requisições.

### Confirmação de consulta retorna 404

**Sintoma:** Ao confirmar no modal, o PATCH responde `404 Appointment not found`.

**Causas comuns:**
- O item exibido na lista é local (AppContext) e ainda não existe no banco (id não persistido).
- Rota sem prefixo `/api`.

**Solução:**
- Confirmar que a chamada usa `/api/v1/appointments/{id}` e que o `id` existe no backend.
- Em fallback, a UI pode atualizar localmente para feedback imediato, mas deve sincronizar quando o item existir no servidor.

---

**Próximas seções:** Ver [SECURITY.md](./SECURITY.md) para práticas de segurança e [RUNBOOK.md](./RUNBOOK.md) para setup e comandos.

