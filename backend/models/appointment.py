from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.user import Base
from datetime import datetime

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    patient_id = Column(String, nullable=False)
    starts_at = Column(DateTime, nullable=False)  # UTC
    duration_min = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

