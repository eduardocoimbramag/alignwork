# 🔧 Reparo 2 - Erro de Validação no Schema de Appointment

**Data:** 01/11/2025  
**Status:** 🔴 CRÍTICO - Appointment criado mas API retorna erro 500  
**Autor:** Diagnóstico Técnico - Parte 2

---

## 📋 Sumário Executivo

Após aplicar as correções do documento **1-reparo--cadastro.md**, um novo problema foi identificado:

- ✅ **Clientes são salvos** corretamente no banco
- ✅ **Appointments são criados** no banco de dados
- ❌ **API retorna erro 500** ao tentar serializar a resposta
- ❌ **Frontend exibe** "Erro ao agendar" / "Failed to fetch"

### 🔍 Evidências do Erro:

```
✅ Patient created: ID=2, name=Maria Eduarda..., tenant=default-tenant
✅ VERIFICATION: Patient ID=2 confirmed in database
✅ Appointment created: ID=2, tenant=default-tenant

❌ ERROR: ResponseValidationError: 1 validation errors:
  {'type': 'string_type', 'loc': ('response', 'patient_id'), 
   'msg': 'Input should be a valid string', 'input': 2}
```

---

## 🔍 Análise Técnica do Problema

### **Causa Raiz:**

No documento anterior, corrigimos o **modelo do banco de dados** (`backend/models/appointment.py`):

```python
# CORRETO no modelo do banco
patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
```

Porém, **NÃO atualizamos o schema Pydantic** de resposta (`backend/schemas/appointment.py`):

```python
# INCORRETO no schema de resposta
class AppointmentResponse(BaseModel):
    patient_id: str  # ← AINDA ESTÁ COMO STRING!
```

### **O que está acontecendo:**

1. ✅ Frontend envia `patientId: "2"` (string)
2. ✅ Backend valida e aceita string no input (`AppointmentCreate`)
3. ✅ Backend **tenta** converter para int: `patient_id=appointment.patientId`
4. ❌ **ERRO:** Python/Pydantic falha ao converter "2" (str) → 2 (int)
5. ✅ SQLite **aceita string "2" e converte automaticamente** para integer 2
6. ✅ Appointment é **salvo no banco** com `patient_id=2` (integer)
7. ❌ Ao retornar resposta, FastAPI tenta validar usando `AppointmentResponse`
8. ❌ **ERRO:** Schema espera `patient_id: str` mas banco retornou `patient_id: int`
9. ❌ FastAPI lança `ResponseValidationError`
10. ❌ Frontend recebe **HTTP 500** e exibe "Failed to fetch"

### **Diagrama do Fluxo:**

```
Frontend → API (patientId: "2" string)
              ↓
         Validação OK (AppointmentCreate aceita string)
              ↓
         Conversão implícita: "2" → 2 (SQLite faz automaticamente)
              ↓
         Salva no banco: patient_id=2 (INTEGER) ✅
              ↓
         Retorna objeto: patient_id=2 (int)
              ↓
         Valida resposta: AppointmentResponse espera str ❌
              ↓
         ResponseValidationError 500 ❌
```

---

## 🛠️ Solução Completa (Passo a Passo)

### **ETAPA 1: Atualizar Schema de Resposta**

#### 1.1. Corrigir `AppointmentResponse`

**Arquivo:** `backend/schemas/appointment.py`

**Linha 100 - Antes:**
```python
class AppointmentResponse(BaseModel):
    id: int
    tenant_id: str
    patient_id: str  # ← ERRADO
    starts_at: datetime
    duration_min: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

**Linha 100 - Depois:**
```python
class AppointmentResponse(BaseModel):
    id: int
    tenant_id: str
    patient_id: int  # ← CORRETO: int agora
    starts_at: datetime
    duration_min: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

---

### **ETAPA 2: Atualizar Schema de Input (Converter String → Int)**

#### 2.1. Corrigir validador de `patientId`

**Arquivo:** `backend/schemas/appointment.py`

**Linhas 6-7 - Antes:**
```python
class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str  # ← Frontend envia string
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"
```

**Opção A - Aceitar int ou string no input:**
```python
from typing import Union

class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: Union[int, str]  # ← Aceita tanto int quanto string
    startsAt: str
    durationMin: int
    status: Optional[str] = "pending"
    
    @validator('patientId')
    def validate_patient_id(cls, v):
        """Valida e converte patientId para int."""
        if isinstance(v, int):
            return v
        
        if isinstance(v, str):
            # Remove whitespace
            v_clean = v.strip()
            if not v_clean:
                raise ValueError('patientId cannot be empty')
            
            # Tenta converter para int
            try:
                return int(v_clean)
            except ValueError:
                raise ValueError(f'patientId must be a valid integer, got: {v_clean}')
        
        raise ValueError('patientId must be int or string')
```

**Opção B - Manter string no input e converter explicitamente:**

Manter `patientId: str` no schema mas atualizar a rota para converter:

**Arquivo:** `backend/routes/appointments.py`

**Linha 298 - Antes:**
```python
db_appointment = Appointment(
    tenant_id=appointment.tenantId,
    patient_id=appointment.patientId,  # ← String
    starts_at=starts_at,
    duration_min=appointment.durationMin,
    status=appointment.status or "pending"
)
```

**Linha 298 - Depois:**
```python
# Converter patientId de string para int
try:
    patient_id_int = int(appointment.patientId)
except ValueError:
    raise HTTPException(
        status_code=400,
        detail=f"Invalid patientId: must be a valid integer"
    )

db_appointment = Appointment(
    tenant_id=appointment.tenantId,
    patient_id=patient_id_int,  # ← Integer
    starts_at=starts_at,
    duration_min=appointment.durationMin,
    status=appointment.status or "pending"
)
```

---

### **ETAPA 3: Escolher Melhor Abordagem**

**Recomendação: Usar Opção A (Union[int, str] com validador)**

**Por quê?**
- ✅ Mais flexível - aceita tanto int quanto string do frontend
- ✅ Validação centralizada no schema
- ✅ Conversão automática antes de chegar na rota
- ✅ Melhor mensagem de erro para o usuário
- ✅ Mantém compatibilidade com frontend atual

**Arquivo final:** `backend/schemas/appointment.py`

```python
from pydantic import BaseModel, validator, Field
from datetime import datetime
from typing import Optional, List, Generic, TypeVar, Union

class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: Union[int, str]  # Aceita int ou string
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"

    @validator('startsAt')
    def validate_starts_at(cls, v):
        """Validate startsAt timestamp format and business rules."""
        if not v or not isinstance(v, str):
            raise ValueError('startsAt is required and must be a string')
        
        # Clean and validate ISO format
        try:
            clean_timestamp = v.replace('Z', '+00:00')
            dt = datetime.fromisoformat(clean_timestamp)
        except ValueError:
            raise ValueError('startsAt must be a valid ISO 8601 timestamp (e.g., "2025-10-15T14:30:00Z")')
        
        # Check if datetime is naive (no timezone info)
        if dt.tzinfo is None:
            raise ValueError('startsAt must include timezone information (use Z or +00:00 for UTC)')
        
        # Business rule: Cannot schedule in the past
        now = datetime.now(dt.tzinfo)
        if dt < now:
            raise ValueError('Appointment cannot be scheduled in the past')
        
        # Business rule: Cannot schedule too far in the future (max 2 years)
        max_future = now.replace(year=now.year + 2)
        if dt > max_future:
            raise ValueError('Appointment cannot be scheduled more than 2 years in the future')
        
        return v

    @validator('durationMin')
    def validate_duration_min(cls, v):
        """Validate duration is within reasonable business limits."""
        if not isinstance(v, int) or v <= 0:
            raise ValueError('durationMin must be a positive integer')
        
        # Business rule: Minimum 15 minutes
        if v < 15:
            raise ValueError('Duration must be at least 15 minutes')
        
        # Business rule: Maximum 8 hours (480 minutes)
        if v > 480:
            raise ValueError('Duration cannot exceed 8 hours (480 minutes)')
        
        return v

    @validator('tenantId')
    def validate_tenant_id(cls, v):
        """Validate tenantId format and content."""
        if not v or not isinstance(v, str):
            raise ValueError('tenantId is required and must be a string')
        
        v_clean = v.strip()
        if not v_clean:
            raise ValueError('tenantId cannot be empty or just whitespace')
        
        if len(v_clean) < 3:
            raise ValueError('tenantId must be at least 3 characters long')
        
        if len(v_clean) > 50:
            raise ValueError('tenantId cannot exceed 50 characters')
        
        return v_clean

    @validator('patientId')
    def validate_patient_id(cls, v):
        """Valida e converte patientId para int."""
        # Se já é int, retorna
        if isinstance(v, int):
            if v <= 0:
                raise ValueError('patientId must be a positive integer')
            return v
        
        # Se é string, tenta converter
        if isinstance(v, str):
            v_clean = v.strip()
            if not v_clean:
                raise ValueError('patientId cannot be empty')
            
            try:
                patient_id_int = int(v_clean)
                if patient_id_int <= 0:
                    raise ValueError('patientId must be a positive integer')
                return patient_id_int
            except ValueError:
                raise ValueError(f'patientId must be a valid integer, got: {v_clean}')
        
        raise ValueError('patientId must be int or string')

class AppointmentUpdate(BaseModel):
    status: str  # pending, confirmed, cancelled

class AppointmentResponse(BaseModel):
    id: int
    tenant_id: str
    patient_id: int  # ← CORRETO: int agora
    starts_at: datetime
    duration_min: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# PAGINAÇÃO - P1-001
# ============================================================================

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """Schema genérico para respostas paginadas."""
    data: List[T]
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., ge=1, description="Página atual (1-indexed)")
    page_size: int = Field(..., ge=1, le=100, description="Itens por página")
    total_pages: int = Field(..., ge=0, description="Total de páginas")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [],
                "total": 250,
                "page": 1,
                "page_size": 50,
                "total_pages": 5
            }
        }

class AppointmentPaginatedResponse(PaginatedResponse[AppointmentResponse]):
    """Resposta paginada específica para Appointments."""
    pass
```

---

### **ETAPA 4: Atualizar Rota de Criação (Opcional)**

Como o validador já converte para int, podemos simplificar a rota:

**Arquivo:** `backend/routes/appointments.py`

**Linha 296 - Manter simples:**
```python
starts_at = datetime.fromisoformat(appointment.startsAt.replace('Z', '+00:00'))

db_appointment = Appointment(
    tenant_id=appointment.tenantId,
    patient_id=appointment.patientId,  # ← Já é int (convertido pelo validador)
    starts_at=starts_at,
    duration_min=appointment.durationMin,
    status=appointment.status or "pending"
)
db.add(db_appointment)
db.commit()
db.refresh(db_appointment)

print(f"✅ Appointment created: ID={db_appointment.id}, patient_id={db_appointment.patient_id}, tenant={appointment.tenantId}")
return db_appointment
```

---

### **ETAPA 5: Adicionar Validação de Foreign Key**

Para evitar criar appointments com `patient_id` inexistente:

**Arquivo:** `backend/routes/appointments.py`

**Adicionar após linha 295:**

```python
from models.patient import Patient

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    try:
        # NOVO: Verificar se paciente existe
        patient = db.query(Patient).filter(
            Patient.id == appointment.patientId,
            Patient.tenant_id == appointment.tenantId
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with ID {appointment.patientId} not found for tenant {appointment.tenantId}"
            )
        
        starts_at = datetime.fromisoformat(appointment.startsAt.replace('Z', '+00:00'))
        
        db_appointment = Appointment(
            tenant_id=appointment.tenantId,
            patient_id=appointment.patientId,
            starts_at=starts_at,
            duration_min=appointment.durationMin,
            status=appointment.status or "pending"
        )
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        print(f"✅ Appointment created: ID={db_appointment.id}, patient={patient.name}, tenant={appointment.tenantId}")
        return db_appointment
        
    except HTTPException:
        raise
    except ValueError as e:
        db.rollback()
        print(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid data: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create appointment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create appointment. Please try again later."
        )
```

---

### **ETAPA 6: Atualizar Frontend (Garantir Consistência)**

Verificar se o frontend está enviando `patientId` corretamente:

**Arquivo:** `src/components/Modals/NovoAgendamentoModal.tsx` (provável localização)

```typescript
// Ao criar appointment, garantir que patientId é string
const appointmentData = {
  tenantId: tenantId,
  patientId: selectedClienteId.toString(),  // ← Converter para string
  startsAt: dataHoraISO,
  durationMin: duracao,
  status: "pending"
};

await createAppointment(appointmentData);
```

**Ou aceitar que backend converte:**

```typescript
// Backend agora aceita int ou string
const appointmentData = {
  tenantId: tenantId,
  patientId: selectedClienteId,  // ← Pode ser número ou string
  startsAt: dataHoraISO,
  durationMin: duracao,
  status: "pending"
};
```

---

## 🧪 Testar Solução

### Teste 1: Criar Appointment com Cliente Existente

1. Reiniciar backend
2. Cadastrar um cliente (deve retornar ID, ex: 3)
3. Criar um appointment para esse cliente
4. **Resultado esperado:**
   ```
   ✅ Patient with ID 3 found
   ✅ Appointment created: ID=4, patient=João Silva, tenant=default-tenant
   HTTP 201 Created
   ```
5. Frontend deve exibir "Agendamento criado com sucesso!"

### Teste 2: Criar Appointment com Cliente Inexistente

1. Tentar criar appointment com `patientId: 9999`
2. **Resultado esperado:**
   ```
   HTTP 404 Not Found
   {"detail": "Patient with ID 9999 not found for tenant default-tenant"}
   ```
3. Frontend deve exibir mensagem de erro apropriada

### Teste 3: Criar Appointment com patientId Inválido

1. Tentar criar appointment com `patientId: "abc"`
2. **Resultado esperado:**
   ```
   HTTP 422 Unprocessable Entity
   {
     "detail": [
       {
         "loc": ["body", "patientId"],
         "msg": "patientId must be a valid integer, got: abc",
         "type": "value_error"
       }
     ]
   }
   ```

---

## 📊 Checklist de Validação

Após aplicar correções:

- [ ] `backend/schemas/appointment.py` tem `patient_id: int` no `AppointmentResponse`
- [ ] `backend/schemas/appointment.py` tem `patientId: Union[int, str]` no `AppointmentCreate`
- [ ] Validador converte string → int automaticamente
- [ ] Rota verifica se paciente existe antes de criar appointment
- [ ] Backend reiniciado e funcionando
- [ ] Criar appointment com cliente existente funciona (HTTP 201)
- [ ] Criar appointment com cliente inexistente retorna HTTP 404
- [ ] Frontend exibe "Agendamento criado com sucesso!"
- [ ] Erro "Failed to fetch" não aparece mais

---

## 🔍 Troubleshooting

### Problema: Ainda recebe "Failed to fetch"

**Causa possível:** CORS ou network error.

**Debug:**
1. Abrir DevTools do navegador (F12)
2. Ir para aba "Network"
3. Tentar criar appointment
4. Clicar no request que falhou
5. Verificar:
   - Status code (500? 404? 422?)
   - Response body
   - Headers

### Problema: "Patient not found" mas cliente existe

**Causa:** `tenant_id` diferente ou cliente foi deletado.

**Debug:**
```sql
-- Abrir banco
sqlite3 alignwork.db

-- Ver pacientes
SELECT id, tenant_id, name FROM patients;

-- Ver appointments
SELECT id, patient_id, tenant_id FROM appointments;
```

### Problema: "patientId must be a valid integer"

**Causa:** Frontend enviando valor não-numérico.

**Debug no frontend:**
```typescript
console.log('Creating appointment:', {
  patientId: selectedClienteId,
  type: typeof selectedClienteId
});
```

Garantir que `selectedClienteId` é número ou string numérica.

---

## 📝 Resumo das Mudanças

### Arquivos Modificados:

1. **`backend/schemas/appointment.py`**
   - `AppointmentResponse.patient_id`: `str` → `int`
   - `AppointmentCreate.patientId`: `str` → `Union[int, str]`
   - Novo validador para converter string → int

2. **`backend/routes/appointments.py`**
   - Adicionar validação de Foreign Key (verificar se patient existe)
   - Melhorar log de criação de appointment

### Nenhum Arquivo Novo Criado

### Mudanças no Banco de Dados: NENHUMA
(Já foi corrigido no documento 1-reparo--cadastro.md)

---

## ✅ Conclusão

Este documento resolve o erro de validação que ocorre após aplicar as correções do **1-reparo--cadastro.md**.

**Causa raiz:** Inconsistência entre tipo do campo no modelo do banco (`Integer`) e schema de resposta Pydantic (`str`).

**Solução:**
- ✅ Atualizar `AppointmentResponse.patient_id` para `int`
- ✅ Atualizar validador para aceitar e converter `patientId` de string → int
- ✅ Adicionar validação de Foreign Key
- ✅ Melhorar mensagens de erro

Após aplicar estas correções:
- ✅ Appointments serão criados com sucesso
- ✅ API retornará HTTP 201 (não mais 500)
- ✅ Frontend exibirá "Agendamento criado com sucesso!"
- ✅ Dados persistem corretamente entre reinicializações

**Tempo estimado para aplicação:** 10-15 minutos  
**Complexidade:** Baixa  
**Risco:** Mínimo (apenas mudanças em schemas)

---

**Problemas ou dúvidas?** Verifique a seção de Troubleshooting ou compare seu código com os exemplos fornecidos.

