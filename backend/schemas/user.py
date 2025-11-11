from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
import re

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None  # Deprecated
    is_active: bool = True
    is_verified: bool = False

class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = "Usuario"
    last_name: Optional[str] = "Padrao"

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_professional: Optional[str] = None
    phone_clinic: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    @validator('first_name', 'last_name')
    def validate_name(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        return v.strip() if v else None
    
    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v not in ['male', 'female', 'other', 'prefer_not_to_say']:
            raise ValueError('Gênero inválido. Valores aceitos: male, female, other, prefer_not_to_say')
        return v
    
    @validator('phone_personal', 'phone_professional', 'phone_clinic')
    def validate_phone(cls, v):
        if v:
            # Remover caracteres não numéricos
            phone_numbers = re.sub(r'\D', '', v)
            if len(phone_numbers) < 10:
                raise ValueError('Telefone deve ter pelo menos 10 dígitos')
        return v

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    full_name: Optional[str] = None  # Deprecated - manter para compatibilidade
    gender: Optional[str] = None
    profile_photo_url: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_professional: Optional[str] = None
    phone_clinic: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
