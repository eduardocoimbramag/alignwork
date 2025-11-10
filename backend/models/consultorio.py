from sqlalchemy import Column, Integer, String, DateTime, Text
from models.user import Base
from datetime import datetime

class Consultorio(Base):
    """
    Modelo de Consultório/Local de Atendimento
    
    Armazena informações dos locais de atendimento onde os pacientes são recebidos.
    Multi-tenant: cada consultório pertence a um tenant_id específico.
    """
    __tablename__ = "consultorios"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # Informações básicas
    nome = Column(String, nullable=False)
    estado = Column(String(2), nullable=False)  # UF (ex: "SP", "PE")
    cidade = Column(String, nullable=False)
    
    # Endereço
    cep = Column(String(9), nullable=False)  # Formato: "01310-100"
    rua = Column(String, nullable=False)
    numero = Column(String, nullable=False)
    bairro = Column(String, nullable=False)
    informacoes_adicionais = Column(Text, nullable=True)  # Complemento, sala, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

