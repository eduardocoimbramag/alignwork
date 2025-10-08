# Guia de Desenvolvimento

Este guia fornece instruções práticas para desenvolver novas features no AlignWork.

---

## Setup do Ambiente

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

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
echo "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')" > .env
echo "DATABASE_URL=sqlite:///../alignwork.db" >> .env
echo "ACCESS_TOKEN_EXPIRE_MINUTES=15" >> .env
echo "REFRESH_TOKEN_EXPIRE_DAYS=7" >> .env

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

#### 3. Setup do Frontend

```bash
# Na raiz do projeto
npm install

# Criar arquivo .env
echo "VITE_API_URL=http://localhost:8000" > .env

# Iniciar dev server
npm run dev
```

#### 4. Acessar Aplicação

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Workflow de Desenvolvimento

### 1. Criar Branch

```bash
git checkout -b feature/nome-da-feature
```

**Convenções de nome:**
- `feature/` - Nova funcionalidade
- `fix/` - Correção de bug
- `refactor/` - Refatoração de código
- `docs/` - Documentação

### 2. Desenvolver Feature

Ver seções específicas abaixo.

### 3. Testar Localmente

```bash
# Frontend
npm run dev

# Backend
uvicorn main:app --reload
```

### 4. Commit

```bash
git add .
git commit -m "feat: adiciona funcionalidade X"
```

**Convenção de mensagens:**
- `feat:` - Nova feature
- `fix:` - Bug fix
- `refactor:` - Refatoração
- `docs:` - Documentação
- `style:` - Formatação
- `test:` - Testes

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Criar PR no GitHub/GitLab.

---

## Adicionar Nova Feature

### Exemplo: Adicionar Lista de Pacientes

#### Backend

##### 1. Criar Model

**`backend/models/patient.py`**
```python
from sqlalchemy import Column, Integer, String, DateTime
from models.user import Base
from datetime import datetime

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    phone = Column(String)
    email = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

##### 2. Criar Schemas

**`backend/schemas/patient.py`**
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    cpf: str
    phone: Optional[str] = None
    email: Optional[str] = None

class PatientCreate(PatientBase):
    tenant_id: str

class PatientResponse(PatientBase):
    id: int
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

##### 3. Criar Routes

**`backend/routes/patients.py`**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from models.patient import Patient
from schemas.patient import PatientCreate, PatientResponse
from auth.dependencies import get_db

router = APIRouter(prefix="/v1/patients", tags=["patients"])

@router.get("/", response_model=List[PatientResponse])
def list_patients(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Lista todos os pacientes de um tenant."""
    patients = db.query(Patient).filter(
        Patient.tenant_id == tenant_id
    ).all()
    return patients

@router.post("/", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo paciente."""
    db_patient = Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient
```

##### 4. Registrar Router

**`backend/main.py`**
```python
from routes import auth, appointments, patients

app.include_router(patients.router, prefix="/api")
```

##### 5. Migrar Database

```python
# main.py já faz isso automaticamente
Base.metadata.create_all(bind=engine)
```

#### Frontend

##### 1. Criar Types

**`src/types/patient.ts`**
```typescript
export interface Patient {
  id: number;
  tenant_id: string;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  tenant_id: string;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
}
```

##### 2. Criar Hook

**`src/hooks/usePatients.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Patient, PatientCreate } from '@/types/patient';

export function usePatients(tenantId: string) {
  return useQuery({
    queryKey: ['patients', tenantId],
    queryFn: async () => {
      const response = await api<Patient[]>(`/v1/patients/?tenant_id=${tenantId}`);
      return response;
    }
  });
}

export function useCreatePatient(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (patient: Omit<PatientCreate, 'tenant_id'>) => {
      const response = await api<Patient>('/v1/patients/', {
        method: 'POST',
        body: JSON.stringify({ ...patient, tenant_id: tenantId })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patients', tenantId]);
    }
  });
}
```

##### 3. Criar Componente

**`src/components/Patients/PatientsList.tsx`**
```typescript
import { usePatients } from '@/hooks/usePatients';

export const PatientsList = ({ tenantId }: { tenantId: string }) => {
  const { data: patients, isLoading } = usePatients(tenantId);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Pacientes</h2>
      <ul>
        {patients?.map(patient => (
          <li key={patient.id}>
            {patient.name} - {patient.cpf}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

##### 4. Criar Página

**`src/pages/Patients.tsx`**
```typescript
import { PatientsList } from '@/components/Patients/PatientsList';
import Header from '@/components/Layout/Header';

export default function Patients() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6">
        <PatientsList tenantId="default-tenant" />
      </main>
    </div>
  );
}
```

##### 5. Adicionar Rota

**`src/App.tsx`**
```typescript
import Patients from './pages/Patients';

<Route path="/pacientes" element={
  <ProtectedRoute>
    <Patients />
  </ProtectedRoute>
} />
```

---

## Adicionar Novo Endpoint

### Exemplo: Buscar Paciente por CPF

#### Backend

**`backend/routes/patients.py`**
```python
@router.get("/{cpf}", response_model=PatientResponse)
def get_patient_by_cpf(
    cpf: str,
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Busca paciente por CPF."""
    patient = db.query(Patient).filter(
        Patient.tenant_id == tenant_id,
        Patient.cpf == cpf
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient
```

#### Frontend

**`src/hooks/usePatients.ts`**
```typescript
export function usePatient(tenantId: string, cpf: string) {
  return useQuery({
    queryKey: ['patient', tenantId, cpf],
    queryFn: async () => {
      const response = await api<Patient>(
        `/v1/patients/${cpf}?tenant_id=${tenantId}`
      );
      return response;
    },
    enabled: !!cpf  // Só busca se CPF estiver preenchido
  });
}
```

---

## Modificar Modelo Existente

### Exemplo: Adicionar Campo ao User

#### 1. Modificar Model

**`backend/models/user.py`**
```python
class User(Base):
    # ... campos existentes
    phone = Column(String, nullable=True)  # Novo campo
```

#### 2. Atualizar Schema

**`backend/schemas/user.py`**
```python
class UserBase(BaseModel):
    # ... campos existentes
    phone: Optional[str] = None  # Novo campo
```

#### 3. Migrar Database

**Opção 1: Resetar DB (apenas desenvolvimento)**
```bash
rm alignwork.db
# Reiniciar backend - tabelas serão recriadas
```

**Opção 2: Usar Alembic (produção)**
```bash
# Futuro: instalar alembic
pip install alembic

# Criar migração
alembic revision --autogenerate -m "add phone to user"

# Aplicar migração
alembic upgrade head
```

#### 4. Atualizar Frontend

**`src/types/auth.ts`**
```typescript
export interface User {
  // ... campos existentes
  phone?: string;  // Novo campo
}
```

---

## Adicionar Validação Customizada

### Backend (Pydantic)

```python
from pydantic import BaseModel, validator
import re

class PatientCreate(BaseModel):
    name: str
    cpf: str
    
    @validator('cpf')
    def validate_cpf(cls, v):
        # Remove caracteres não numéricos
        cpf = re.sub(r'\D', '', v)
        
        if len(cpf) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        
        # Validação de CPF real aqui...
        
        return cpf
```

### Frontend (Zod)

```typescript
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido').optional()
});

type PatientFormData = z.infer<typeof patientSchema>;
```

---

## Adicionar Novo Modal

### 1. Criar Componente

**`src/components/Modals/NovoPacienteModal.tsx`**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  cpf: z.string().regex(/^\d{11}$/),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NovoPacienteModal({ isOpen, onClose }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input {...form.register('name')} placeholder="Nome" />
          <Input {...form.register('cpf')} placeholder="CPF" />
          <Button type="submit">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Usar no Componente Pai

```typescript
import { useState } from 'react';
import { NovoPacienteModal } from '@/components/Modals/NovoPacienteModal';

export function Patients() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>Novo Paciente</Button>
      <NovoPacienteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
```

---

## Debugging

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

#### Python Debugger

```python
import pdb

@router.post("/login")
async def login(...):
    pdb.set_trace()  # Breakpoint
    # ...
```

#### FastAPI Docs

Testar endpoints interativamente em `http://localhost:8000/docs`

### Frontend

#### Console Logging

```typescript
const { data, isLoading } = usePatients(tenantId);
console.log('Patients data:', data);
console.log('Is loading:', isLoading);
```

#### React DevTools

- Instalar extensão React DevTools
- Inspecionar componentes e state

#### Network Tab

- Inspecionar requests HTTP
- Ver headers, body, response
- Verificar cookies

---

## Boas Práticas

### 1. Nomenclatura

**Backend:**
```python
# snake_case para variáveis e funções
user_email = "test@example.com"
def get_user_by_email(email: str):
    ...

# PascalCase para classes
class UserCreate(BaseModel):
    ...
```

**Frontend:**
```typescript
// camelCase para variáveis e funções
const userEmail = "test@example.com";
function getUserByEmail(email: string) {
  ...
}

// PascalCase para componentes e tipos
interface UserProfile { ... }
function UserCard() { ... }
```

### 2. Type Safety

**Backend:**
```python
# Sempre usar type hints
def create_user(email: str, password: str) -> User:
    ...

# Pydantic para validação
class UserCreate(BaseModel):
    email: EmailStr
    password: str
```

**Frontend:**
```typescript
// Sempre tipear
interface Props {
  userId: string;
  onSave: (user: User) => void;
}

// Evitar `any`
const data: User = await api<User>('/users/1');
```

### 3. Error Handling

**Backend:**
```python
from fastapi import HTTPException

@router.get("/{id}")
def get_user(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User {id} not found"
        )
    
    return user
```

**Frontend:**
```typescript
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    toast.success('Usuário criado!');
  },
  onError: (error: any) => {
    toast.error(error.message || 'Erro ao criar usuário');
  }
});
```

### 4. React Query Best Practices

```typescript
// Query keys consistentes
const QUERY_KEYS = {
  users: (tenantId: string) => ['users', tenantId],
  user: (id: string) => ['user', id],
};

// Invalidação específica
onSuccess: () => {
  queryClient.invalidateQueries(QUERY_KEYS.users(tenantId));
}

// Stale time apropriado
useQuery({
  queryKey: QUERY_KEYS.users(tenantId),
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,  // 5 minutos
});
```

### 5. Componentização

**Divida componentes grandes:**
```
❌ Dashboard.tsx (500 linhas)

✅ Dashboard/
  ├── Dashboard.tsx (layout, orquestração)
  ├── DashboardStats.tsx
  ├── DashboardCalendar.tsx
  └── DashboardActions.tsx
```

### 6. DRY (Don't Repeat Yourself)

**Extraia lógica repetida:**
```typescript
// ❌ Repetição
function Component1() {
  const { data } = useQuery(...);
  if (!data) return <Loader />;
  // ...
}

function Component2() {
  const { data } = useQuery(...);
  if (!data) return <Loader />;
  // ...
}

// ✅ Custom hook
function useDataWithLoader(queryKey, queryFn) {
  const { data, isLoading } = useQuery(queryKey, queryFn);
  if (isLoading) return { data: null, loader: <Loader /> };
  return { data, loader: null };
}
```

---

## Troubleshooting Comum

### Backend não inicia

```bash
# Erro: ModuleNotFoundError
pip install -r requirements.txt

# Erro: Port already in use
# Mudar porta ou matar processo
uvicorn main:app --reload --port 8001
```

### Frontend não compila

```bash
# Erro: Module not found
npm install

# Erro: Type error
# Verificar tsconfig.json e tipos
```

### CORS Error

**Backend:**
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Adicionar origin
    allow_credentials=True,
)
```

### Cookie não funciona

**Frontend:**
```typescript
// Adicionar credentials
fetch(url, {
  credentials: 'include'
});
```

### Database locked (SQLite)

```bash
# Fechar todas as conexões
# Reiniciar backend
```

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

### Python

```bash
# Listar pacotes instalados
pip list

# Atualizar requirements.txt
pip freeze > requirements.txt

# Criar migração (futuro)
alembic revision --autogenerate -m "message"
```

### Node/NPM

```bash
# Listar pacotes instalados
npm list

# Adicionar pacote
npm install <package>

# Remover pacote
npm uninstall <package>

# Limpar cache
npm cache clean --force
```

### Database

```bash
# Abrir SQLite
sqlite3 alignwork.db

# Ver tabelas
.tables

# Ver schema
.schema users

# Query
SELECT * FROM users;

# Sair
.exit
```

---

## Recursos Úteis

### Documentação

- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **React Query:** https://tanstack.com/query/latest
- **Pydantic:** https://docs.pydantic.dev/
- **SQLAlchemy:** https://docs.sqlalchemy.org/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/

### Ferramentas

- **VS Code Extensions:**
  - Python
  - Pylance
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

### Comunidades

- **Discord:** FastAPI, React
- **Stack Overflow**
- **GitHub Discussions**

---

**Última atualização:** Outubro 2025

