from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re

class PatientBase(BaseModel):
    """Schema base para Patient"""
    name: str
    cpf: str
    phone: str
    email: Optional[str] = None
    address: str
    notes: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('name is required and cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('name must be at least 3 characters long')
        if len(v) > 200:
            raise ValueError('name cannot exceed 200 characters')
        return v.strip()
    
    @validator('cpf')
    def validate_cpf(cls, v):
        if not v or not v.strip():
            raise ValueError('cpf is required and cannot be empty')
        # Remove caracteres não numéricos e normaliza
        cpf_numbers = re.sub(r'\D', '', v)
        if len(cpf_numbers) != 11:
            raise ValueError('cpf must have exactly 11 digits')
        # Verifica se não são todos os dígitos iguais
        if cpf_numbers == cpf_numbers[0] * 11:
            raise ValueError('cpf cannot have all digits the same')
        # Retornar CPF normalizado (somente dígitos) para armazenar no banco
        return cpf_numbers
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('phone is required and cannot be empty')
        # Remove caracteres não numéricos
        phone_numbers = re.sub(r'\D', '', v)
        if len(phone_numbers) < 10:
            raise ValueError('phone must have at least 10 digits')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('email must be a valid email address')
        return v
    
    @validator('address')
    def validate_address(cls, v):
        if not v or not v.strip():
            raise ValueError('address is required and cannot be empty')
        if len(v.strip()) < 5:
            raise ValueError('address must be at least 5 characters long')
        return v.strip()

class PatientCreate(PatientBase):
    """Schema para criar um novo Patient"""
    tenant_id: str
    
    @validator('tenant_id')
    def validate_tenant_id(cls, v):
        if not v or not v.strip():
            raise ValueError('tenant_id is required and cannot be empty')
        return v

class PatientUpdate(BaseModel):
    """Schema para atualizar um Patient (todos os campos opcionais)"""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class PatientResponse(PatientBase):
    """Schema de resposta da API"""
    id: int
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PatientPaginatedResponse(BaseModel):
    """Resposta paginada de patients"""
    data: list[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

