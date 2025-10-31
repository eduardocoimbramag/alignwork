from pydantic import BaseModel, validator, Field
from datetime import datetime
from typing import Optional, List, Generic, TypeVar

class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str
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
            # Handle both 'Z' and '+00:00' UTC formats
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
        """Validate patientId format and content."""
        if not v or not isinstance(v, str):
            raise ValueError('patientId is required and must be a string')
        
        # Remove whitespace and check length
        v_clean = v.strip()
        if not v_clean:
            raise ValueError('patientId cannot be empty or just whitespace')
        
        # Permitir IDs numéricos curtos (1, 2, 3, etc) do banco de dados
        if len(v_clean) > 50:
            raise ValueError('patientId cannot exceed 50 characters')
        
        return v_clean

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

