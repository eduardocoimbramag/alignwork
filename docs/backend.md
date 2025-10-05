# Backend - FastAPI

## Visão Geral

O backend do AlignWork é construído com FastAPI, oferecendo uma API RESTful rápida, moderna e bem documentada. O sistema utiliza SQLite como banco de dados e implementa autenticação JWT com httpOnly cookies para segurança.

---

## Arquitetura do Backend

### Estrutura de Diretórios

```
backend/
├── auth/                    # Módulo de autenticação
│   ├── dependencies.py     # Injeção de dependências
│   └── utils.py           # Utilitários JWT, hash, tokens
├── models/                # Modelos de dados (SQLAlchemy)
│   ├── user.py           # Modelo User
│   └── appointment.py    # Modelo Appointment
├── schemas/              # Schemas de validação (Pydantic)
│   ├── auth.py          # UserRegister, UserLogin, Token
│   ├── user.py         # UserBase, UserCreate, UserResponse
│   └── appointment.py  # AppointmentCreate, AppointmentUpdate
├── routes/             # Rotas da API
│   ├── auth.py        # /api/auth/*
│   └── appointments.py # /api/v1/appointments/*
└── main.py           # Aplicação principal FastAPI
```

---

## main.py - Aplicação Principal

### Responsabilidades

- Inicialização da aplicação FastAPI
- Configuração do CORS
- Setup do banco de dados
- Registro de routers
- Override de dependências

### Código Detalhado

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Carregamento de variáveis de ambiente
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../alignwork.db")

# Engine do SQLAlchemy
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Necessário para SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Criação de todas as tabelas
Base.metadata.create_all(bind=engine)

# Inicialização do FastAPI
app = FastAPI(
    title="AlignWork API",
    description="API for AlignWork - Healthcare Management System",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,  # Necessário para cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
```

### Endpoints Principais

- `GET /` - Health check raiz
- `GET /health` - Health check detalhado

---

## Modelos de Dados (SQLAlchemy)

### User Model

**Arquivo:** `backend/models/user.py`

```python
class User(Base):
    __tablename__ = "users"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    
    # Status e controle
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**Características:**
- Email e username são únicos e indexados para busca rápida
- Senha nunca é armazenada em texto plano (apenas hash bcrypt)
- Timestamps automáticos para auditoria
- Flags para controle de status (ativo, verificado)

### Appointment Model

**Arquivo:** `backend/models/appointment.py`

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
- `tenant_id`: Suporte para multi-tenancy (múltiplos consultórios)
- `starts_at`: Sempre armazenado em UTC para consistência
- `status`: Estado do agendamento (pending, confirmed, cancelled)
- Indexado por `tenant_id` para queries eficientes

---

## Schemas de Validação (Pydantic)

### Auth Schemas

**Arquivo:** `backend/schemas/auth.py`

#### UserRegister
```python
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers and underscores')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v
```

**Validações:**
- Email validado via Pydantic EmailStr
- Username: mínimo 3 caracteres, apenas letras, números e underscore
- Senha: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número

#### Token
```python
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

### Appointment Schemas

**Arquivo:** `backend/schemas/appointment.py`

```python
class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"

class AppointmentUpdate(BaseModel):
    status: str  # pending, confirmed, cancelled

class AppointmentResponse(BaseModel):
    id: int
    tenant_id: str
    patient_id: str
    starts_at: datetime
    duration_min: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2
```

---

## Autenticação (auth/)

### utils.py - Utilitários de Autenticação

#### Hash de Senhas (bcrypt)

```python
def get_password_hash(password: str) -> str:
    """Hash a password usando bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha contra hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except:
        # Fallback para compatibilidade com hashes antigos
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
```

#### Geração de Tokens JWT

```python
# Configuração
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token de acesso com expiração curta."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    """Cria token de refresh com expiração longa."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

#### Verificação de Tokens

```python
def verify_token(token: str, token_type: str = "access") -> dict:
    """Verifica e decodifica JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        token_type_from_payload: str = payload.get("type")
        
        # Validações
        if email is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        if token_type_from_payload != token_type:
            raise HTTPException(
                status_code=401, 
                detail=f"Invalid token type. Expected {token_type}"
            )
            
        return {"email": email, "user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

### dependencies.py - Injeção de Dependências

#### get_current_user

```python
def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtém usuário atual a partir do token em httpOnly cookie.
    Usado como dependência em rotas protegidas.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token_data = verify_token(access_token, "access")
        user = db.query(User).filter(User.email == token_data["email"]).first()
        
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

---

## Rotas da API

### Auth Routes (/api/auth/*)

**Arquivo:** `backend/routes/auth.py`

#### POST /api/auth/register

**Propósito:** Registrar novo usuário

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Fluxo:**
1. Valida dados de entrada (Pydantic)
2. Verifica se email/username já existem
3. Hash da senha com bcrypt
4. Cria registro no banco
5. Gera tokens JWT
6. Retorna tokens

#### POST /api/auth/login

**Propósito:** Autenticar usuário existente

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Mesma estrutura do register

**Cookies Definidos:**
```
access_token (httpOnly, secure=False, samesite=lax, max-age=900s)
refresh_token (httpOnly, secure=False, samesite=lax, max-age=604800s)
```

**Fluxo:**
1. Busca usuário por email
2. Verifica senha com bcrypt
3. Valida se usuário está ativo
4. Gera tokens
5. Define cookies httpOnly
6. Retorna tokens

#### POST /api/auth/refresh

**Propósito:** Renovar access token usando refresh token

**Headers:**
```
Cookie: refresh_token=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:**
```json
{
  "access_token": "novo_token_aqui",
  "refresh_token": "novo_refresh_token_aqui",
  "token_type": "bearer"
}
```

**Fluxo:**
1. Lê refresh token do cookie
2. Verifica validade do token
3. Busca usuário no banco
4. Gera novos tokens
5. Atualiza cookies
6. Retorna novos tokens

#### POST /api/auth/logout

**Propósito:** Deslogar usuário (limpar cookies)

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

**Fluxo:**
1. Remove cookie `access_token`
2. Remove cookie `refresh_token`
3. Retorna confirmação

#### GET /api/auth/me

**Propósito:** Obter informações do usuário autenticado

**Headers:**
```
Cookie: access_token=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-05T10:30:00Z"
}
```

**Dependências:** `Depends(get_current_user)`

---

### Appointment Routes (/api/v1/appointments/*)

**Arquivo:** `backend/routes/appointments.py`

#### GET /api/v1/appointments/summary

**Propósito:** Obter resumo de agendamentos (hoje e amanhã)

**Query Parameters:**
- `tenantId` (required): ID do tenant
- `from` (required): Data início (ISO string)
- `to` (required): Data fim (ISO string)
- `tz` (optional): Timezone (default: "America/Recife")

**Response:**
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
1. Converte datas de ISO para datetime
2. Filtra appointments por tenant e intervalo
3. Converte UTC para timezone local
4. Agrupa por "hoje" e "amanhã"
5. Conta por status (confirmed, pending)

#### GET /api/v1/appointments/mega-stats

**Propósito:** Estatísticas agregadas (hoje, semana, mês, próximo mês)

**Query Parameters:**
- `tenantId` (required): ID do tenant
- `tz` (optional): Timezone (default: "America/Recife")

**Response:**
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

**Lógica:**
1. Calcula limites de cada período no timezone local
2. Converte limites para UTC para query
3. Usa função `_count_bucket` para cada período
4. Retorna estatísticas agregadas

#### POST /api/v1/appointments/

**Propósito:** Criar novo agendamento

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

**Response:**
```json
{
  "id": 1,
  "tenant_id": "tenant-123",
  "patient_id": "patient-456",
  "starts_at": "2025-10-10T14:00:00Z",
  "duration_min": 60,
  "status": "pending",
  "created_at": "2025-10-05T10:30:00Z",
  "updated_at": "2025-10-05T10:30:00Z"
}
```

#### PATCH /api/v1/appointments/{appointment_id}

**Propósito:** Atualizar status de agendamento

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Response:** Appointment completo atualizado

---

## Banco de Dados

### SQLite Configuration

```python
DATABASE_URL = "sqlite:///../alignwork.db"
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
```

**Características:**
- Arquivo `alignwork.db` na raiz do projeto
- `check_same_thread=False` necessário para FastAPI async
- Tabelas criadas automaticamente via `Base.metadata.create_all()`

### Migrações

**Atualmente:** Sem ferramenta de migração (desenvolvimento inicial)

**Futuro:** Alembic para migrações de schema

---

## Segurança

### Proteções Implementadas

1. **Senhas:**
   - Hash bcrypt (salt automático)
   - Nunca retornadas em responses
   - Validação forte (8+ chars, maiúscula, minúscula, número)

2. **Tokens JWT:**
   - Access token: 15 minutos (curto)
   - Refresh token: 7 dias (longo)
   - Tipo de token verificado (access vs refresh)
   - Armazenados em httpOnly cookies

3. **Cookies:**
   - `httpOnly`: Não acessível via JavaScript
   - `samesite=lax`: Proteção contra CSRF
   - `secure=false`: Apenas para desenvolvimento (usar true em produção)

4. **CORS:**
   - Origins específicos whitelist
   - `allow_credentials=True` para cookies

5. **Validação:**
   - Pydantic para input validation
   - Email format validation
   - SQL injection prevenido por SQLAlchemy ORM

### Melhorias Futuras

- [ ] Rate limiting
- [ ] HTTPS obrigatório em produção
- [ ] Refresh token rotation
- [ ] Token blacklist para logout
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit logs

---

## Performance

### Otimizações Implementadas

1. **Indexação:**
   - User: email, username indexados
   - Appointment: tenant_id indexado

2. **Cache Headers:**
   - `Cache-Control: no-store` em endpoints dinâmicos

3. **Connection Pooling:**
   - SQLAlchemy sessionmaker

### Monitoramento

- FastAPI /docs para testes
- Logs de console para debug
- Status codes HTTP padronizados

---

## Testes

**Status Atual:** Sem testes automatizados

**Plano Futuro:**
- pytest para testes unitários
- pytest-asyncio para testes async
- TestClient do FastAPI para testes de integração
- Coverage reports

---

## Deployment

### Desenvolvimento

```bash
uvicorn main:app --reload --port 8000
```

### Produção (Recomendado)

```bash
# Com Gunicorn + Uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Variáveis de Ambiente (Produção)

```env
SECRET_KEY=<strong-random-secret-key>
DATABASE_URL=postgresql://user:pass@host:5432/db  # Migrar para PostgreSQL
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=https://alignwork.com
```

---

## Troubleshooting

### Erro: "check_same_thread"

**Causa:** SQLite e FastAPI async

**Solução:** Adicionar `connect_args={"check_same_thread": False}` no create_engine

### Erro: "Invalid token"

**Causa:** Token expirado ou inválido

**Solução:** Usar endpoint /refresh para renovar

### Erro: "Email already registered"

**Causa:** Tentativa de criar usuário com email duplicado

**Solução:** Usar email diferente ou fazer login

---

**Última atualização:** Outubro 2025

