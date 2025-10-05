from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"

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

