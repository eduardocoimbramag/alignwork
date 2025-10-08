# 🔒 AlignWork - Segurança

> **Última atualização:** Outubro 2025  
> **Responsável:** Time de Desenvolvimento

---

## 🎯 Quando usar este documento

Use este documento para:
- Entender práticas de segurança do sistema
- Reportar vulnerabilidades
- Implementar features com segurança
- Auditar código
- Preparar deploy em produção

---

## 📋 Índice

- [Autenticação](#autenticacao)
- [Autorização](#autorizacao)
- [Proteção de Dados](#protecao-de-dados)
- [Comunicação](#comunicacao)
- [Vulnerabilidades Comuns](#vulnerabilidades-comuns)
- [Boas Práticas](#boas-praticas)
- [Auditoria](#auditoria)
- [Reportar Vulnerabilidade](#reportar-vulnerabilidade)

---

## Autenticação

### JWT (JSON Web Tokens)

**Implementação Atual:**
```python
# Configuração
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Curto por segurança
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Geração
token = jwt.encode(
    {"sub": user.email, "user_id": user.id, "type": "access"},
    SECRET_KEY,
    algorithm=ALGORITHM
)
```

**Segurança:**
- ✅ Tokens de curta duração (15min)
- ✅ Refresh tokens para renovação
- ✅ SECRET_KEY forte (min 32 bytes)
- ✅ Algoritmo seguro (HS256)
- ⚠️ Futuro: Implementar token revocation list

### HttpOnly Cookies

**Implementação Atual:**
```python
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,      # ✅ Não acessível via JavaScript
    secure=False,       # ⚠️ True em produção (HTTPS)
    samesite="lax",     # ✅ Proteção CSRF
    max_age=900         # 15 minutos
)
```

**⚠️ PRODUÇÃO:** Definir `secure=True` (requer HTTPS)

### Senhas

**Hashing:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(password)
```

**Segurança:**
- ✅ bcrypt (algoritmo seguro, salt automático)
- ✅ Nunca armazena senha em texto plano
- ✅ Validação de força (min 8 chars, uppercase, lowercase, número)
- ⚠️ Futuro: Adicionar símbolos especiais à validação

**Políticas de Senha:**
```python
@validator('password')
def validate_password(cls, v):
    if len(v) < 8:
        raise ValueError('Minimum 8 characters')
    if not re.search(r'[A-Z]', v):
        raise ValueError('Must contain uppercase')
    if not re.search(r'[a-z]', v):
        raise ValueError('Must contain lowercase')
    if not re.search(r'\d', v):
        raise ValueError('Must contain number')
    return v
```

---

## Autorização

### Dependency Injection

**Implementação Atual:**
```python
def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Uso em rotas protegidas
@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user
```

### Multi-Tenancy

**Isolamento de Dados:**
```python
# ✅ Sempre filtrar por tenant_id
appointments = db.query(Appointment).filter(
    Appointment.tenant_id == tenant_id
).all()

# ❌ NUNCA fazer isso (expõe dados de outros tenants)
appointments = db.query(Appointment).all()
```

**⚠️ FUTURO:** Implementar RLS (Row-Level Security) no PostgreSQL

---

## Proteção de Dados

### Dados Sensíveis

**Nunca logar:**
```python
# ❌ ERRADO
logger.info(f"User password: {password}")

# ✅ CORRETO
logger.info(f"User {user.email} logged in")
```

**Nunca retornar:**
```json
// ❌ ERRADO
{
  "id": 1,
  "email": "user@example.com",
  "hashed_password": "$2b$12$..."  // NUNCA EXPOR
}

// ✅ CORRETO (usar Pydantic response_model)
{
  "id": 1,
  "email": "user@example.com"
}
```

### LGPD/GDPR Compliance

**Dados Pessoais Coletados:**
- Email
- Nome completo
- Telefone (futuro)
- CPF (futuro)
- Endereço (futuro)
- Dados de saúde (prontuário)

**Obrigações:**
- [ ] **Consentimento:** Termo de uso e privacidade
- [ ] **Acesso:** Usuário pode visualizar seus dados
- [ ] **Retificação:** Usuário pode editar dados
- [ ] **Exclusão:** Implementar "direito ao esquecimento"
- [ ] **Portabilidade:** Exportar dados (JSON/CSV)
- [ ] **Notificação:** Informar em caso de breach

**⚠️ TODO:** Implementar features de LGPD antes do lançamento público

---

## Comunicação

### HTTPS

**Status Atual:** HTTP (desenvolvimento)

**Produção:**
- ✅ Certificado SSL/TLS (Let's Encrypt)
- ✅ Redirecionar HTTP → HTTPS
- ✅ HSTS header
- ✅ Secure cookies

**Configuração (nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name alignwork.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### CORS

**Implementação Atual:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # ⚠️ Específico em prod
    allow_credentials=True,
    allow_methods=["*"],  # ⚠️ Restringir em prod
    allow_headers=["*"],  # ⚠️ Restringir em prod
)
```

**Produção:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alignwork.com"],  # Apenas domínios permitidos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],  # Específico
    allow_headers=["Content-Type", "Authorization"],  # Específico
)
```

---

## Vulnerabilidades Comuns

### SQL Injection

**❌ VULNERÁVEL:**
```python
# NUNCA fazer string interpolation direto
query = f"SELECT * FROM users WHERE email = '{email}'"
db.execute(query)
```

**✅ SEGURO:**
```python
# Usar ORM ou prepared statements
user = db.query(User).filter(User.email == email).first()
```

### XSS (Cross-Site Scripting)

**Proteção:**
- ✅ React escapa HTML por padrão
- ✅ Nunca usar `dangerouslySetInnerHTML` com input do usuário
- ✅ Validar inputs no backend

**❌ VULNERÁVEL:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**✅ SEGURO:**
```tsx
<div>{userInput}</div>  // React escapa automaticamente
```

### CSRF (Cross-Site Request Forgery)

**Proteção:**
- ✅ SameSite cookie attribute (`lax` ou `strict`)
- ⚠️ Futuro: CSRF tokens para forms críticos

### Clickjacking

**Proteção:**
```python
# X-Frame-Options header
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    return response
```

### Exposure of Sensitive Data

**Evitar:**
- ❌ Git commit de `.env`
- ❌ Logar senhas/tokens
- ❌ Retornar hashed_password na API
- ❌ Stack traces em produção

**Implementar:**
- ✅ `.gitignore` com `.env`
- ✅ Pydantic `response_model` (exclui campos)
- ✅ FastAPI exception handlers customizados

---

## Boas Práticas

### Backend

```python
# 1. Validação de entrada
class UserCreate(BaseModel):
    email: EmailStr  # Pydantic valida formato
    password: constr(min_length=8)  # Validação built-in

# 2. Limitar taxa de requests (futuro)
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # Max 5 tentativas por minuto
async def login(...):
    ...

# 3. Timeout de queries
db.query(User).execution_options(timeout=5).all()

# 4. Sanitização de inputs
from bleach import clean
safe_text = clean(user_input, tags=[], strip=True)
```

### Frontend

```typescript
// 1. Validação de inputs
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// 2. HTTPS only em produção
if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
  window.location.href = `https:${window.location.href.substring(window.location.protocol.length)}`;
}

// 3. Limpar storage ao logout
const logout = () => {
  queryClient.clear();
  sessionStorage.clear();
  // httpOnly cookies limpos pelo backend
};

// 4. Content Security Policy (futuro)
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" />
```

### Secrets Management

**Desenvolvimento:**
```bash
# .env (nunca commitar)
SECRET_KEY=local-dev-key-change-in-prod
```

**Produção:**
```bash
# Variáveis de ambiente (servidor)
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Ou usar serviços
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
```

---

## Auditoria

### Logs de Segurança

**Eventos a logar:**
- ✅ Login bem-sucedido
- ✅ Login falhado (email não existe)
- ✅ Login falhado (senha incorreta)
- ✅ Logout
- ✅ Criação de usuário
- ✅ Mudança de senha
- ✅ Token refresh
- ⚠️ Futuro: Alterações em dados sensíveis

**Implementação (futuro):**
```python
import logging

security_logger = logging.getLogger('security')

@router.post("/login")
def login(credentials: UserLogin, request: Request):
    ip = request.client.host
    
    # Tentativa
    security_logger.info(f"Login attempt: {credentials.email} from {ip}")
    
    if not user:
        security_logger.warning(f"Login failed: user not found - {credentials.email} from {ip}")
        raise HTTPException(401)
    
    if not verify_password(credentials.password, user.hashed_password):
        security_logger.warning(f"Login failed: wrong password - {credentials.email} from {ip}")
        raise HTTPException(401)
    
    security_logger.info(f"Login success: {user.email} from {ip}")
```

### Monitoramento

**Alertas (futuro):**
- Multiple failed login attempts (possível brute-force)
- Unusual activity patterns
- Access from unknown IPs
- Mass data exports
- Unauthorized API calls

---

## Checklist de Segurança (Produção)

**Antes do Deploy:**

### Backend
- [ ] SECRET_KEY gerada com secrets.token_urlsafe(32)
- [ ] Secure cookies (secure=True)
- [ ] HTTPS obrigatório
- [ ] CORS restrito a domínios permitidos
- [ ] Rate limiting implementado
- [ ] Logs de segurança configurados
- [ ] Database backups automáticos
- [ ] Error messages genéricos (não expor stack traces)
- [ ] Dependências atualizadas (npm audit / pip check)

### Frontend
- [ ] HTTPS obrigatório
- [ ] Content Security Policy configurado
- [ ] Secrets removidos do código
- [ ] Source maps desabilitados em produção
- [ ] Minificação e obfuscação ativadas

### Infraestrutura
- [ ] Firewall configurado
- [ ] SSH key-based authentication
- [ ] Fail2ban instalado (proteção brute-force)
- [ ] Atualizações automáticas de segurança
- [ ] Monitoramento de uptime
- [ ] Backup strategy definida

---

## Reportar Vulnerabilidade

**Se você descobrir uma vulnerabilidade de segurança:**

1. **NÃO** abra issue pública
2. **Envie email para:** security@alignwork.com (futuro)
3. **Inclua:**
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de fix (se tiver)

**Compromisso:**
- Resposta inicial em 48h
- Fix de vulnerabilidades críticas em 7 dias
- Crédito público (se desejar)

**Bug Bounty:** Planejado para o futuro

---

## Compliance

### Regulamentações

- **LGPD** (Brasil): Lei Geral de Proteção de Dados
- **GDPR** (Europa): General Data Protection Regulation
- **HIPAA** (EUA): Health Insurance Portability and Accountability Act (se expandir para EUA)

### Certificações (Futuro)

- [ ] ISO 27001 (Segurança da Informação)
- [ ] SOC 2 Type II
- [ ] LGPD Compliance Audit

---

## Recursos Adicionais

**Ferramentas:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SecurityHeaders.com](https://securityheaders.com/)

**Testes de Segurança:**
```bash
# Scan de dependências
pip-audit  # Python
npm audit  # Node

# Static analysis
bandit backend/  # Python security linter
```

---

**Próximas seções:** Ver [RUNBOOK.md](./RUNBOOK.md) para setup seguro e [API.md](./API.md) para endpoints.

