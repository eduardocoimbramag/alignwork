# 6. Remoção do Campo `username` - Especificação Técnica

**Versão:** 1.0  
**Data:** 2024  
**Status:** Planejamento  
**Autor:** Equipe de Desenvolvimento AlignWork

---

## 1. Visão Geral e Objetivo

### 1.1. Objetivo Principal
Remover completamente o campo `username` do sistema de autenticação do AlignWork, padronizando a autenticação exclusivamente por **email** e **senha**. Esta mudança simplifica o fluxo de cadastro/login, reduz complexidade de validação e elimina redundância entre `username` e `email`.

### 1.2. Justificativa
- **Redundância**: `username` e `email` são ambos identificadores únicos do usuário
- **Simplicidade**: Reduz campos obrigatórios no cadastro e complexidade de validação
- **UX**: Menos campos para o usuário preencher = maior taxa de conversão
- **Manutenibilidade**: Menos código para manter, menos pontos de falha
- **Padrão da indústria**: Autenticação por email é mais comum e esperada

### 1.3. Escopo da Mudança
- **Frontend**: Remoção de input `username` em formulários de registro/login
- **Backend**: Remoção de `username` de schemas Pydantic, modelo SQLAlchemy, rotas e lógica de autenticação
- **Banco de Dados**: Migração Alembic para dropar coluna `username` e índice associado
- **UI/UX**: Substituição de referências a `username` por `full_name` ou `email` em exibições
- **Tipos TypeScript**: Atualização de interfaces e DTOs

---

## 2. Escopo e Fora de Escopo

### 2.1. Dentro do Escopo
✅ Remoção de `username` dos formulários de registro e login  
✅ Remoção de `username` dos schemas Pydantic (`UserRegister`, `UserBase`, `UserCreate`, `UserResponse`)  
✅ Remoção de `username` do modelo SQLAlchemy `User`  
✅ Remoção de validações de `username`  
✅ Migração de banco de dados (drop de coluna e índice)  
✅ Atualização de tipos TypeScript (`User`, `RegisterData`)  
✅ Atualização de exibições de perfil/header para usar `full_name` ou `email`  
✅ Remoção de lógica de verificação de duplicidade por `username`  
✅ Atualização de rotas `/auth/register` e `/auth/me`  
✅ Compatibilidade temporária com payloads antigos (deprecation warning)

### 2.2. Fora do Escopo
❌ Migração de dados históricos de `username` para outro campo (dados serão descartados)  
❌ Criação de sistema de slugs alternativos para URLs amigáveis (se houver rotas `/users/:username`)  
❌ Alteração de políticas de senha ou rate limiting  
❌ Migração de tokens JWT existentes (tokens continuarão válidos, já usam `email` no `sub`)  
❌ Alteração de multi-tenancy ou isolamento de dados  
❌ Atualização de documentação de arquivo (`docs/_archive/*`) — apenas docs ativos

---

## 3. Inventário de Impacto (Mapeamento Completo)

Este inventário foi gerado através de busca determinística (`ripgrep`) por ocorrências de `username` (case-insensitive) em todo o repositório.

### 3.1. Frontend (React + TypeScript)

#### 3.1.1. Componentes de Formulário
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `src/components/auth/RegisterForm.tsx` | 15-17 | Schema Zod de validação (`username` obrigatório, min 3 chars, regex `[a-zA-Z0-9_]`) | **ALTO** - Remover campo e validação |
| `src/components/auth/RegisterForm.tsx` | 91-106 | Input HTML + Label + tratamento de erro | **ALTO** - Remover JSX completo |
| `src/components/auth/LoginForm.tsx` | - | Não encontrado | ✅ Sem impacto |

#### 3.1.2. Tipos TypeScript
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `src/types/auth.ts` | 4 | Interface `User`: `username: string` | **MÉDIO** - Remover campo |
| `src/types/auth.ts` | 31 | Interface `RegisterData`: `username: string` | **MÉDIO** - Remover campo |

#### 3.1.3. Serviços e Contextos
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `src/services/auth.ts` | 10 | Payload de registro: `username: name` | **ALTO** - Remover do payload |
| `src/services/auth.ts` | 36 | Fallback de nome: `user.full_name \|\| user.username` | **MÉDIO** - Ajustar para `user.full_name \|\| user.email` |
| `src/contexts/AuthContext.tsx` | 114 | Fallback no registro: `data.full_name \|\| data.username` | **MÉDIO** - Ajustar para `data.full_name` |

#### 3.1.4. Componentes de UI (Exibição)
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `src/components/Layout/Header.tsx` | 56 | Iniciais do avatar: `user?.username?.slice(0, 2)` | **BAIXO** - Já usa fallback para `'U'`, ajustar para usar `full_name` ou `email` |
| `src/components/Layout/Header.tsx` | 96 | Nome no dropdown: `user?.full_name \|\| user?.username` | **BAIXO** - Ajustar para `user?.full_name \|\| user?.email` |
| `src/pages/Profile.tsx` | 45 | Iniciais do avatar: `user?.username?.slice(0, 2)` | **BAIXO** - Ajustar para usar `full_name` ou `email` |
| `src/pages/Profile.tsx` | 104 | Exibição de nome: `user?.full_name \|\| user?.username` | **BAIXO** - Ajustar para `user?.full_name \|\| user?.email` |

#### 3.1.5. Rotas e Navegação
- **Não encontrado**: Rotas do tipo `/users/:username` ou consultas por `username` em query params.

### 3.2. Backend (FastAPI + SQLAlchemy + Pydantic)

#### 3.2.1. Modelos SQLAlchemy
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `backend/models/user.py` | 13 | Coluna `username = Column(String, unique=True, index=True, nullable=False)` | **CRÍTICO** - Remover coluna e índice via migração Alembic |

#### 3.2.2. Schemas Pydantic
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `backend/schemas/auth.py` | 7 | `UserRegister.username: str` | **ALTO** - Remover campo |
| `backend/schemas/auth.py` | 11-16 | Validador `validate_username` (min 3 chars, regex) | **ALTO** - Remover validador |
| `backend/schemas/user.py` | 7 | `UserBase.username: str` | **ALTO** - Remover campo (afeta `UserCreate` e `UserResponse`) |

#### 3.2.3. Rotas de Autenticação
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `backend/routes/auth.py` | 31 | Query de verificação de duplicidade: `(User.email == ...) \|\| (User.username == ...)` | **ALTO** - Remover verificação por `username` |
| `backend/routes/auth.py` | 43 | Exceção: `"Username already taken"` | **MÉDIO** - Remover branch de erro |
| `backend/routes/auth.py` | 49 | Criação de usuário: `username=user_data.username` | **ALTO** - Remover atribuição |
| `backend/routes/auth.py` | 207 | Resposta `/auth/me`: `"username": current_user.username` | **ALTO** - Remover do response |

#### 3.2.4. Autenticação e JWT
| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `backend/auth/utils.py` | 59-79 | `verify_token` usa `sub=email` no JWT | ✅ **SEM IMPACTO** - Já usa email |
| `backend/auth/dependencies.py` | 31 | `get_current_user` busca por `User.email == token_data["email"]` | ✅ **SEM IMPACTO** - Já usa email |
| `backend/routes/auth.py` | 59, 77, 104, 107, 158, 161 | `create_access_token`/`create_refresh_token` usam `sub=email` | ✅ **SEM IMPACTO** - Já usa email |

#### 3.2.5. OpenAPI/Documentação
- **Não encontrado**: Contratos OpenAPI explícitos em arquivos separados (FastAPI gera automaticamente)
- **Impacto**: Schemas Pydantic atualizados serão refletidos automaticamente na documentação Swagger/OpenAPI

### 3.3. Banco de Dados

#### 3.3.1. Estrutura Atual
```sql
-- Tabela users
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,  -- ⚠️ REMOVER
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    updated_at DATETIME
);

-- Índice
CREATE INDEX idx_users_username ON users(username);  -- ⚠️ REMOVER
```

#### 3.3.2. Impacto de Migração
- **Dados existentes**: Valores de `username` serão perdidos (sem backfill)
- **Constraints**: `UNIQUE` e `NOT NULL` devem ser removidos antes do drop
- **Índice**: `idx_users_username` deve ser dropado antes da coluna

### 3.4. Documentação

| Arquivo | Contexto | Impacto |
|---------|----------|---------|
| `docs/ARCHITECTURE.md` | Referências a `username` em schemas e modelos | **BAIXO** - Atualizar se necessário |
| `docs/API.md` | Exemplos de payload com `username` | **BAIXO** - Atualizar exemplos |
| `docs/_archive/*` | Documentação arquivada | ✅ **FORA DE ESCOPO** - Não atualizar |
| `docs/RUNBOOK.md` | Scripts SQL e exemplos | **BAIXO** - Atualizar apenas se scripts forem executados |

### 3.5. Testes e Scripts

| Arquivo | Linha | Contexto | Impacto |
|---------|-------|----------|---------|
| `test_rate_limit.py` | 75 | Payload de teste: `"username": f"testuser{i}_..."` | **MÉDIO** - Atualizar script de teste |

---

## 4. Alterações no Front-end

### 4.1. Formulário de Registro (`src/components/auth/RegisterForm.tsx`)

#### 4.1.1. Schema Zod
**Antes:**
```typescript
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    username: z.string()
        .min(3, 'Username deve ter pelo menos 3 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username pode conter apenas letras, números e _'),
    password: z.string()...
});
```

**Depois:**
```typescript
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string()...
    // username removido
});
```

**Ação:** Remover campo `username` e suas validações do schema.

#### 4.1.2. Input HTML
**Antes:**
```tsx
<div className="space-y-2">
    <Label htmlFor="username">Username</Label>
    <div className="relative">
        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
            id="username"
            type="text"
            placeholder="seu_username"
            className="pl-10"
            {...register('username')}
        />
    </div>
    {errors.username && (
        <p className="text-sm text-destructive">{errors.username.message}</p>
    )}
</div>
```

**Depois:** Remover completamente o bloco do input `username`.

**Ação:** Deletar o bloco `<div className="space-y-2">...</div>` que contém o input de `username` (linhas 91-106).

#### 4.1.3. Validação de Acessibilidade
- ✅ Garantir que a ordem de tabulação não seja afetada
- ✅ Manter labels e placeholders descritivos nos campos restantes

### 4.2. Formulário de Login (`src/components/auth/LoginForm.tsx`)

**Status:** ✅ **SEM IMPACTO** - O formulário de login já não possui campo `username`, apenas `email` e `password`.

### 4.3. Serviço de Autenticação (`src/services/auth.ts`)

#### 4.3.1. Função `register`
**Antes:**
```typescript
async register({ name, email, password }: {...}): Promise<UserPublic> {
    const response = await api<AuthTokens>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            username: name,  // ⚠️ REMOVER
            password,
            full_name: name
        })
    });
    return await this.me();
}
```

**Depois:**
```typescript
async register({ name, email, password }: {...}): Promise<UserPublic> {
    const response = await api<AuthTokens>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
            full_name: name
        })
    });
    return await this.me();
}
```

**Ação:** Remover `username: name` do payload JSON.

#### 4.3.2. Função `me` - Fallback de Nome
**Antes:**
```typescript
return {
    id: user.id.toString(),
    name: user.full_name || user.username,  // ⚠️ AJUSTAR
    email: user.email
};
```

**Depois:**
```typescript
return {
    id: user.id.toString(),
    name: user.full_name || user.email,  // Fallback para email se não houver full_name
    email: user.email
};
```

**Ação:** Substituir `user.username` por `user.email` no fallback.

### 4.4. AuthContext (`src/contexts/AuthContext.tsx`)

#### 4.4.1. Função `register`
**Antes:**
```typescript
const userData = await auth.register({
    name: data.full_name || data.username,  // ⚠️ AJUSTAR
    email: data.email,
    password: data.password
});
```

**Depois:**
```typescript
const userData = await auth.register({
    name: data.full_name || data.email,  // Fallback para email
    email: data.email,
    password: data.password
});
```

**Ação:** Substituir `data.username` por `data.email` no fallback (ou remover se `full_name` for obrigatório no futuro).

### 4.5. Tipos TypeScript (`src/types/auth.ts`)

#### 4.5.1. Interface `User`
**Antes:**
```typescript
export interface User {
    id: number;
    email: string;
    username: string;  // ⚠️ REMOVER
    full_name?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
}
```

**Depois:**
```typescript
export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
}
```

**Ação:** Remover `username: string;` da interface.

#### 4.5.2. Interface `RegisterData`
**Antes:**
```typescript
export interface RegisterData {
    email: string;
    username: string;  // ⚠️ REMOVER
    password: string;
    full_name?: string;
}
```

**Depois:**
```typescript
export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
}
```

**Ação:** Remover `username: string;` da interface.

### 4.6. Componentes de Exibição (UI)

#### 4.6.1. Header (`src/components/Layout/Header.tsx`)

**Função `getUserInitials`:**
- **Linha 45-56**: Atualmente usa `user?.username?.slice(0, 2)` como fallback
- **Ação:** Manter lógica de `full_name` (já é primária), remover fallback de `username` (ou usar email se necessário)

**Exibição de Nome:**
- **Linha 96**: `user?.full_name || user?.username`
- **Ação:** Substituir por `user?.full_name || user?.email`

#### 4.6.2. Página de Perfil (`src/pages/Profile.tsx`)

**Função `getUserInitials`:**
- **Linha 36-45**: Usa `user?.username?.slice(0, 2)` como fallback
- **Ação:** Ajustar para usar `full_name` (já primário) ou gerar iniciais do `email` se necessário

**Exibição de Nome:**
- **Linha 104**: `user?.full_name || user?.username`
- **Ação:** Substituir por `user?.full_name || user?.email`

### 4.7. Roteamento e Guards

**Status:** ✅ **SEM IMPACTO** - O sistema de rotas protegidas (`ProtectedRoute`) e `AuthContext` não dependem de `username`.

### 4.8. Validação de Build

Após as alterações, executar:
```bash
npm run build  # Verificar erros de TypeScript
npm run lint   # Verificar regras de linting
```

---

## 5. Alterações no Back-end (API, Auth, JWT, Rotas, OpenAPI)

### 5.1. Schemas Pydantic

#### 5.1.1. `backend/schemas/auth.py` - `UserRegister`

**Antes:**
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
```

**Depois:**
```python
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    # username removido
    # validador validate_username removido
```

**Ação:**
1. Remover campo `username: str`
2. Remover validador `validate_username` e método completo
3. Remover import de `re` se não for mais utilizado

#### 5.1.2. `backend/schemas/user.py` - `UserBase`

**Antes:**
```python
class UserBase(BaseModel):
    email: EmailStr
    username: str  # ⚠️ REMOVER
    full_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
```

**Depois:**
```python
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
```

**Impacto em cascata:**
- `UserCreate` (herda de `UserBase`) — ✅ atualizado automaticamente
- `UserResponse` (herda de `UserBase`) — ✅ atualizado automaticamente

**Ação:** Remover campo `username: str` de `UserBase`.

### 5.2. Modelo SQLAlchemy

#### 5.2.1. `backend/models/user.py` - Classe `User`

**Antes:**
```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)  # ⚠️ REMOVER
    hashed_password = Column(String, nullable=False)
    # ...
```

**Depois:**
```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # username removido
    # ...
```

**Observação:** A remoção física da coluna será feita via migração Alembic (Seção 6). Esta alteração no modelo deve acontecer **após** a migração de banco ser aplicada, ou ser gerenciada pela migração Alembic automaticamente.

**Ação:** Remover linha `username = Column(...)` do modelo após confirmação de que a migração foi aplicada.

### 5.3. Rotas de Autenticação (`backend/routes/auth.py`)

#### 5.3.1. Rota `POST /api/auth/register`

**Antes:**
```python
@router.post("/register", response_model=Token)
@limiter.limit("3/hour")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user. Rate limit: 3 registrations per hour per IP."""
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)  # ⚠️ REMOVER
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:  # ⚠️ REMOVER BRANCH
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,  # ⚠️ REMOVER
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
```

**Depois:**
```python
@router.post("/register", response_model=Token)
@limiter.limit("3/hour")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user. Rate limit: 3 registrations per hour per IP."""
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
```

**Ações:**
1. Remover `| (User.username == user_data.username)` da query de verificação
2. Remover branch `else` que trata "Username already taken"
3. Remover `username=user_data.username` da criação do `db_user`

#### 5.3.2. Rota `GET /api/auth/me`

**Antes:**
```python
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,  # ⚠️ REMOVER
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }
```

**Depois:**
```python
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }
```

**Ação:** Remover `"username": current_user.username` do response.

#### 5.3.3. Rota `POST /api/auth/login`

**Status:** ✅ **SEM IMPACTO** - A rota de login já usa apenas `email` e `password` (`UserLogin` não possui `username`).

### 5.4. Autenticação e JWT

#### 5.4.1. Geração de Token (`backend/auth/utils.py`, `backend/routes/auth.py`)

**Status:** ✅ **SEM IMPACTO** - Os tokens JWT já usam `email` no campo `sub`:
```python
access_token = create_access_token(
    data={"sub": db_user.email, "user_id": db_user.id}  # ✅ Já usa email
)
```

#### 5.4.2. Verificação de Token (`backend/auth/dependencies.py`)

**Status:** ✅ **SEM IMPACTO** - `get_current_user` já busca usuário por `email`:
```python
user = db.query(User).filter(User.email == token_data["email"]).first()
```

### 5.5. OpenAPI e Documentação Automática

**Status:** ✅ **AUTOMÁTICO** - FastAPI gera documentação OpenAPI automaticamente a partir dos schemas Pydantic. Ao remover `username` dos schemas:
- Swagger UI (`/docs`) será atualizado automaticamente
- Exemplos de request/response não incluirão mais `username`
- Schemas JSON (`/openapi.json`) refletirão a mudança

**Ação de Validação:** Após deploy, verificar `/docs` e confirmar que `UserRegister` não possui campo `username`.

### 5.6. Compatibilidade Temporária (Opcional - Ver Seção 7)

Se implementar janela de compatibilidade (aceitar `username` no payload mas ignorá-lo), adicionar lógica no `UserRegister`:

```python
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None  # Deprecated, ignorado se presente
    
    @root_validator
    def warn_deprecated_username(cls, values):
        if values.get('username'):
            import warnings
            warnings.warn("Field 'username' is deprecated and will be ignored", DeprecationWarning)
        return values
```

**Recomendação:** Para simplificar, **não implementar** compatibilidade temporária. Aceitar quebra temporária e comunicar mudança via release notes.

---

## 6. Migração de Banco de Dados (Alembic)

### 6.1. Pré-requisitos

- **Alembic configurado** no projeto (verificar `backend/alembic.ini` e `backend/alembic/versions/`)
- **Backup do banco** antes de aplicar migração
- **Ambiente de testes** para validar migração antes de produção

### 6.2. Estrutura da Migração

#### 6.2.1. Passo 1: Criar Migração Alembic

```bash
cd backend
alembic revision -m "remove_username_from_users"
```

#### 6.2.2. Passo 2: Conteúdo da Migração `upgrade()`

**Arquivo:** `backend/alembic/versions/XXXX_remove_username_from_users.py`

```python
"""remove username from users

Revision ID: XXXX
Revises: YYYY
Create Date: 2024-XX-XX

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'XXXX'
down_revision = 'YYYY'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Dropar índice primeiro (se existir)
    op.drop_index('idx_users_username', table_name='users', if_exists=True)
    
    # 2. Dropar constraint UNIQUE (SQLite não suporta DROP CONSTRAINT direto)
    #    Para SQLite, precisamos recriar a tabela ou usar workaround
    #    Alternativa: apenas dropar coluna (constraint será removida automaticamente)
    
    # 3. Dropar coluna username
    op.drop_column('users', 'username')

def downgrade():
    # Recriar coluna username (com constraints)
    op.add_column('users', 
        sa.Column('username', sa.String(), nullable=False, server_default='')
    )
    
    # Criar índice
    op.create_index('idx_users_username', 'users', ['username'], unique=True)
    
    # NOTA: server_default é temporário - dados existentes perderão username
    # Para rollback real, seria necessário ter backup dos valores de username
```

#### 6.2.3. Considerações para SQLite

SQLite tem limitações para ALTER TABLE:
- Não suporta `DROP CONSTRAINT` diretamente
- `DROP COLUMN` foi adicionado no SQLite 3.35.0+

**Verificação de versão:**
```python
import sqlite3
print(sqlite3.sqlite_version)  # Deve ser >= 3.35.0
```

**Se SQLite < 3.35.0:**
- Opção 1: Migrar para PostgreSQL/MySQL
- Opção 2: Workaround: criar nova tabela sem `username`, copiar dados, dropar antiga, renomear nova

**Workaround para SQLite antigo (exemplo):**
```python
def upgrade():
    # 1. Criar nova tabela sem username
    op.create_table('users_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        # ... outras colunas
    )
    
    # 2. Copiar dados (excluindo username)
    op.execute("""
        INSERT INTO users_new (id, email, hashed_password, full_name, is_active, is_verified, created_at, updated_at)
        SELECT id, email, hashed_password, full_name, is_active, is_verified, created_at, updated_at
        FROM users
    """)
    
    # 3. Dropar tabela antiga
    op.drop_table('users')
    
    # 4. Renomear nova tabela
    op.rename_table('users_new', 'users')
    
    # 5. Recriar índices e constraints
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
```

### 6.3. Aplicação da Migração

#### 6.3.1. Ambiente de Desenvolvimento
```bash
cd backend
alembic upgrade head
```

#### 6.3.2. Verificação Pós-Migração
```sql
-- Verificar estrutura da tabela
.schema users

-- Verificar que username não existe
SELECT sql FROM sqlite_master WHERE type='table' AND name='users';
```

### 6.4. Dados e Backfill

**Decisão:** ❌ **NÃO fazer backfill** de `username` para outro campo. Dados de `username` serão descartados.

**Justificativa:**
- `full_name` já existe e pode ser preenchido pelo usuário
- Email é identificador suficiente
- Evita complexidade e risco de dados incorretos

### 6.5. Rollback (Downgrade)

**Comando:**
```bash
alembic downgrade -1  # Voltar uma versão
```

**Limitação:** Após downgrade, valores de `username` serão vazios (`server_default=''`). Para rollback real com dados, seria necessário backup prévio de `username`.

**Recomendação:** Manter backup de `alignwork.db` antes de aplicar migração em produção.

---

## 7. Compatibilidade Temporária e Feature Flag

### 7.1. Decisão de Implementação

**Recomendação:** ❌ **NÃO implementar** janela de compatibilidade temporária para simplificar a mudança.

**Justificativa:**
- Frontend e backend serão atualizados simultaneamente
- Não há clientes externos ou versões antigas do app em produção que enviem `username`
- Menos código = menos bugs e manutenção

### 7.2. Se Implementar Compatibilidade (Opcional)

#### 7.2.1. Feature Flag
```python
# backend/.env ou config
REMOVE_USERNAME_ENABLED=false  # false durante janela de compat
```

#### 7.2.2. Schema com Campo Opcional
```python
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None  # Aceito mas ignorado
    
    @root_validator
    def deprecate_username(cls, values):
        if os.getenv('REMOVE_USERNAME_ENABLED') == 'true':
            if values.get('username'):
                raise ValueError("Field 'username' is no longer accepted")
        elif values.get('username'):
            # Log warning ou métrica
            logger.warning("Received deprecated 'username' field, ignoring")
        return values
```

**Status:** Não recomendado para este projeto.

### 7.3. Monitoramento (Se Implementar Compat)

- Log de requisições contendo `username` no payload
- Métrica: `auth.register.with_username` (contador)
- Alertar se uso > threshold após X dias

---

## 8. Segurança, LGPD e Auditoria

### 8.1. Impacto em Segurança

#### 8.1.1. Autenticação
- ✅ **Sem impacto** - JWT já usa `email` no `sub`, autenticação não depende de `username`
- ✅ **Sem impacto** - Rate limiting por IP permanece inalterado
- ✅ **Sem impacto** - Políticas de senha permanecem inalteradas

#### 8.1.2. Autorização
- ✅ **Sem impacto** - `get_current_user` busca por `email`, não por `username`
- ✅ **Sem impacto** - Multi-tenancy e isolamento de dados não dependem de `username`

### 8.2. LGPD (Lei Geral de Proteção de Dados)

#### 8.2.1. Dados Pessoais
- **`username`**: Pode ser considerado dado pessoal se identificar usuário diretamente
- **Ação:** Remover coluna `username` reduz superfície de dados pessoais armazenados
- **Backup:** Garantir que backups antigos não contenham `username` após migração (ou anonimizar)

#### 8.2.2. Logs e Auditoria
- **Verificar:** Se logs contêm `username`, considerar anonimização ou remoção
- **Exemplo:** Se `backend/routes/auth.py` loga `username`, remover do log

**Busca por logs:**
```bash
grep -r "username" backend/ --include="*.log" --include="*.py" | grep -i "log\|print\|logger"
```

### 8.3. Auditoria e Trilhas

**Status:** ✅ **Sem impacto** - Se sistema de auditoria usa `user_id` ou `email`, não será afetado.

**Verificação:** Confirmar que tabelas de auditoria não referenciam `username` como FK ou campo de busca.

---

## 9. Plano de Testes (Unit, Integração, E2E, Contratos)

### 9.1. Testes Unitários - Frontend

#### 9.1.1. Formulário de Registro
- [ ] Teste: Formulário não aceita `username` no schema Zod
- [ ] Teste: Input `username` não existe no DOM
- [ ] Teste: Validação de `email` e `password` funciona corretamente
- [ ] Teste: Erros de validação são exibidos corretamente

**Arquivo sugerido:** `src/components/auth/__tests__/RegisterForm.test.tsx` (criar se não existir)

#### 9.1.2. Serviço de Autenticação
- [ ] Teste: `auth.register()` não envia `username` no payload
- [ ] Teste: `auth.me()` trata ausência de `username` corretamente (fallback para `email`)

**Arquivo sugerido:** `src/services/__tests__/auth.test.ts` (criar se não existir)

#### 9.1.3. AuthContext
- [ ] Teste: `register()` funciona sem `username` no `RegisterData`
- [ ] Teste: Fallback de nome usa `full_name` ou `email`

### 9.2. Testes Unitários - Backend

#### 9.2.1. Schemas Pydantic
- [ ] Teste: `UserRegister` rejeita payload com `username` (se não implementar compat)
- [ ] Teste: `UserRegister` aceita payload sem `username`
- [ ] Teste: `UserBase` não possui campo `username`

**Arquivo sugerido:** `backend/tests/test_schemas.py`

```python
def test_user_register_without_username():
    data = {
        "email": "test@example.com",
        "password": "Test123!",
        "full_name": "Test User"
    }
    user = UserRegister(**data)
    assert not hasattr(user, 'username')

def test_user_register_rejects_username():
    data = {
        "email": "test@example.com",
        "password": "Test123!",
        "username": "testuser"  # Deve ser rejeitado
    }
    with pytest.raises(ValidationError):
        UserRegister(**data)
```

#### 9.2.2. Rotas de Autenticação
- [ ] Teste: `POST /api/auth/register` cria usuário sem `username`
- [ ] Teste: `POST /api/auth/register` retorna erro se `email` já existe
- [ ] Teste: `GET /api/auth/me` não retorna `username` no response
- [ ] Teste: `POST /api/auth/login` continua funcionando normalmente

**Arquivo sugerido:** `backend/tests/test_auth_routes.py`

#### 9.2.3. Modelo SQLAlchemy
- [ ] Teste: Instância de `User` não possui atributo `username`
- [ ] Teste: Query `User.email == ...` funciona corretamente

### 9.3. Testes de Integração - API

#### 9.3.1. Fluxo de Registro
```bash
# Teste: Registro sem username
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "Test123!",
    "full_name": "New User"
  }'
# Esperado: 200 OK, retorna tokens
```

#### 9.3.2. Fluxo de Login
```bash
# Teste: Login continua funcionando
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "Test123!"
  }'
# Esperado: 200 OK, retorna tokens
```

#### 9.3.3. Endpoint `/auth/me`
```bash
# Teste: Response não contém username
curl -X GET http://localhost:8000/api/auth/me \
  -H "Cookie: access_token=..."
# Esperado: JSON sem campo "username"
```

### 9.4. Testes E2E (End-to-End)

#### 9.4.1. Fluxo Completo de Cadastro
1. Acessar `/register`
2. Preencher apenas `email`, `password`, `full_name` (sem `username`)
3. Submeter formulário
4. Verificar redirecionamento para dashboard
5. Verificar que usuário está autenticado

#### 9.4.2. Fluxo Completo de Login
1. Acessar `/login`
2. Preencher `email` e `password`
3. Submeter formulário
4. Verificar redirecionamento
5. Verificar que header exibe nome (sem `username`)

#### 9.4.3. Regressões
- [ ] Logout funciona normalmente
- [ ] Refresh token funciona normalmente
- [ ] Perfil do usuário exibe informações corretas (sem `username`)
- [ ] Avatar/iniciais são geradas corretamente

**Ferramenta sugerida:** Playwright ou Cypress

### 9.5. Testes de Contratos (OpenAPI)

#### 9.5.1. Validação de Schema OpenAPI
- [ ] Gerar OpenAPI schema: `GET /openapi.json`
- [ ] Verificar que `UserRegister` não possui `username`
- [ ] Verificar que `UserResponse` (ou equivalente) não possui `username`

#### 9.5.2. Snapshot Testing (Opcional)
- [ ] Criar snapshot do schema OpenAPI antes da mudança
- [ ] Aplicar mudança
- [ ] Verificar diff no snapshot (apenas remoção de `username`)

**Ferramenta sugerida:** `pytest-openapi` ou validação manual via Swagger UI

### 9.6. Scripts de Teste Externos

#### 9.6.1. Atualizar `test_rate_limit.py`
**Arquivo:** `test_rate_limit.py` (linha 75)

**Antes:**
```python
"username": f"testuser{i}_{int(time.time())}",
```

**Depois:**
```python
# Remover linha username ou substituir por full_name se necessário
```

### 9.7. Checklist de Cobertura

- [ ] Testes unitários frontend passando
- [ ] Testes unitários backend passando
- [ ] Testes de integração API passando
- [ ] Testes E2E passando
- [ ] Validação de OpenAPI/Swagger atualizado
- [ ] Build do frontend sem erros TypeScript
- [ ] Linter sem erros

---

## 10. Observabilidade e Documentação

### 10.1. SLO/SLA

**Declaração:** A remoção de `username` **não deve degradar** latência ou taxa de erro de autenticação.

**Métricas a monitorar:**
- Latência de `POST /api/auth/register` (deve permanecer igual ou melhorar)
- Latência de `POST /api/auth/login` (deve permanecer igual)
- Taxa de erro 4xx/5xx em rotas de auth (deve permanecer igual ou melhorar)
- Taxa de sucesso de registro/login (deve permanecer igual)

**Baseline:** Medir métricas antes da mudança para comparar após deploy.

### 10.2. Logs e Métricas

#### 10.2.1. Logs de Aplicação
- **Verificar:** Se logs contêm `username`, remover ou anonimizar
- **Exemplo:** Logs de erro em `backend/routes/auth.py` não devem expor `username`

#### 10.2.2. Métricas Customizadas (Opcional)
Se implementar compatibilidade temporária:
- Contador: `auth.register.payload_with_username` (decrescente ao longo do tempo)
- Alertar se > 0 após X dias da remoção

### 10.3. Documentação Atualizada

#### 10.3.1. README / DEV-SETUP
**Arquivo:** `README.md` ou `docs/README.md`

**Atualizar:**
- Exemplos de curl/Postman não devem incluir `username`
- Schema de banco de dados atualizado (sem `username`)

#### 10.3.2. Documentação de API
**Arquivo:** `docs/API.md`

**Atualizar:**
- Exemplos de request de registro:
  ```json
  {
    "email": "user@example.com",
    "password": "Secure123!",
    "full_name": "User Name"
  }
  ```
- Remover referências a `username` em validações e exemplos

#### 10.3.3. Arquitetura
**Arquivo:** `docs/ARCHITECTURE.md`

**Atualizar:**
- Modelo `User` sem campo `username`
- Schema `UserRegister` sem `username`
- Remover menções a "email e username únicos"

### 10.4. Comunicação

#### 10.4.1. Release Notes
**Template:**
```markdown
## [Versão X.Y.Z] - Remoção de Username

### Breaking Changes
- ⚠️ Campo `username` foi removido do sistema de autenticação
- Autenticação agora usa exclusivamente **email** e **senha**
- Formulário de registro não solicita mais `username`

### Migração
- Usuários existentes: seus dados de `username` foram removidos do banco
- Novos cadastros: preencher apenas `email`, `senha` e `nome completo` (opcional)

### Impacto
- ✅ Login e registro mais simples
- ✅ Menos campos obrigatórios no cadastro
- ✅ Exibição de nome usa `nome completo` ou `email` como fallback
```

#### 10.4.2. Nota para Desenvolvedores
- Atualizar clientes de API para não enviar `username`
- Atualizar testes que usam `username`

---

## 11. Rollout e Rollback

### 11.1. Estratégia de Rollout

#### 11.1.1. Fases
1. **Desenvolvimento (Dev)**
   - Aplicar mudanças em branch `feature/remove-username`
   - Executar todos os testes
   - Validar migração Alembic em banco de dev

2. **Staging (Stage)**
   - Merge para `develop` ou `staging`
   - Deploy em ambiente de stage
   - Validar fluxos E2E
   - Verificar OpenAPI/Swagger atualizado

3. **Canary (Opcional)**
   - Se houver múltiplos ambientes, testar em subset pequeno de usuários

4. **Produção (Prod)**
   - Deploy em horário de baixo tráfego
   - Monitorar métricas (latência, erros) por 1-2 horas
   - Validar que registros/logins estão funcionando

#### 11.1.2. Ordem de Deploy
**Recomendação:** Frontend e Backend **simultaneamente** (ou backend primeiro, depois frontend imediatamente).

**Justificativa:**
- Backend quebra se receber `username` após remoção (se não houver compat)
- Frontend quebra se backend ainda espera `username`
- Deploy simultâneo evita janela de incompatibilidade

### 11.2. Validações Pós-Deploy

#### 11.2.1. Backend
- [ ] `GET /health` retorna 200
- [ ] `POST /api/auth/register` (sem `username`) retorna 200
- [ ] `POST /api/auth/login` retorna 200
- [ ] `GET /api/auth/me` não retorna `username`
- [ ] Swagger UI (`/docs`) mostra schemas sem `username`

#### 11.2.2. Frontend
- [ ] Formulário de registro não possui input `username`
- [ ] Cadastro funciona (email + senha + nome opcional)
- [ ] Login funciona normalmente
- [ ] Header/perfil exibe nome corretamente (sem `username`)

### 11.3. Rollback

#### 11.3.1. Critérios de Gatilho
Rollback imediato se:
- Taxa de erro 4xx/5xx em `/api/auth/register` ou `/api/auth/login` > 5%
- Latência p95 > baseline + 50%
- Crítico: Usuários não conseguem fazer login/cadastro

#### 11.3.2. Passos de Rollback

**Backend:**
1. Reverter deploy para versão anterior (git revert ou rollback de container)
2. Se migração Alembic foi aplicada, executar downgrade:
   ```bash
   alembic downgrade -1
   ```
3. **Atenção:** Após downgrade, `username` terá valores vazios. Se necessário, restaurar backup de banco.

**Frontend:**
1. Reverter deploy para versão anterior
2. Verificar que formulários voltam a incluir `username` (se versão anterior tinha)

**Banco de Dados:**
- **Opção 1 (Recomendada):** Restaurar backup pré-migração
- **Opção 2:** Aplicar downgrade Alembic (dados de `username` serão perdidos)

#### 11.3.3. Plano de Contingência
- Backup de `alignwork.db` antes de aplicar migração em produção
- Documentar comandos de rollback em runbook
- Ter versão anterior do código em tag git (`vX.Y.Z-pre-username-removal`)

---

## 12. Checklist Final

### 12.1. Frontend
- [ ] Campo `username` removido de `RegisterForm.tsx` (schema Zod e input HTML)
- [ ] Interface `User` atualizada (removido `username`)
- [ ] Interface `RegisterData` atualizada (removido `username`)
- [ ] `auth.register()` não envia `username` no payload
- [ ] `auth.me()` usa fallback `full_name || email` (sem `username`)
- [ ] `AuthContext.register()` ajustado (sem referência a `username`)
- [ ] `Header.tsx` ajustado (exibição de nome sem `username`)
- [ ] `Profile.tsx` ajustado (exibição de nome sem `username`)
- [ ] Build TypeScript sem erros (`npm run build`)
- [ ] Linter sem erros (`npm run lint`)

### 12.2. Backend
- [ ] Schema `UserRegister` atualizado (removido `username` e validador)
- [ ] Schema `UserBase` atualizado (removido `username`)
- [ ] Modelo `User` atualizado (removido campo `username`) — **após migração**
- [ ] Rota `POST /api/auth/register` atualizada (sem verificação/criação de `username`)
- [ ] Rota `GET /api/auth/me` atualizada (sem `username` no response)
- [ ] Validações de duplicidade atualizadas (apenas `email`)
- [ ] Migração Alembic criada e testada
- [ ] Testes unitários atualizados e passando
- [ ] Testes de integração atualizados e passando

### 12.3. Banco de Dados
- [ ] Backup de `alignwork.db` criado antes da migração
- [ ] Migração Alembic testada em ambiente de dev/stage
- [ ] Migração aplicada em produção (após validações)
- [ ] Verificação pós-migração: coluna `username` não existe
- [ ] Verificação pós-migração: índice `idx_users_username` não existe

### 12.4. Testes
- [ ] Testes unitários frontend passando
- [ ] Testes unitários backend passando
- [ ] Testes de integração API passando
- [ ] Testes E2E passando (cadastro, login, logout, perfil)
- [ ] OpenAPI/Swagger validado (sem `username`)

### 12.5. Documentação
- [ ] `docs/API.md` atualizado (exemplos sem `username`)
- [ ] `docs/ARCHITECTURE.md` atualizado (modelos sem `username`)
- [ ] README/DEV-SETUP atualizado (se houver exemplos)
- [ ] Release notes criadas

### 12.6. Observabilidade
- [ ] Métricas baseline coletadas (antes da mudança)
- [ ] Logs verificados (sem exposição de `username`)
- [ ] Monitoramento configurado para alertas de erro

### 12.7. Deploy e Rollout
- [ ] Deploy em dev validado
- [ ] Deploy em stage validado
- [ ] Deploy em produção executado
- [ ] Validações pós-deploy executadas (backend e frontend)
- [ ] Monitoramento ativo por 24-48h após deploy

### 12.8. Rollback (Preparação)
- [ ] Backup de banco criado
- [ ] Tag git de versão anterior criada
- [ ] Comandos de rollback documentados
- [ ] Plano de contingência revisado

---

## 13. Anexos

### 13.1. Comandos Úteis

#### 13.1.1. Verificação de Ocorrências
```bash
# Buscar todas as ocorrências de username (case-insensitive)
grep -ri "username" --include="*.ts" --include="*.tsx" --include="*.py" src/ backend/

# Buscar apenas em arquivos de código (excluir docs)
grep -ri "username" --include="*.ts" --include="*.tsx" --include="*.py" src/ backend/ | grep -v "docs/" | grep -v "test"
```

#### 13.1.2. Migração Alembic
```bash
# Criar migração
cd backend
alembic revision -m "remove_username_from_users"

# Aplicar migração
alembic upgrade head

# Verificar histórico
alembic history

# Rollback
alembic downgrade -1
```

#### 13.1.3. Verificação de Banco SQLite
```bash
sqlite3 alignwork.db

# Ver estrutura da tabela
.schema users

# Verificar se username existe
PRAGMA table_info(users);

# Verificar índices
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users';
```

### 13.2. Referências

- [FastAPI - Schemas](https://fastapi.tiangolo.com/tutorial/body/)
- [SQLAlchemy - Migrations](https://alembic.sqlalchemy.org/)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)

---

**Fim do Documento**

