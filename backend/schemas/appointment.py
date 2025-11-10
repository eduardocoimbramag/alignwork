from pydantic import BaseModel, validator, Field
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Generic, TypeVar, Union
import os

class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: Union[int, str]  # Aceita int ou string
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"
    consultorioId: Optional[int] = None  # ID do consultório (obrigatório após migração)

    @validator('startsAt')
    def validate_starts_at(cls, v):
        """Validate startsAt timestamp format and business rules."""
        if not v or not isinstance(v, str):
            raise ValueError('startsAt is required and must be a string')
        
        # Clean and validate ISO format
        try:
            # Handle both 'Z' and '+00:00' UTC formats
            clean_timestamp = v.replace('Z', '+00:00')
            dt = datetime.fromisoformat(clean_timestamp)
        except ValueError:
            raise ValueError('startsAt must be a valid ISO 8601 timestamp (e.g., "2025-10-15T14:30:00Z")')
        
        # Check if datetime is naive (no timezone info)
        if dt.tzinfo is None:
            raise ValueError('startsAt must include timezone information (use Z or +00:00 for UTC)')
        
        # Normalize to UTC before comparison
        starts_at_utc = dt.astimezone(timezone.utc)
        
        # Business rule: Cannot schedule too far in the future (max 2 years)
        now_utc = datetime.now(timezone.utc)
        max_future_utc = now_utc.replace(year=now_utc.year + 2)
        if starts_at_utc > max_future_utc:
            raise ValueError('Appointment cannot be scheduled more than 2 years in the future')
        
        # Note: Validation for "past" is done in the route handler to allow structured error response
        # Return the original string (will be normalized to UTC in the route handler)
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
        
        # Remove whitespace and check length
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
        # Se já é int, valida e retorna
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
    
    @validator('consultorioId')
    def validate_consultorio_id(cls, v):
        """Valida consultorioId se fornecido."""
        if v is not None:
            if not isinstance(v, int) or v <= 0:
                raise ValueError('consultorioId must be a positive integer')
        return v

class AppointmentUpdate(BaseModel):
    status: str  # pending, confirmed, cancelled

class AppointmentResponse(BaseModel):
    id: int
    tenant_id: str
    patient_id: int  # Correto: int agora (alinhado com o banco de dados)
    consultorio_id: Optional[int] = None  # ID do consultório
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
    """
    Schema genérico para respostas paginadas.
    
    Attributes:
        data: Lista de itens da página atual
        total: Total de registros no banco (matching filters)
        page: Número da página atual (1-indexed)
        page_size: Quantidade de itens por página
        total_pages: Total de páginas disponíveis
    
    Example:
        {
            "data": [...],
            "total": 250,
            "page": 1,
            "page_size": 50,
            "total_pages": 5
        }
    """
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

