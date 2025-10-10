# ⚙️ AlignWork - Runbook Operacional

> **Fonte:** Consolidado de `_archive/guia-desenvolvimento.md` (seções setup e comandos)  
> **Última atualização:** Outubro 2025

---

## 🎯 Quando usar este documento

Use este documento para:
- Configurar ambiente de desenvolvimento local
- Executar o projeto pela primeira vez
- Resolver problemas de instalação e execução
- Entender comandos do dia a dia
- Debugar problemas operacionais
- Criar seeds de banco de dados

---

## 📋 Índice

- [Pré-requisitos](#pre-requisitos)
- [Instalação](#instalacao)
- [Variáveis de Ambiente](#variaveis-ambiente)
- [Execução](#execucao)
- [Comandos Úteis](#comandos-uteis)
- [Debug](#debug)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### Software Necessário

```bash
# Backend
Python 3.11+
pip

# Frontend
Node.js 18+ (recomendado: 20+)
npm ou yarn

# Opcional
Git
VS Code (recomendado)
```

### Verificar Versões

```bash
# Python
python --version

# Node e npm
node --version
npm --version

# Git
git --version
```

---

## Instalação

### Primeira Vez

#### 1. Clone o Repositório

```bash
git clone <repository-url>
cd align-work
```

#### 2. Setup do Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Ativar (Windows cmd)
venv\Scripts\activate.bat

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Voltar para raiz
cd ..
```

**Dependências do Backend (requirements.txt):**
```
fastapi==0.115.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.31
pydantic==2.8.2
pydantic[email]==2.8.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
bcrypt==4.1.3
python-dotenv==1.0.1
```

#### 3. Setup do Frontend

```bash
# Na raiz do projeto
npm install

# Ou com yarn
yarn install
```

**Principais Dependências (package.json):**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@tanstack/react-query": "^5.83.0",
    "dayjs": "^1.11.18",
    "react-hook-form": "^7.61.1",
    "zod": "^3.25.76",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^5.4.19",
    "@vitejs/plugin-react": "^4.3.4"
  }
}
```

#### 4. Configurar Variáveis de Ambiente

Ver seção [Variáveis de Ambiente](#variaveis-ambiente) abaixo.

---

## Variáveis de Ambiente

### Backend (.env)

**Arquivo:** `backend/.env`

```env
# Segurança
SECRET_KEY=your-secret-key-here-change-in-production

# Banco de Dados
DATABASE_URL=sqlite:///../alignwork.db

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend (CORS)
FRONTEND_URL=http://localhost:8080
```

**⚠️ IMPORTANTE:** Em produção, gere SECRET_KEY segura:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend (.env)

**Arquivo:** `.env` (raiz do projeto)

```env
# API URL
VITE_API_URL=http://localhost:8000
```

**Nota:** Variáveis do Vite devem começar com `VITE_` para serem expostas ao frontend.

---

## Execução

### Desenvolvimento

#### Iniciar Backend

```bash
cd backend

# Ativar venv (se ainda não ativado)
# Windows PowerShell
.\venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

**Opções úteis:**
- `--reload`: Hot reload ao modificar arquivos
- `--port 8000`: Porta (default: 8000)
- `--host 0.0.0.0`: Expor na rede local

**Saída esperada:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Iniciar Frontend

```bash
# Na raiz do projeto
npm run dev

# Ou com yarn
yarn dev
```

**Saída esperada:**
```
VITE v5.4.19  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Acessar Aplicação

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc

---

## Comandos Úteis

### Git

```bash
# Ver status
git status

# Ver diferenças
git diff

# Criar branch
git checkout -b feature/nome

# Voltar para main
git checkout main

# Atualizar branch
git pull origin main

# Desfazer alterações
git checkout -- <file>

# Reset local
git reset --hard origin/main
```

### Python/Backend

```bash
# Listar pacotes instalados
pip list

# Atualizar requirements.txt
pip freeze > requirements.txt

# Limpar cache Python
find . -type d -name "__pycache__" -exec rm -rf {} +  # Linux/Mac
Get-ChildItem -Path . -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force  # PowerShell

# Verificar código (futuro)
flake8 backend/
black backend/
mypy backend/
```

### Node/Frontend

```bash
# Listar pacotes instalados
npm list

# Adicionar pacote
npm install <package>

# Remover pacote
npm uninstall <package>

# Limpar cache
npm cache clean --force

# Build de produção
npm run build

# Preview do build
npm run preview

# Verificar tipos TypeScript
npx tsc --noEmit

# Lint (futuro)
npm run lint
```

### Banco de Dados (SQLite)

```bash
# Abrir banco
sqlite3 alignwork.db

# Ver tabelas
.tables

# Ver schema de uma tabela
.schema users

# Query
SELECT * FROM users;

# Exportar dados
.output users.sql
.dump users

# Sair
.exit
```

---

## Debug

### Backend

#### Print Debugging

```python
@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    print(f"Login attempt: {credentials.email}")
    user = db.query(User).filter(User.email == credentials.email).first()
    print(f"User found: {user is not None}")
    # ...
```

#### Python Debugger (pdb)

```python
import pdb

@router.post("/login")
async def login(...):
    pdb.set_trace()  # Breakpoint
    # ...
```

#### FastAPI Docs

Testar endpoints interativamente em `http://localhost:8000/docs`

#### Logs Estruturados

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"User {user.email} logged in")
logger.error(f"Failed to connect to database")
```

### Frontend

#### Console Logging

```typescript
const { data, isLoading } = usePatients(tenantId);
console.log('Patients data:', data);
console.log('Is loading:', isLoading);
```

#### React DevTools

- Instalar extensão React DevTools no navegador
- Inspecionar componentes e state
- Ver props e hooks

#### React Query DevTools

```typescript
// Em App.tsx (já configurado)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

#### Network Tab (Browser DevTools)

1. Abrir DevTools (F12)
2. Aba **Network**
3. Filtrar por "Fetch/XHR"
4. Verificar:
   - Request URL
   - Status code
   - Headers (cookies)
   - Request/Response body

---

## Banco de Dados

### Schema Atual

```sql
-- users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- appointments
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR NOT NULL,
    patient_id VARCHAR NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    duration_min INTEGER NOT NULL,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Criar Banco Manualmente

```bash
# Backend cria automaticamente ao iniciar
# Mas pode criar manualmente:
sqlite3 alignwork.db < schema.sql
```

### Seeds (Dados de Teste)

**Criar arquivo:** `backend/seeds.py`

```python
from sqlalchemy.orm import Session
from models.user import User, Base
from models.appointment import Appointment
from auth.utils import get_password_hash
from datetime import datetime, timedelta
import random

def seed_database(db: Session):
    # Criar usuário de teste
    user = User(
        email="admin@alignwork.com",
        username="admin",
        hashed_password=get_password_hash("Admin123"),
        full_name="Admin User",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    
    # Criar appointments de teste
    tenant_id = "default-tenant"
    patient_ids = ["patient-1", "patient-2", "patient-3"]
    
    for i in range(20):
        starts_at = datetime.utcnow() + timedelta(days=random.randint(-5, 30), hours=random.randint(8, 18))
        appointment = Appointment(
            tenant_id=tenant_id,
            patient_id=random.choice(patient_ids),
            starts_at=starts_at,
            duration_min=random.choice([30, 60, 90]),
            status=random.choice(["pending", "confirmed", "cancelled"])
        )
        db.add(appointment)
    
    db.commit()
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    from main import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
```

**Executar seeds:**
```bash
cd backend
python seeds.py
```

### Reset do Banco

```bash
# Deletar banco
rm alignwork.db

# Reiniciar backend (criará novo banco vazio)
uvicorn main:app --reload
```

---

## Testes

**Status Atual:** Sem testes automatizados (planejado)

**Plano Futuro:**

### Backend (pytest)

```bash
# Instalar dependências de teste
pip install pytest pytest-asyncio httpx

# Executar testes
pytest

# Com coverage
pytest --cov=backend --cov-report=html
```

### Frontend (Vitest + RTL)

```bash
# Instalar dependências
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Executar testes
npm run test

# Com coverage
npm run test:coverage
```

---

## Troubleshooting

### Backend não inicia

**Erro: ModuleNotFoundError**
```bash
pip install -r requirements.txt
```

**Erro: Port already in use**
```bash
# Mudar porta
uvicorn main:app --reload --port 8001

# Ou matar processo (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Erro: check_same_thread (SQLite)**

Adicionar em `main.py`:
```python
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Necessário para FastAPI async
)
```

### Frontend não compila

**Erro: Module not found**
```bash
npm install
```

**Erro: Type error**
```bash
# Verificar tsconfig.json e tipos
npx tsc --noEmit
```

**Erro: Port 8080 in use**

Editar `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000  // Mudar porta
  }
})
```

### CORS Error

**Backend:** Verificar `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Adicionar origin
    allow_credentials=True,
)
```

### Cookie não funciona

**Frontend:** Adicionar credentials:
```typescript
fetch(url, {
  credentials: 'include'  // IMPORTANTE
});
```

### Tela em branco após login / após integrar TenantProvider

**Sintoma:** Aplicação em branco, sem erros aparentes.

**Causa provável:** Ordem incorreta de providers. `AuthProvider` usa `TenantContext`, portanto o `TenantProvider` deve envolver o `AuthProvider`.

**Solução:** Em `src/App.tsx` manter a hierarquia:

```tsx
<QueryClientProvider>
  <TenantProvider>
    <AuthProvider>
      <AppProvider>
        {...}
      </AppProvider>
    </AuthProvider>
  </TenantProvider>
</QueryClientProvider>
```

### Dados “zerados” pós-login

**Verificar:**
- Chamada a `/api/auth/me` após login e no mount inicial.
- Prefetch de `/api/v1/appointments/mega-stats` e `/api/v1/appointments/summary` com `tenantId` e `tz`.
- `credentials: 'include'` ativo e URLs com prefixo `/api`.

### Confirmação de consulta (PATCH) com 404

**Possível causa:** Item apenas no estado local (id inexistente no backend) ou rota sem `/api`.

**Checklist:**
- Verificar se `/api/v1/appointments/{id}` existe e o id é persistido.
- Validar que o cliente HTTP usa `credentials: 'include'`.
- Após sucesso: invalidar `dashboardSummary`, `dashboardMegaStats` e listas do calendário.

### Hover/cursor em itens clicáveis

**Padrão:**
- Aplicar `cursor-pointer` apenas nos elementos com onClick (botões/ícones), não no card inteiro.
- Manter foco visível (`focus-visible:ring-2`) para acessibilidade.

### URLs da API incorretas (404)

**Problema:** Hooks retornam 404.

**Solução:** Verificar que todos os hooks usam URLs com prefixo `/api`:

```typescript
// ❌ ERRADO
'/v1/appointments/mega-stats'

// ✅ CORRETO
'/api/v1/appointments/mega-stats'
```

**Arquivos afetados:**
- `useDashboardMegaStats.ts`
- `useDashboardSummary.ts`
- `useMonthAppointments.ts`
- `useAppointmentMutations.ts`

### Database locked (SQLite)

```bash
# Fechar todas as conexões
# Reiniciar backend
```

---

## Performance Tips

### Backend

```python
# Usar índices
Column(String, index=True)

# Query optimization
db.query(User).options(
    joinedload(User.appointments)  # Eager loading
).all()

# Cache com Redis (futuro)
```

### Frontend

```typescript
// Memoization
const expensiveCalculation = useMemo(() => {
  return data.filter(...).map(...)
}, [data]);

// Lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Code splitting automático (Vite)
```

---

**Próximas seções:** Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para workflow de contribuição e [SECURITY.md](./SECURITY.md) para práticas de segurança.

