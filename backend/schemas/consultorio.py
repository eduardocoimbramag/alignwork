from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re

class ConsultorioBase(BaseModel):
    """Schema base para Consultorio"""
    nome: str
    estado: str
    cidade: str
    cep: str
    rua: str
    numero: str
    bairro: str
    informacoes_adicionais: Optional[str] = None
    
    @validator('nome')
    def validate_nome(cls, v):
        if not v or not v.strip():
            raise ValueError('nome is required and cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('nome must be at least 3 characters long')
        if len(v) > 200:
            raise ValueError('nome cannot exceed 200 characters')
        return v.strip()
    
    @validator('estado')
    def validate_estado(cls, v):
        if not v or not v.strip():
            raise ValueError('estado is required and cannot be empty')
        # Remove espaços e converte para maiúsculas
        estado = v.strip().upper()
        if len(estado) != 2:
            raise ValueError('estado must be a 2-character UF (e.g., "SP", "PE")')
        # Valida se é uma UF válida do Brasil (lista básica)
        ufs_validas = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
            'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ]
        if estado not in ufs_validas:
            raise ValueError(f'estado must be a valid Brazilian UF. Got: {estado}')
        return estado
    
    @validator('cidade')
    def validate_cidade(cls, v):
        if not v or not v.strip():
            raise ValueError('cidade is required and cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('cidade must be at least 2 characters long')
        if len(v) > 200:
            raise ValueError('cidade cannot exceed 200 characters')
        return v.strip()
    
    @validator('cep')
    def validate_cep(cls, v):
        if not v or not v.strip():
            raise ValueError('cep is required and cannot be empty')
        # Remove caracteres não numéricos
        cep_numbers = re.sub(r'\D', '', v)
        if len(cep_numbers) != 8:
            raise ValueError('cep must have exactly 8 digits')
        # Formata como "00000-000"
        return f"{cep_numbers[:5]}-{cep_numbers[5:]}"
    
    @validator('rua')
    def validate_rua(cls, v):
        if not v or not v.strip():
            raise ValueError('rua is required and cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('rua must be at least 3 characters long')
        if len(v) > 200:
            raise ValueError('rua cannot exceed 200 characters')
        return v.strip()
    
    @validator('numero')
    def validate_numero(cls, v):
        if not v or not v.strip():
            raise ValueError('numero is required and cannot be empty')
        if len(v.strip()) < 1:
            raise ValueError('numero must be at least 1 character long')
        if len(v) > 20:
            raise ValueError('numero cannot exceed 20 characters')
        return v.strip()
    
    @validator('bairro')
    def validate_bairro(cls, v):
        if not v or not v.strip():
            raise ValueError('bairro is required and cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('bairro must be at least 2 characters long')
        if len(v) > 200:
            raise ValueError('bairro cannot exceed 200 characters')
        return v.strip()
    
    @validator('informacoes_adicionais')
    def validate_informacoes_adicionais(cls, v):
        if v and len(v) > 500:
            raise ValueError('informacoes_adicionais cannot exceed 500 characters')
        return v.strip() if v else None

class ConsultorioCreate(ConsultorioBase):
    """Schema para criar um novo Consultorio"""
    tenant_id: str
    
    @validator('tenant_id')
    def validate_tenant_id(cls, v):
        if not v or not v.strip():
            raise ValueError('tenant_id is required and cannot be empty')
        return v

class ConsultorioUpdate(BaseModel):
    """Schema para atualizar um Consultorio (todos os campos opcionais)"""
    nome: Optional[str] = None
    estado: Optional[str] = None
    cidade: Optional[str] = None
    cep: Optional[str] = None
    rua: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    informacoes_adicionais: Optional[str] = None
    
    @validator('nome')
    def validate_nome(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('nome cannot be empty')
            if len(v.strip()) < 3:
                raise ValueError('nome must be at least 3 characters long')
            if len(v) > 200:
                raise ValueError('nome cannot exceed 200 characters')
            return v.strip()
        return v
    
    @validator('estado')
    def validate_estado(cls, v):
        if v is not None:
            estado = v.strip().upper()
            if len(estado) != 2:
                raise ValueError('estado must be a 2-character UF')
            ufs_validas = [
                'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
            ]
            if estado not in ufs_validas:
                raise ValueError(f'estado must be a valid Brazilian UF. Got: {estado}')
            return estado
        return v
    
    @validator('cidade', 'rua', 'bairro')
    def validate_string_field(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('field cannot be empty')
            return v.strip()
        return v
    
    @validator('cep')
    def validate_cep(cls, v):
        if v is not None:
            cep_numbers = re.sub(r'\D', '', v)
            if len(cep_numbers) != 8:
                raise ValueError('cep must have exactly 8 digits')
            return f"{cep_numbers[:5]}-{cep_numbers[5:]}"
        return v
    
    @validator('numero')
    def validate_numero(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('numero cannot be empty')
            if len(v) > 20:
                raise ValueError('numero cannot exceed 20 characters')
            return v.strip()
        return v
    
    @validator('informacoes_adicionais')
    def validate_informacoes_adicionais(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('informacoes_adicionais cannot exceed 500 characters')
        return v.strip() if v else None

class ConsultorioResponse(ConsultorioBase):
    """Schema de resposta da API"""
    id: int
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

