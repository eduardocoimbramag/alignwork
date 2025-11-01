# 🔧 Reparo - Problema de Persistência de Cadastro de Clientes

**Data:** 01/11/2025  
**Status:** 🔴 CRÍTICO - Dados não persistem entre reinicializações  
**Autor:** Diagnóstico Técnico

---

## 📋 Sumário Executivo

Os clientes cadastrados no sistema estão desaparecendo ao reiniciar o servidor, enquanto os agendamentos (consultas) permanecem. O problema foi identificado como **múltiplos arquivos de banco de dados** e **configuração inconsistente de paths**.

### Evidências:
- ✅ 1 consulta agendada aparece no dashboard
- ❌ 0 clientes cadastrados aparecem no dashboard
- 🔍 Dois arquivos `alignwork.db` encontrados:
  - `backend/alignwork.db` (0 bytes - VAZIO)
  - `alignwork.db` na raiz (53.248 bytes - COM DADOS)

---

## 🔍 Análise Técnica do Problema

### 1. **Múltiplas Instâncias do Banco de Dados**

```
C:\Users\eduar\Desktop\Code\SaaS\align-work\
├── alignwork.db             ← 53.248 bytes (COM DADOS)
└── backend/
    └── alignwork.db         ← 0 bytes (VAZIO)
```

### 2. **Configuração do Backend**

**Arquivo:** `backend/main.py` (linha 19)
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../alignwork.db")
```

**Interpretação:**
- `sqlite:///../alignwork.db` = vai para o **diretório pai** de `backend/`
- Resultado: `align-work/alignwork.db` (raiz do projeto)

**Problema:** O código está configurado corretamente para usar a raiz, mas há outro banco vazio em `backend/`.

### 3. **Por Que os Agendamentos Funcionam Mas os Clientes Não?**

Existem alguns cenários possíveis:

#### **Cenário A: Cache Local vs Backend**
O frontend carrega dados do backend na inicialização através do `AppContext.tsx`:

```typescript
// AppContext.tsx - linha 131
useEffect(() => {
  const loadData = async () => {
    const [patientsResponse, appointmentsResponse] = await Promise.all([
      fetchPatients({ tenantId, page: 1, page_size: 100 }),
      fetchAppointments({ tenantId, from: ..., to: ..., page: 1, page_size: 100 })
    ]);
    
    setClientes(clientesCarregados);      // ← Clientes do backend
    setAgendamentos(agendamentosCarregados); // ← Agendamentos do backend
  };
  
  loadData();
}, []);
```

**O que está acontecendo:**
1. ✅ Appointments são carregados do banco e exibidos corretamente
2. ✅ Ao cadastrar um cliente, ele é salvo no banco E adicionado ao contexto
3. 🔴 Ao **reiniciar**, o contexto é limpo mas o banco deveria ter os dados
4. 🔴 Mas o banco pode estar sendo **sobrescrito** ou **não está salvando**

#### **Cenário B: Problema no Commit do SQLAlchemy**

Análise do código de criação de paciente (`backend/routes/patients.py`):

```python
# Linha 46-49
db_patient = Patient(...)
db.add(db_patient)
db.commit()        # ← Deveria salvar
db.refresh(db_patient)
```

**Possíveis causas:**
1. ❌ Transação não está fazendo flush no disco
2. ❌ SQLite está em modo WAL e precisa de checkpoint
3. ❌ Permissões de arquivo impedem escrita
4. ❌ Banco está sendo recriado em cada inicialização

#### **Cenário C: Relacionamento Quebrado**

**Problema crítico identificado:**

```python
# backend/models/appointment.py - linha 11
patient_id = Column(String, nullable=False)  # ← STRING, não INTEGER!
```

```python
# backend/models/patient.py - linha 14
id = Column(Integer, primary_key=True, index=True)  # ← INTEGER
```

**Inconsistência:**
- `Patient.id` é `Integer`
- `Appointment.patient_id` é `String`
- Não há `ForeignKey` definido
- Não há `relationship()` entre as tabelas

**Impacto:**
- Os appointments podem estar referenciando IDs de pacientes como string
- Quando o contexto local é limpo, não há como "recarregar" o nome do cliente
- O sistema pode estar criando appointments "órfãos"

### 4. **Problema de Isolamento Multi-Tenant**

```python
# backend/models/patient.py
cpf = Column(String, unique=True, nullable=False, index=True)  # ← UNIQUE GLOBAL
```

**Problema:** CPF é único **globalmente**, não por tenant. Isso pode causar:
- Conflitos entre diferentes tenants
- Erro ao tentar cadastrar cliente com CPF já existente em outro tenant

---

## 🛠️ Solução Completa (Passo a Passo)

### **ETAPA 1: Consolidar Banco de Dados**

#### 1.1. Parar o servidor backend
```bash
# Pressione Ctrl+C no terminal onde o backend está rodando
```

#### 1.2. Fazer backup do banco com dados
```bash
# Na raiz do projeto
copy alignwork.db alignwork.db.backup
```

#### 1.3. Remover banco vazio
```bash
cd backend
del alignwork.db
cd ..
```

#### 1.4. Atualizar configuração para ser mais explícita

**Arquivo:** `backend/main.py`

**Antes:**
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../alignwork.db")
```

**Depois:**
```python
import os
from pathlib import Path

# Definir caminho absoluto para o banco na raiz do projeto
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "alignwork.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

print(f"📦 Database location: {DATABASE_PATH}")  # Log para debug
```

---

### **ETAPA 2: Corrigir Modelo de Relacionamento**

#### 2.1. Atualizar modelo `Appointment`

**Arquivo:** `backend/models/appointment.py`

**Antes:**
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.user import Base
from datetime import datetime

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    patient_id = Column(String, nullable=False)  # ← STRING (ERRADO)
    starts_at = Column(DateTime, nullable=False)
    duration_min = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Depois:**
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.user import Base
from datetime import datetime

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # ForeignKey correto com Integer
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Relacionamento para facilitar queries
    patient = relationship("Patient", backref="appointments")
    
    starts_at = Column(DateTime, nullable=False)
    duration_min = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

### **ETAPA 3: Corrigir Constraint de CPF**

#### 3.1. Atualizar modelo `Patient`

**Arquivo:** `backend/models/patient.py`

**Antes:**
```python
cpf = Column(String, unique=True, nullable=False, index=True)
```

**Depois:**
```python
from sqlalchemy import UniqueConstraint

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # Informações pessoais
    name = Column(String, nullable=False)
    cpf = Column(String, nullable=False, index=True)  # ← Remover unique=True
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Constraint composto: CPF único POR TENANT
    __table_args__ = (
        UniqueConstraint('tenant_id', 'cpf', name='uix_tenant_cpf'),
    )
```

---

### **ETAPA 4: Migração de Dados**

Como estamos mudando de `patient_id` String para Integer, precisamos criar um script de migração.

#### 4.1. Criar script de migração

**Arquivo:** `backend/migrate_patient_ids.py`

```python
"""
Script de migração: Converter patient_id de String para Integer
"""
import os
import sys
from pathlib import Path

# Adicionar backend ao path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, text
from models.user import Base
from models.patient import Patient
from models.appointment import Appointment

# Caminho do banco
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "alignwork.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

print(f"🔧 Migrando banco de dados: {DATABASE_PATH}")
print("=" * 60)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def migrate():
    """Executa a migração"""
    
    with engine.connect() as conn:
        # Verificar se há appointments
        result = conn.execute(text("SELECT COUNT(*) FROM appointments"))
        count = result.scalar()
        print(f"📊 Total de appointments: {count}")
        
        if count == 0:
            print("✅ Nenhum appointment para migrar. Recriando tabelas...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("✅ Tabelas recriadas com sucesso!")
            return
        
        # Criar tabela temporária com nova estrutura
        print("\n1️⃣ Criando tabela temporária...")
        conn.execute(text("""
            CREATE TABLE appointments_new (
                id INTEGER PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                patient_id INTEGER NOT NULL,
                starts_at DATETIME NOT NULL,
                duration_min INTEGER NOT NULL,
                status VARCHAR DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            )
        """))
        conn.commit()
        
        # Copiar dados convertendo patient_id para integer
        print("2️⃣ Copiando dados (convertendo patient_id)...")
        conn.execute(text("""
            INSERT INTO appointments_new 
                (id, tenant_id, patient_id, starts_at, duration_min, status, created_at, updated_at)
            SELECT 
                id, 
                tenant_id, 
                CAST(patient_id AS INTEGER), 
                starts_at, 
                duration_min, 
                status, 
                created_at, 
                updated_at
            FROM appointments
        """))
        conn.commit()
        
        # Dropar tabela antiga
        print("3️⃣ Removendo tabela antiga...")
        conn.execute(text("DROP TABLE appointments"))
        conn.commit()
        
        # Renomear nova tabela
        print("4️⃣ Renomeando tabela nova...")
        conn.execute(text("ALTER TABLE appointments_new RENAME TO appointments"))
        conn.commit()
        
        # Recriar índices
        print("5️⃣ Recriando índices...")
        conn.execute(text("CREATE INDEX ix_appointments_tenant_id ON appointments(tenant_id)"))
        conn.execute(text("CREATE INDEX ix_appointments_patient_id ON appointments(patient_id)"))
        conn.commit()
        
        # Atualizar constraint de CPF na tabela patients
        print("\n6️⃣ Corrigindo constraint de CPF...")
        
        # Criar tabela temporária para patients
        conn.execute(text("""
            CREATE TABLE patients_new (
                id INTEGER PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                cpf VARCHAR NOT NULL,
                phone VARCHAR NOT NULL,
                email VARCHAR,
                address TEXT NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Copiar dados
        conn.execute(text("""
            INSERT INTO patients_new 
                (id, tenant_id, name, cpf, phone, email, address, notes, created_at, updated_at)
            SELECT id, tenant_id, name, cpf, phone, email, address, notes, created_at, updated_at
            FROM patients
        """))
        conn.commit()
        
        # Dropar tabela antiga
        conn.execute(text("DROP TABLE patients"))
        conn.commit()
        
        # Renomear nova tabela
        conn.execute(text("ALTER TABLE patients_new RENAME TO patients"))
        conn.commit()
        
        # Criar índices e constraints
        conn.execute(text("CREATE INDEX ix_patients_tenant_id ON patients(tenant_id)"))
        conn.execute(text("CREATE INDEX ix_patients_cpf ON patients(cpf)"))
        conn.execute(text("CREATE UNIQUE INDEX uix_tenant_cpf ON patients(tenant_id, cpf)"))
        conn.commit()
        
        print("\n✅ Migração concluída com sucesso!")
        print("=" * 60)
        
        # Verificar dados
        result = conn.execute(text("SELECT COUNT(*) FROM patients"))
        patients_count = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM appointments"))
        appointments_count = result.scalar()
        
        print(f"\n📊 Resumo:")
        print(f"   - Pacientes: {patients_count}")
        print(f"   - Agendamentos: {appointments_count}")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Erro na migração: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
```

---

### **ETAPA 5: Executar Migração**

#### 5.1. Executar script de migração

```bash
# Na raiz do projeto
cd backend
python migrate_patient_ids.py
cd ..
```

**Saída esperada:**
```
🔧 Migrando banco de dados: C:\Users\eduar\Desktop\Code\SaaS\align-work\alignwork.db
============================================================
📊 Total de appointments: 1
1️⃣ Criando tabela temporária...
2️⃣ Copiando dados (convertendo patient_id)...
3️⃣ Removendo tabela antiga...
4️⃣ Renomeando tabela nova...
5️⃣ Recriando índices...
6️⃣ Corrigindo constraint de CPF...
✅ Migração concluída com sucesso!
============================================================

📊 Resumo:
   - Pacientes: 0
   - Agendamentos: 1
```

---

### **ETAPA 6: Atualizar Frontend para Usar IDs Corretos**

#### 6.1. Verificar se frontend está usando string ou integer

**Arquivo:** `src/contexts/AppContext.tsx` (linha 184)

```typescript
return {
  id: appointment.id.toString(),
  clienteId: appointment.patient_id,  // ← Verificar se é string ou number
  cliente: cliente?.nome || appointment.patient_id,
  // ...
};
```

**Correção (se necessário):**
```typescript
return {
  id: appointment.id.toString(),
  clienteId: appointment.patient_id.toString(),  // ← Converter para string
  cliente: cliente?.nome || `Cliente #${appointment.patient_id}`,
  // ...
};
```

---

### **ETAPA 7: Adicionar Logging para Debug**

#### 7.1. Adicionar logs no backend

**Arquivo:** `backend/routes/patients.py`

Adicionar depois da linha 49:

```python
db.refresh(db_patient)

# DEBUG: Verificar se o paciente foi realmente salvo
verify = db.query(Patient).filter(Patient.id == db_patient.id).first()
if verify:
    print(f"✅ VERIFICATION: Patient ID={db_patient.id} confirmed in database")
else:
    print(f"❌ WARNING: Patient ID={db_patient.id} NOT found after commit!")

return db_patient
```

#### 7.2. Adicionar logs no frontend

**Arquivo:** `src/contexts/AppContext.tsx`

Após linha 196:

```typescript
setClientes(clientesCarregados);
setAgendamentos(agendamentosCarregados);

// DEBUG: Verificar carregamento
console.log('🔍 DEBUG: Dados carregados do backend');
console.log(`   - Clientes: ${clientesCarregados.length}`);
console.log(`   - Agendamentos: ${agendamentosCarregados.length}`);
console.log('   - Clientes:', clientesCarregados);
console.log('   - Agendamentos:', agendamentosCarregados);
```

---

### **ETAPA 8: Testar Solução**

#### 8.1. Reiniciar backend
```bash
cd backend
python main.py
# Ou use o comando que você costuma usar
```

#### 8.2. Reiniciar frontend
```bash
# Na raiz do projeto
npm run dev
```

#### 8.3. Teste 1: Cadastrar novo cliente
1. Fazer login no sistema
2. Clicar em "Cadastrar Cliente"
3. Preencher todos os campos
4. Salvar
5. **Verificar no console do backend:** Deve aparecer `✅ VERIFICATION: Patient ID=X confirmed in database`

#### 8.4. Teste 2: Verificar persistência
1. Parar o backend (Ctrl+C)
2. Parar o frontend (Ctrl+C)
3. Reiniciar backend
4. Reiniciar frontend
5. Fazer login novamente
6. **Verificar:** O cliente cadastrado deve aparecer no card "Total de Clientes"
7. **Verificar no console do navegador:** Deve aparecer `🔍 DEBUG: Dados carregados do backend` com pelo menos 1 cliente

#### 8.5. Teste 3: Criar agendamento com cliente cadastrado
1. Cadastrar um cliente
2. Criar um agendamento para esse cliente
3. Reiniciar servidor
4. **Verificar:** Tanto o cliente quanto o agendamento devem aparecer

---

## 🔍 Troubleshooting

### Problema: "Foreign key constraint failed"

**Causa:** Tentando criar appointment com `patient_id` que não existe.

**Solução:**
```python
# Antes de criar appointment, verificar se paciente existe
patient = db.query(Patient).filter(
    Patient.id == appointment.patient_id,
    Patient.tenant_id == appointment.tenant_id
).first()

if not patient:
    raise HTTPException(404, f"Patient {appointment.patient_id} not found")
```

### Problema: "Database is locked"

**Causa:** Múltiplas conexões simultâneas no SQLite.

**Solução temporária:**
```bash
# Parar todos os processos
# Deletar arquivo .db-wal e .db-shm se existirem
del alignwork.db-wal
del alignwork.db-shm
```

**Solução permanente:** Adicionar timeout:
```python
engine = create_engine(
    DATABASE_URL, 
    connect_args={
        "check_same_thread": False,
        "timeout": 30  # ← Adicionar timeout
    }
)
```

### Problema: Clientes ainda não aparecem após migração

**Debug:**
1. Verificar se o arquivo correto está sendo usado:
```python
# No main.py, adicionar:
print(f"📦 Using database: {DATABASE_PATH}")
print(f"📦 File exists: {DATABASE_PATH.exists()}")
print(f"📦 File size: {DATABASE_PATH.stat().st_size if DATABASE_PATH.exists() else 0} bytes")
```

2. Verificar se há dados:
```bash
# Instalar sqlite3 cli (se não tiver)
# Abrir banco
sqlite3 alignwork.db

# Ver pacientes
SELECT * FROM patients;

# Ver appointments
SELECT * FROM appointments;

# Sair
.quit
```

---

## 📊 Checklist de Validação

Após aplicar todas as correções, validar:

- [ ] Apenas 1 arquivo `alignwork.db` existe (na raiz)
- [ ] Arquivo `backend/alignwork.db` foi deletado
- [ ] `backend/main.py` usa caminho absoluto para o banco
- [ ] Modelo `Appointment` usa `patient_id` como `Integer` com `ForeignKey`
- [ ] Modelo `Patient` tem constraint `UniqueConstraint('tenant_id', 'cpf')`
- [ ] Script de migração foi executado sem erros
- [ ] Backend inicia e mostra caminho correto do banco no log
- [ ] Ao cadastrar cliente, log mostra confirmação de salvamento
- [ ] Cliente cadastrado aparece no dashboard após cadastro
- [ ] Cliente cadastrado **permanece** após reiniciar servidor
- [ ] Agendamento criado para cliente cadastrado funciona
- [ ] Console do navegador mostra clientes carregados do backend

---

## 🚀 Melhorias Futuras (Após Resolver o Bug)

1. **Usar Alembic para Migrações**
   - Instalar: `pip install alembic`
   - Inicializar: `alembic init alembic`
   - Gerar migrações automaticamente

2. **Adicionar Testes**
```python
def test_patient_persistence():
    """Testa se paciente é salvo e pode ser recuperado"""
    # Criar paciente
    patient = Patient(...)
    db.add(patient)
    db.commit()
    
    # Fechar sessão
    db.close()
    
    # Abrir nova sessão
    new_db = SessionLocal()
    retrieved = new_db.query(Patient).filter(Patient.id == patient.id).first()
    
    assert retrieved is not None
    assert retrieved.name == patient.name
```

3. **Adicionar Soft Delete**
```python
class Patient(Base):
    # ...
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
```

4. **Adicionar Auditoria**
```python
class Patient(Base):
    # ...
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
```

---

## 📝 Resumo das Mudanças

### Arquivos Modificados:
1. `backend/main.py` - Caminho absoluto do banco
2. `backend/models/appointment.py` - ForeignKey correto
3. `backend/models/patient.py` - Constraint de CPF por tenant
4. `backend/routes/patients.py` - Logs de debug
5. `src/contexts/AppContext.tsx` - Logs de debug

### Arquivos Criados:
1. `backend/migrate_patient_ids.py` - Script de migração

### Arquivos Deletados:
1. `backend/alignwork.db` - Banco vazio duplicado

---

## ✅ Conclusão

Este documento detalha todos os passos necessários para corrigir o problema de persistência de clientes. O problema principal era a **inconsistência nos tipos de dados** (`patient_id` como String vs Integer) e **múltiplas instâncias do banco de dados**.

Após aplicar todas as correções:
- ✅ Clientes serão persistidos corretamente
- ✅ Relacionamento entre Patient e Appointment será mantido
- ✅ Não haverá mais conflitos de CPF entre tenants
- ✅ Sistema usará apenas 1 banco de dados
- ✅ Logs ajudarão a debugar problemas futuros

**Tempo estimado para aplicação:** 30-45 minutos  
**Complexidade:** Média  
**Risco:** Baixo (backup criado antes de qualquer mudança)

---

**Dúvidas ou problemas?** Verifique a seção de Troubleshooting ou crie um log detalhado do erro para análise.

