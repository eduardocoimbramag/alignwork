# Correção: Erro Genérico ao Criar Agendamento com Campo Consultório

## 1. Resumo do Problema

### Sintoma Reportado

Após implementar o campo "Consultório" no formulário de agendamento, **não é mais possível criar agendamentos**. O sistema retorna erro genérico:

```
Erro ao agendar
Failed to create appointment. Please try again later.
```

### Evidências Visuais

- Formulário preenchido corretamente com todos os campos obrigatórios
- Cliente: Eduardo Coimbra
- Consultório: Office – Rua Samuel Campelo 260 – Aflitos
- Tipo de Consulta: Consulta
- Data: 10 de novembro
- Hora: 22:00
- Duração: 1 hora

### Análise Inicial

**Tipo de erro**: `500 Internal Server Error` (erro não tratado no backend)

**Origem provável**: O erro genérico "Failed to create appointment. Please try again later." é capturado pelo bloco `except Exception as e` no backend, indicando que um erro inesperado está ocorrendo durante a criação do agendamento.

### Causas Mais Prováveis (Priorizadas)

1. **Validação de consultório falhando**
   - Consultório não existe no banco de dados
   - Consultório pertence a outro tenant
   - Campo `consultorio_id` está sendo enviado incorretamente (ex.: null quando deveria ser número)

2. **Erro de conversão de tipo**
   - Frontend envia `consultorioId` como string mas backend espera number
   - Frontend envia `null` mas backend não aceita null

3. **Erro de relacionamento no banco de dados**
   - Foreign key constraint falhando
   - Consultório não tem relacionamento correto com appointments
   - Tabela `consultorios` não existe ou está vazia

4. **Erro na validação do Pydantic**
   - Schema `AppointmentCreate` não aceita o formato enviado
   - Validador de `consultorioId` está falhando

5. **Erro de permissão/tenant**
   - Consultório existe mas pertence a outro tenant
   - Validação de tenant está incorreta

---

## 2. Diagnóstico Passo a Passo

### Passo 1: Verificar Logs do Backend

**Objetivo**: Identificar a exceção exata que está ocorrendo.

**Como fazer**:
1. Abrir terminal onde o backend está rodando
2. Tentar criar um agendamento no frontend
3. Observar a saída do console

**O que procurar**:
```python
# O backend deve logar algo como:
❌ Failed to create appointment: <mensagem de erro detalhada>
```

**Erros comuns**:
- `IntegrityError`: Foreign key constraint failed (consultório não existe)
- `AttributeError`: Campo consultório não existe no modelo
- `ValidationError`: Pydantic rejeitou o payload
- `ValueError`: Conversão de tipo falhou

### Passo 2: Verificar Network Tab (DevTools)

**Objetivo**: Inspecionar o payload exato enviado ao backend e a resposta recebida.

**Como fazer**:
1. Abrir DevTools (F12) → Network
2. Filtrar por "XHR" ou "Fetch"
3. Tentar criar agendamento
4. Localizar requisição `POST /api/v1/appointments`

**O que verificar**:

**Request Payload**:
```json
{
  "tenantId": "...",
  "patientId": 1,
  "startsAt": "2025-11-10T01:00:00.000Z",
  "durationMin": 60,
  "status": "pending",
  "consultorioId": 1  // ← Verificar se está presente e é number
}
```

**Verificações críticas**:
- [ ] `consultorioId` está presente?
- [ ] `consultorioId` é number (não string ou null)?
- [ ] `consultorioId` corresponde a um consultório real no banco?

**Response**:
```json
{
  "detail": "Failed to create appointment. Please try again later."
}
```

**Status Code**: Provavelmente `500 Internal Server Error`

### Passo 3: Verificar Banco de Dados

**Objetivo**: Confirmar que consultórios existem e estão vinculados ao tenant correto.

**Como fazer**:
```bash
# Conectar ao banco SQLite
sqlite3 alignwork.db

# Listar consultórios
SELECT id, tenant_id, nome FROM consultorios;

# Verificar relacionamento com appointments
PRAGMA table_info(appointments);

# Verificar foreign key
PRAGMA foreign_keys;
```

**O que verificar**:
- [ ] Tabela `consultorios` existe?
- [ ] Há pelo menos um consultório no banco?
- [ ] `tenant_id` do consultório corresponde ao `tenant_id` do usuário logado?
- [ ] Coluna `consultorio_id` existe na tabela `appointments`?
- [ ] Foreign key está configurada corretamente?

### Passo 4: Testar Endpoint Diretamente (cURL)

**Objetivo**: Isolar o problema (frontend vs backend).

**Como fazer**:
```bash
# Teste 1: Criar agendamento COM consultorioId
curl -i -X POST "http://localhost:8000/api/v1/appointments/" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T15:00:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'

# Teste 2: Criar agendamento SEM consultorioId (para comparar)
curl -i -X POST "http://localhost:8000/api/v1/appointments/" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T15:00:00Z",
    "durationMin": 60,
    "status": "pending"
  }'
```

**Resultados esperados**:
- Teste 1 deve falhar com mesmo erro se o problema está no backend
- Teste 2 deve passar se o problema está relacionado especificamente ao consultório

### Passo 5: Verificar Schema do Backend

**Arquivo**: `backend/schemas/appointment.py`

**O que verificar**:
```python
class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: Union[int, str]
    startsAt: str
    durationMin: int
    status: Optional[str] = "pending"
    consultorioId: Optional[int] = None  # ← Verificar esta linha
    
    @validator('consultorioId')
    def validate_consultorio_id(cls, v):
        """Valida consultorioId se fornecido."""
        if v is not None:
            if not isinstance(v, int) or v <= 0:
                raise ValueError('consultorioId must be a positive integer')
        return v
```

**Verificações**:
- [ ] Campo `consultorioId` existe no schema?
- [ ] É `Optional[int]` (aceita None)?
- [ ] Validador não está rejeitando valores válidos?

### Passo 6: Verificar Rota de Criação

**Arquivo**: `backend/routes/appointments.py`

**O que verificar**:
```python
@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        # ...validações...
        
        # Validar consultório se fornecido
        consultorio_id = None
        if appointment.consultorioId is not None:
            consultorio = db.query(Consultorio).filter(
                Consultorio.id == appointment.consultorioId,
                Consultorio.tenant_id == appointment.tenantId
            ).first()
            
            if not consultorio:
                raise HTTPException(
                    status_code=422,
                    detail=f"Consultorio with ID {appointment.consultorioId} not found or does not belong to tenant {appointment.tenantId}"
                )
            
            consultorio_id = appointment.consultorioId
        
        # Criar appointment
        db_appointment = Appointment(
            tenant_id=appointment.tenantId,
            patient_id=appointment.patientId,
            consultorio_id=consultorio_id,  # ← Verificar esta linha
            starts_at=starts_at_utc,
            duration_min=appointment.durationMin,
            status=appointment.status or "pending"
        )
```

**Verificações**:
- [ ] Validação de consultório está presente?
- [ ] Query de consultório usa filtro de tenant correto?
- [ ] `consultorio_id` está sendo atribuído corretamente ao modelo?
- [ ] Modelo `Appointment` aceita campo `consultorio_id`?

### Passo 7: Verificar Modelo do Banco

**Arquivo**: `backend/models/appointment.py`

**O que verificar**:
```python
class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    consultorio_id = Column(Integer, ForeignKey("consultorios.id"), nullable=True, index=True)  # ← Verificar esta linha
    
    patient = relationship("Patient", backref="appointments")
    consultorio = relationship("Consultorio", backref="appointments")  # ← Verificar esta linha
```

**Verificações**:
- [ ] Campo `consultorio_id` existe no modelo?
- [ ] Foreign key aponta para `consultorios.id`?
- [ ] Relationship está configurado corretamente?
- [ ] `nullable=True` (permite NULL)?

---

## 3. Cenários de Falha e Correções

### Cenário 1: Consultório Não Existe no Banco

**Sintoma**: Backend retorna 422 ou 500 ao tentar validar consultório.

**Diagnóstico**:
```sql
SELECT COUNT(*) FROM consultorios WHERE id = 1;
-- Se retornar 0, consultório não existe
```

**Correção**:
1. Cadastrar consultório pelo frontend (Configurações → Consultórios)
2. Ou inserir manualmente:
```sql
INSERT INTO consultorios (id, tenant_id, nome, estado, cidade, cep, rua, numero, bairro)
VALUES (1, 'seu-tenant-id', 'Office Principal', 'PE', 'Recife', '50000-000', 'Rua Samuel Campelo', '260', 'Aflitos');
```

### Cenário 2: Consultório Pertence a Outro Tenant

**Sintoma**: Backend retorna 422 com "Consultorio not found or does not belong to tenant".

**Diagnóstico**:
```sql
SELECT id, tenant_id, nome FROM consultorios WHERE id = 1;
-- Verificar se tenant_id corresponde ao usuário logado
```

**Correção**:
1. Usar consultório do tenant correto
2. Ou atualizar tenant_id do consultório:
```sql
UPDATE consultorios SET tenant_id = 'tenant-correto' WHERE id = 1;
```

### Cenário 3: Frontend Envia consultorioId como null

**Sintoma**: Backend tenta validar consultório null e falha.

**Diagnóstico**: No DevTools, verificar payload:
```json
{
  "consultorioId": null  // ← Problema
}
```

**Correção no Frontend**:

**Arquivo**: `src/hooks/useAppointmentMutations.ts`

**Alterar**:
```typescript
// ANTES (incorreto)
const body = {
    tenantId,
    patientId: payload.patientId,
    startsAt: startsAtUTC,
    durationMin: payload.durationMin,
    status: payload.status || 'pending',
    consultorioId: payload.consultorioId  // ← Pode ser null
}

// DEPOIS (correto)
const body = {
    tenantId,
    patientId: payload.patientId,
    startsAt: startsAtUTC,
    durationMin: payload.durationMin,
    status: payload.status || 'pending',
    ...(payload.consultorioId && { consultorioId: payload.consultorioId })  // ← Só inclui se truthy
}
```

### Cenário 4: Campo consultorio_id Não Existe no Modelo

**Sintoma**: `AttributeError: 'Appointment' object has no attribute 'consultorio_id'`

**Diagnóstico**: Verificar modelo `Appointment`:
```python
# Se não houver esta linha, o campo não existe:
consultorio_id = Column(Integer, ForeignKey("consultorios.id"), nullable=True)
```

**Correção**:

**Arquivo**: `backend/models/appointment.py`

**Adicionar**:
```python
from models.consultorio import Consultorio  # Import no topo

class Appointment(Base):
    __tablename__ = "appointments"
    
    # ...outros campos...
    
    consultorio_id = Column(Integer, ForeignKey("consultorios.id"), nullable=True, index=True)
    
    # Relationships
    patient = relationship("Patient", backref="appointments")
    consultorio = relationship("Consultorio", backref="appointments")
```

**Migração do Banco**:
```bash
# Se usar Alembic
alembic revision --autogenerate -m "Add consultorio_id to appointments"
alembic upgrade head

# Se SQLite sem Alembic, recriar banco:
rm alignwork.db
python backend/main.py  # Recria tabelas
```

### Cenário 5: Tabela consultorios Não Existe

**Sintoma**: `OperationalError: no such table: consultorios`

**Diagnóstico**:
```sql
.tables
-- Verificar se 'consultorios' aparece na lista
```

**Correção**:

**Arquivo**: `backend/main.py`

**Garantir que modelo está importado**:
```python
from models.user import Base
from models.consultorio import Consultorio  # ← Esta linha deve existir
from routes import auth, appointments, patients, consultorios

# ...

# Create tables
Base.metadata.create_all(bind=engine)  # ← Isso cria todas as tabelas
```

**Reiniciar backend** para recriar tabelas.

### Cenário 6: Foreign Key Constraint Falhando

**Sintoma**: `IntegrityError: FOREIGN KEY constraint failed`

**Diagnóstico**:
```sql
PRAGMA foreign_keys;
-- Deve retornar: 1 (ativo)

SELECT * FROM consultorios WHERE id = 1;
-- Deve retornar pelo menos um registro
```

**Correção**:
1. Garantir que consultório existe antes de criar appointment
2. Ou desabilitar temporariamente foreign keys (não recomendado em produção):
```sql
PRAGMA foreign_keys = OFF;
```

### Cenário 7: Validação do Pydantic Muito Restritiva

**Sintoma**: `ValidationError` antes mesmo de chegar à rota.

**Diagnóstico**: Verificar validador em `backend/schemas/appointment.py`:
```python
@validator('consultorioId')
def validate_consultorio_id(cls, v):
    if v is not None:
        if not isinstance(v, int) or v <= 0:
            raise ValueError('consultorioId must be a positive integer')
    return v
```

**Correção**: Garantir que validador aceita valores válidos:
- `None` deve passar (consultório opcional)
- Inteiros positivos devem passar
- Zero ou negativos devem falhar

---

## 4. Plano de Correção Sistemática (Sem Diffs)

### Etapa 1: Verificar Banco de Dados

1. Conectar ao banco SQLite: `sqlite3 alignwork.db`
2. Verificar se tabela `consultorios` existe: `.tables`
3. Verificar se há consultórios cadastrados: `SELECT * FROM consultorios;`
4. Se não houver, cadastrar pelo menos um consultório via frontend ou SQL
5. Verificar se coluna `consultorio_id` existe em `appointments`: `PRAGMA table_info(appointments);`
6. Se não existir, adicionar coluna ao modelo e recriar banco

### Etapa 2: Verificar Modelo do Backend

**Arquivo**: `backend/models/appointment.py`

1. Confirmar que campo `consultorio_id` existe
2. Confirmar foreign key para `consultorios.id`
3. Confirmar que `nullable=True` (permite NULL)
4. Confirmar relationship `consultorio`

### Etapa 3: Verificar Schema do Backend

**Arquivo**: `backend/schemas/appointment.py`

1. Confirmar que `consultorioId: Optional[int] = None` existe
2. Verificar validador não está rejeitando valores válidos
3. Garantir que aceita `None` (consultório opcional)

### Etapa 4: Verificar Rota de Criação

**Arquivo**: `backend/routes/appointments.py`

1. Confirmar que validação de consultório está presente
2. Garantir que query de consultório usa filtro de `tenant_id`
3. Confirmar que `consultorio_id` está sendo atribuído ao modelo
4. Garantir que erro 422 é retornado se consultório não existe

### Etapa 5: Verificar Frontend

**Arquivo**: `src/hooks/useAppointmentMutations.ts`

1. Confirmar que `consultorioId` está sendo enviado corretamente
2. Usar spread condicional para não enviar se `null/undefined`:
   ```typescript
   ...(payload.consultorioId && { consultorioId: payload.consultorioId })
   ```

**Arquivo**: `src/components/Modals/NovoAgendamentoModal.tsx`

1. Confirmar que validação de consultório está ativa
2. Garantir que `formData.consultorioId` é `number | null`
3. Verificar que erro de validação é exibido ao usuário

### Etapa 6: Melhorar Logging

**Arquivo**: `backend/routes/appointments.py`

**No bloco `except Exception as e`**, adicionar log mais detalhado:
```python
except Exception as e:
    db.rollback()
    import traceback
    print(f"❌ Failed to create appointment: {str(e)}")
    print(f"❌ Traceback: {traceback.format_exc()}")  # ← Adicionar esta linha
    raise HTTPException(
        status_code=500,
        detail="Failed to create appointment. Please try again later."
    )
```

Isso ajudará a identificar a exceção exata que está ocorrendo.

---

## 5. Testes de Validação

### Teste 1: Criar Agendamento COM Consultório

**Objetivo**: Verificar que agendamento é criado com sucesso quando consultório válido é fornecido.

**Passos**:
1. Garantir que existe pelo menos um consultório no banco
2. Preencher formulário com todos os campos obrigatórios
3. Selecionar consultório válido
4. Clicar em "Agendar"

**Resultado esperado**: Status `201 Created`, agendamento criado com sucesso.

### Teste 2: Criar Agendamento SEM Consultório

**Objetivo**: Verificar que agendamento é criado mesmo sem consultório (se for opcional).

**Passos**:
1. Preencher formulário com todos os campos obrigatórios EXCETO consultório
2. Deixar campo consultório vazio
3. Clicar em "Agendar"

**Resultado esperado**: 
- Se consultório for opcional: Status `201 Created`
- Se consultório for obrigatório: Erro de validação no frontend

### Teste 3: Consultório de Outro Tenant

**Objetivo**: Verificar que sistema rejeita consultório de outro tenant.

**Passos**:
1. Inserir consultório com tenant diferente no banco:
```sql
INSERT INTO consultorios (id, tenant_id, nome, estado, cidade, cep, rua, numero, bairro)
VALUES (999, 'outro-tenant', 'Office Teste', 'PE', 'Recife', '50000-000', 'Rua X', '1', 'Bairro Y');
```
2. Tentar criar agendamento com `consultorioId: 999`

**Resultado esperado**: Status `422` com mensagem "Consultorio not found or does not belong to tenant".

### Teste 4: Consultório Inexistente

**Objetivo**: Verificar que sistema rejeita consultório que não existe.

**Passos**:
1. Tentar criar agendamento com `consultorioId: 99999` (ID que não existe)

**Resultado esperado**: Status `422` com mensagem "Consultorio not found".

### Teste 5: consultorioId Inválido (String)

**Objetivo**: Verificar que sistema rejeita tipo incorreto.

**Passos**:
1. Via cURL, enviar `consultorioId: "abc"`

**Resultado esperado**: Status `422` com erro de validação do Pydantic.

---

## 6. Checklist de Aceitação

A correção está completa quando todos os itens abaixo forem atendidos:

- [ ] **Tabela `consultorios` existe no banco de dados**
  - Verificável via `.tables` no SQLite

- [ ] **Há pelo menos um consultório cadastrado**
  - Verificável via `SELECT COUNT(*) FROM consultorios;` (retorna > 0)

- [ ] **Coluna `consultorio_id` existe na tabela `appointments`**
  - Verificável via `PRAGMA table_info(appointments);`

- [ ] **Foreign key está configurado corretamente**
  - `consultorio_id` → `consultorios.id`
  - `nullable=True` (permite NULL)

- [ ] **Schema `AppointmentCreate` aceita `consultorioId: Optional[int]`**
  - Verificável em `backend/schemas/appointment.py`

- [ ] **Rota valida consultório antes de criar appointment**
  - Verifica se consultório existe
  - Verifica se pertence ao tenant correto
  - Retorna 422 se inválido

- [ ] **Frontend envia `consultorioId` corretamente**
  - Número quando selecionado
  - Omitido do payload quando não selecionado (não envia `null`)

- [ ] **Agendamento é criado com sucesso COM consultório**
  - Status `201 Created`
  - `consultorio_id` salvo no banco

- [ ] **Agendamento é criado com sucesso SEM consultório** (se opcional)
  - Status `201 Created`
  - `consultorio_id = NULL` no banco

- [ ] **Erros são tratados adequadamente**
  - 422 para consultório inválido (com mensagem clara)
  - 500 não ocorre mais (todos erros são tratados)
  - Mensagens de erro são exibidas no frontend

---

## 7. Observabilidade e Debugging

### Logs Recomendados

**Backend** (`backend/routes/appointments.py`):
```python
# No início da função create_appointment
print(f"🔍 Creating appointment - tenantId={appointment.tenantId}, patientId={appointment.patientId}, consultorioId={appointment.consultorioId}")

# Após validar consultório
if appointment.consultorioId is not None:
    print(f"✅ Consultorio validated: id={consultorio.id}, nome={consultorio.nome}")
else:
    print(f"ℹ️ No consultorio provided (optional)")

# Ao criar appointment
print(f"✅ Appointment created: ID={db_appointment.id}, consultorio_id={db_appointment.consultorio_id}")
```

### Métricas Úteis

- **Taxa de sucesso de criação de appointments**: `created / (created + failed)`
- **Erros por tipo**: contadores separados para cada tipo de erro
- **Appointments com/sem consultório**: distribuição

### Alertas

- Alertar se taxa de erro > 10% em 5 minutos
- Alertar se nenhum appointment for criado em 1 hora (horário comercial)

---

## 8. Prevenção de Regressão

### Testes Automatizados Recomendados

**Backend (pytest)**:
```python
def test_create_appointment_with_consultorio():
    """Testa criação de appointment com consultório válido"""
    # Criar consultório de teste
    # Criar appointment com consultorioId
    # Verificar que foi criado com sucesso

def test_create_appointment_without_consultorio():
    """Testa criação de appointment sem consultório"""
    # Criar appointment sem consultorioId
    # Verificar que foi criado com sucesso (se opcional)

def test_create_appointment_invalid_consultorio():
    """Testa que consultório inválido é rejeitado"""
    # Tentar criar appointment com consultorioId inexistente
    # Verificar que retorna 422

def test_create_appointment_wrong_tenant_consultorio():
    """Testa que consultório de outro tenant é rejeitado"""
    # Criar consultório com tenant diferente
    # Tentar criar appointment com esse consultorioId
    # Verificar que retorna 422
```

### Code Review Checklist

Ao revisar código relacionado a appointments:
- [ ] Verificar que validação de consultório está presente
- [ ] Verificar que filtro de tenant está correto
- [ ] Verificar que erros são tratados adequadamente
- [ ] Verificar que logs estão presentes
- [ ] Verificar que schema aceita todos os casos válidos

---

## 9. Apêndice

### Comandos Úteis SQLite

```sql
-- Listar todas as tabelas
.tables

-- Ver estrutura de appointments
PRAGMA table_info(appointments);

-- Ver foreign keys de appointments
PRAGMA foreign_key_list(appointments);

-- Listar todos os consultórios
SELECT id, tenant_id, nome FROM consultorios;

-- Contar appointments por consultório
SELECT consultorio_id, COUNT(*) 
FROM appointments 
GROUP BY consultorio_id;

-- Ver appointments sem consultório
SELECT * FROM appointments WHERE consultorio_id IS NULL;
```

### Estrutura Esperada

**Tabela `consultorios`**:
```sql
CREATE TABLE consultorios (
    id INTEGER PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    nome VARCHAR NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cidade VARCHAR NOT NULL,
    cep VARCHAR(9) NOT NULL,
    rua VARCHAR NOT NULL,
    numero VARCHAR NOT NULL,
    bairro VARCHAR NOT NULL,
    informacoes_adicionais TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Tabela `appointments` (com consultorio_id)**:
```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    patient_id INTEGER NOT NULL,
    consultorio_id INTEGER,  -- ← Campo adicionado
    starts_at TIMESTAMP NOT NULL,
    duration_min INTEGER NOT NULL,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (consultorio_id) REFERENCES consultorios(id)  -- ← FK adicionado
);
```

### Exemplo de Payload Correto

```json
{
  "tenantId": "example-tenant",
  "patientId": 1,
  "startsAt": "2025-11-10T15:00:00.000Z",
  "durationMin": 60,
  "status": "pending",
  "consultorioId": 1
}
```

### Exemplo de Resposta de Sucesso

```json
{
  "id": 123,
  "tenant_id": "example-tenant",
  "patient_id": 1,
  "consultorio_id": 1,
  "starts_at": "2025-11-10T15:00:00Z",
  "duration_min": 60,
  "status": "pending",
  "created_at": "2025-11-10T12:00:00Z",
  "updated_at": "2025-11-10T12:00:00Z"
}
```

---

## Conclusão

Este documento fornece um guia completo para diagnosticar e corrigir o erro genérico ao criar agendamentos após a implementação do campo consultório. 

**Roteiro de diagnóstico**:
1. Verificar logs do backend (exceção exata)
2. Inspecionar payload no DevTools
3. Verificar banco de dados (tabelas e dados)
4. Testar endpoint diretamente (cURL)
5. Verificar código (modelo, schema, rota)

**Prioridade de investigação**:
1. Consultório existe no banco?
2. Validação de consultório está funcionando?
3. Campo `consultorio_id` existe no modelo?
4. Frontend está enviando dados corretos?

**Abordagem**: Seguir o diagnóstico passo a passo até identificar a causa raiz, então aplicar a correção correspondente ao cenário identificado.

