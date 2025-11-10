from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.user import Base
from models.consultorio import Consultorio
from datetime import datetime

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # ForeignKey correto com Integer
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # ForeignKey para consultório (nullable=True inicialmente para migração)
    consultorio_id = Column(Integer, ForeignKey("consultorios.id"), nullable=True, index=True)
    
    # Relacionamentos para facilitar queries
    patient = relationship("Patient", backref="appointments")
    consultorio = relationship("Consultorio", backref="appointments")
    
    starts_at = Column(DateTime, nullable=False)  # UTC
    duration_min = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

