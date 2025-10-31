from sqlalchemy import Column, Integer, String, DateTime, Text
from models.user import Base
from datetime import datetime

class Patient(Base):
    """
    Modelo de Paciente/Cliente
    
    Armazena informações dos pacientes que serão atendidos.
    Multi-tenant: cada paciente pertence a um tenant_id específico.
    """
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # Informações pessoais
    name = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    
    # Endereço
    address = Column(Text, nullable=False)
    
    # Observações/notas
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

