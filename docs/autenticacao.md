# Autenticação e Segurança

## Visão Geral

O AlignWork implementa um sistema de autenticação robusto baseado em JWT (JSON Web Tokens) com armazenamento em httpOnly cookies para máxima segurança. O sistema protege contra ataques comuns como XSS, CSRF e garante que tokens não sejam acessíveis via JavaScript.

---

## Arquitetura de Autenticação

### Fluxo Completo

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
       │                        │                        │
       │                        │  3. User Data          │
       │                        │<───────────────────────┤
       │                        │                        │
       │                        │  4. Verify Password    │
       │                        │     (bcrypt)           │
       │                        │                        │
       │                        │  5. Generate Tokens    │
       │                        │     - Access (15min)   │
       │                        │     - Refresh (7days)  │
       │                        │                        │
       │  6. Set HttpOnly       │                        │
       │     Cookies + JSON     │                        │
       │<───────────────────────┤                        │
       │                        │                        │
       │  7. GET /auth/me       │                        │
       ├───────────────────────>│                        │
       │  Cookie: access_token  │                        │
       │                        │  8. Verify JWT         │
       │                        │                        │
       │                        │  9. Query User         │
       │                        ├───────────────────────>│
       │                        │                        │
       │  10. User Data         │                        │
       │<───────────────────────┤                        │
       │                        │                        │
```

---

## JWT Tokens

### Estrutura dos Tokens

#### Access Token (15 minutos)

```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "type": "access",
  "exp": 1696512000
}
```

**Campos:**
- `sub`: Subject (email do usuário)
- `user_id`: ID do usuário no banco
- `type`: "access" (para diferenciar de refresh)
- `exp`: Timestamp de expiração

#### Refresh Token (7 dias)

```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "type": "refresh",
  "exp": 1697116800
}
```

**Campos:**
- Mesma estrutura do access token
- `type`: "refresh"
- `exp`: Expiração muito mais longa

---

## Backend - Implementação

### Hash de Senhas (bcrypt)

**Arquivo:** `backend/auth/utils.py`

#### Geração de Hash

```python
import bcrypt

def get_password_hash(password: str) -> str:
    """
    Gera hash bcrypt da senha.
    
    - Salt gerado automaticamente
    - Custo padrão (14 rounds)
    - Retorna string base64
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
```

**Exemplo:**
```python
password = "SecurePass123"
hashed = get_password_hash(password)
# Output: "$2b$12$KIXQQz5J4vZr9kZr5vZr5O..."
```

#### Verificação de Senha

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se senha corresponde ao hash.
    
    - Constant-time comparison
    - Proteção contra timing attacks
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        # Fallback para compatibilidade com hashes antigos (SHA256)
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
```

### Geração de Tokens JWT

**Arquivo:** `backend/auth/utils.py`

#### Configuração

```python
import os
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

⚠️ **IMPORTANTE:** Em produção, `SECRET_KEY` deve ser uma string aleatória forte:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Criar Access Token

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Cria token JWT de acesso.
    
    Args:
        data: Payload do token (email, user_id)
        expires_delta: Tempo customizado de expiração
    
    Returns:
        String JWT codificada
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

#### Criar Refresh Token

```python
def create_refresh_token(data: dict):
    """
    Cria token JWT de refresh.
    
    - Expiração longa (7 dias)
    - Usado apenas para renovar access token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

#### Verificar Token

```python
from jose import JWTError

def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verifica e decodifica JWT token.
    
    Args:
        token: String JWT
        token_type: "access" ou "refresh"
    
    Returns:
        Payload do token (email, user_id)
    
    Raises:
        HTTPException: Token inválido ou expirado
    """
    try:
        # Decodifica token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extrai dados
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        token_type_from_payload: str = payload.get("type")
        
        # Validações
        if email is None or user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing claims"
            )
        
        # Verifica tipo de token
        if token_type_from_payload != token_type:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token type. Expected {token_type}, got {token_type_from_payload}"
            )
        
        return {"email": email, "user_id": user_id}
        
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Could not validate credentials: {str(e)}"
        )
```

### Dependências FastAPI

**Arquivo:** `backend/auth/dependencies.py`

#### get_current_user

```python
from fastapi import Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
from typing import Optional

def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência para obter usuário autenticado.
    
    - Lê token do cookie httpOnly
    - Verifica validade do token
    - Busca usuário no banco
    - Valida status ativo
    
    Uso:
        @app.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            return {"user": user.email}
    """
    # Verifica presença do cookie
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Verifica token
        token_data = verify_token(access_token, "access")
        
        # Busca usuário
        user = db.query(User).filter(User.email == token_data["email"]).first()
        
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )
        
        # Valida status
        if not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="Inactive user"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )
```

### Rotas de Autenticação

**Arquivo:** `backend/routes/auth.py`

#### POST /auth/register

```python
@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registra novo usuário.
    
    Validações:
    - Email único
    - Username único
    - Senha forte (8+ chars, maiúscula, minúscula, número)
    
    Retorna tokens JWT
    """
    # Verifica duplicatas
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash da senha
    hashed_password = get_password_hash(user_data.password)
    
    # Cria usuário
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Gera tokens
    access_token = create_access_token(
        data={"sub": db_user.email, "user_id": db_user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": db_user.email, "user_id": db_user.id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

#### POST /auth/login

```python
@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Autentica usuário.
    
    - Verifica email e senha
    - Define cookies httpOnly
    - Retorna tokens
    """
    # Busca usuário
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    # Verifica credenciais
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verifica status
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Gera tokens
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    # Define cookies httpOnly
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # True em produção com HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 dias
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

#### POST /auth/refresh

```python
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: Optional[str] = Cookie(None),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """
    Renova access token usando refresh token.
    
    - Lê refresh token do cookie
    - Valida token
    - Gera novos tokens
    - Atualiza cookies
    """
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found"
        )
    
    try:
        # Verifica refresh token
        token_data = verify_token(refresh_token, "refresh")
        
        # Busca usuário
        user = db.query(User).filter(User.email == token_data["email"]).first()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Gera novos tokens
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": user.email, "user_id": user.id}
        )
        
        # Atualiza cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

#### POST /auth/logout

```python
@router.post("/logout")
async def logout(response: Response):
    """
    Desloga usuário limpando cookies.
    """
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out"}
```

#### GET /auth/me

```python
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Retorna informações do usuário autenticado.
    
    Rota protegida - requer access token válido.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }
```

---

## Frontend - Implementação

### AuthContext

**Arquivo:** `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação na inicialização
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await auth.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const userData = await auth.login(credentials);
    setUser(userData);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  // ... outras funções

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, /* ... */ }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Serviço de Autenticação

**Arquivo:** `src/services/auth.ts`

```typescript
export const auth = {
  async login({ email, password }: LoginCredentials): Promise<UserPublic> {
    // Faz login
    await api<AuthTokens>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Tokens já estão em cookies httpOnly
    // Busca dados do usuário
    return await this.me();
  },

  async me(): Promise<UserPublic> {
    // Cookie enviado automaticamente
    const user = await api<User>('/api/auth/me');
    
    return {
      id: user.id.toString(),
      name: user.full_name || user.username,
      email: user.email
    };
  },

  async logout(): Promise<void> {
    await api('/api/auth/logout', {
      method: 'POST'
    });
    // Cookies limpos pelo backend
  }
};
```

### ProtectedRoute

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

```typescript
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para login, salvando rota original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**Uso:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## HttpOnly Cookies

### O que são?

Cookies httpOnly são cookies que:
- **NÃO** podem ser acessados via JavaScript (`document.cookie`)
- Protegem contra ataques XSS (Cross-Site Scripting)
- São enviados automaticamente pelo browser em requests

### Configuração

#### Backend (FastAPI)

```python
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,        # Cookie não acessível via JS
    secure=True,          # Apenas HTTPS (produção)
    samesite="lax",       # Proteção CSRF
    max_age=900           # 15 minutos em segundos
)
```

#### Frontend (fetch/axios)

```typescript
const response = await fetch(url, {
  credentials: 'include',  // Envia cookies automaticamente
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Vantagens

1. **Segurança XSS**: JavaScript malicioso não pode roubar tokens
2. **Automático**: Browser gerencia envio/recebimento
3. **Expiração**: Browser respeita `max-age` automaticamente

### Desvantagens

1. **CORS complexo**: Requer configuração específica
2. **Mobile apps**: Mais difícil de implementar
3. **Debug**: Não visível via `console.log`

---

## Segurança

### Proteções Implementadas

#### 1. Senha Forte

**Validação Pydantic:**
```python
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

**Requisitos:**
- Mínimo 8 caracteres
- 1 letra maiúscula
- 1 letra minúscula
- 1 número

#### 2. Hash bcrypt

- **Salt automático**: Cada senha tem salt único
- **Custo adaptativo**: Pode aumentar em hardware mais rápido
- **Constant-time comparison**: Proteção contra timing attacks

#### 3. Token Expiration

- **Access token**: 15 minutos (curto para minimizar janela de ataque)
- **Refresh token**: 7 dias (longo para conveniência)

#### 4. Token Type Validation

```python
# Backend valida tipo do token
if token_type_from_payload != token_type:
    raise HTTPException(401, detail="Invalid token type")
```

Previne uso de refresh token como access token e vice-versa.

#### 5. CORS Configurado

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Whitelist específico
    allow_credentials=True,  # Necessário para cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 6. SameSite Cookie

```python
samesite="lax"  # Proteção contra CSRF
```

- `strict`: Não envia em navegação externa
- `lax`: Envia em navegação GET externa (recomendado)
- `none`: Envia sempre (requer `secure=True`)

---

## Fluxos Completos

### Fluxo de Registro

```
1. Usuário preenche formulário
   ↓
2. Frontend valida dados (Zod)
   ↓
3. POST /api/auth/register
   {email, username, password, full_name}
   ↓
4. Backend:
   - Valida dados (Pydantic)
   - Verifica duplicatas
   - Hash senha (bcrypt)
   - Cria usuário no DB
   - Gera tokens JWT
   ↓
5. Response com tokens
   {access_token, refresh_token, token_type}
   ↓
6. Frontend:
   - Chama GET /api/auth/me
   - Salva dados do usuário no estado
   - Redireciona para /dashboard
```

### Fluxo de Login

```
1. Usuário preenche email/senha
   ↓
2. POST /api/auth/login
   {email, password}
   ↓
3. Backend:
   - Busca usuário por email
   - Verifica senha com bcrypt
   - Gera tokens JWT
   - Define cookies httpOnly
   ↓
4. Response:
   - Cookies: access_token, refresh_token
   - JSON: {access_token, refresh_token, token_type}
   ↓
5. Frontend:
   - Chama GET /api/auth/me
   - Salva dados do usuário
   - Redireciona para /dashboard
```

### Fluxo de Requisição Autenticada

```
1. Frontend faz request
   GET /api/v1/appointments/summary
   ↓
2. Browser envia cookie automaticamente
   Cookie: access_token=eyJ...
   ↓
3. Backend:
   - Extrai cookie via Depends(get_current_user)
   - Verifica JWT
   - Busca usuário no DB
   - Valida status ativo
   ↓
4. Continua processamento da request
   ↓
5. Response com dados
```

### Fluxo de Refresh Token

```
1. Access token expira (15min)
   ↓
2. Request falha com 401
   ↓
3. Frontend detecta 401
   ↓
4. Chama POST /api/auth/refresh
   Cookie: refresh_token=eyJ...
   ↓
5. Backend:
   - Verifica refresh token
   - Gera novos access e refresh tokens
   - Atualiza cookies
   ↓
6. Response com novos tokens
   ↓
7. Frontend:
   - Atualiza estado do usuário
   - Retenta request original
```

### Fluxo de Logout

```
1. Usuário clica em "Sair"
   ↓
2. POST /api/auth/logout
   ↓
3. Backend:
   - Remove cookies (delete_cookie)
   ↓
4. Response: {message: "Successfully logged out"}
   ↓
5. Frontend:
   - Limpa estado do usuário
   - Redireciona para /login
```

---

## Melhorias Futuras

### 1. Refresh Token Rotation

**Problema:** Refresh token roubado pode ser usado indefinidamente

**Solução:** Token rotation
```python
# Ao usar refresh token:
# 1. Invalida o refresh token usado
# 2. Gera novo par de tokens (access + refresh)
# 3. Armazena hash do novo refresh token no DB
```

### 2. Token Blacklist

**Problema:** Logout não invalida tokens existentes

**Solução:** Blacklist no Redis
```python
# Ao fazer logout:
# 1. Adiciona token ao Redis com TTL = tempo restante do token
# 2. Em cada request, verifica se token está na blacklist
```

### 3. Two-Factor Authentication (2FA)

```python
# Fluxo de login com 2FA:
# 1. Verifica email/senha
# 2. Envia código via email/SMS
# 3. Usuário insere código
# 4. Valida código
# 5. Gera tokens
```

### 4. Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/minute")  # Máximo 5 tentativas por minuto
async def login(...):
    ...
```

### 5. Account Lockout

```python
# Após N tentativas falhas:
# 1. Incrementa contador no DB
# 2. Se contador > N (ex: 5):
#    - Bloqueia conta temporariamente (15min)
#    - Envia email de alerta
```

### 6. Audit Logs

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # "login", "logout", "password_change"
    ip_address = Column(String)
    user_agent = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
```

### 7. OAuth2 (Google, Facebook)

```python
from authlib.integrations.fastapi_client import OAuth

oauth = OAuth()
oauth.register(
    name='google',
    client_id='...',
    client_secret='...',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)
```

---

## Troubleshooting

### Erro: "Invalid token"

**Causas:**
1. Token expirado
2. Token malformado
3. SECRET_KEY diferente entre backend e token

**Solução:**
1. Usar endpoint /refresh
2. Verificar SECRET_KEY no .env
3. Fazer logout e login novamente

### Erro: "Not authenticated"

**Causas:**
1. Cookie não está sendo enviado
2. CORS mal configurado

**Solução:**
```typescript
// Frontend: Adicionar credentials
fetch(url, {
  credentials: 'include'
});

// Backend: Configurar CORS
allow_credentials=True
```

### Erro: "CORS policy"

**Solução:**
```python
# Backend: Adicionar origin do frontend
allow_origins=["http://localhost:8080"]
allow_credentials=True
```

### Cookie não persiste após reload

**Causas:**
1. `secure: true` sem HTTPS
2. `samesite: strict` muito restritivo

**Solução:**
```python
# Desenvolvimento
secure=False
samesite="lax"

# Produção
secure=True  # Com HTTPS
samesite="lax"
```

---

**Última atualização:** Outubro 2025

