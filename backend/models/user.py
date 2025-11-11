from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # TODO: Remover username após migração de banco de dados
    # A coluna ainda existe no banco - será removida via migração Alembic
    # O campo não é mais usado no código (schemas/rotas já foram atualizados)
    username = Column(String, unique=True, index=True, nullable=False)  # Deprecated - será removido
    hashed_password = Column(String, nullable=False)
    
    # Campos de perfil
    full_name = Column(String, nullable=True)  # Deprecated - usar first_name + last_name
    first_name = Column(String, nullable=False, default="Usuario")
    last_name = Column(String, nullable=False, default="Padrao")
    gender = Column(String(50), nullable=True)  # 'male', 'female', 'other', 'prefer_not_to_say'
    profile_photo_url = Column(String, nullable=True)
    
    # Telefones
    phone_personal = Column(String, nullable=True)
    phone_professional = Column(String, nullable=True)
    phone_clinic = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
