from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
import os
import shutil
from typing import Optional

from models.user import User
from schemas.user import UserResponse, UserUpdate
from auth.dependencies import get_db, get_current_user

router = APIRouter(prefix="/v1/users", tags=["users"])

# Diretório para upload de fotos
UPLOAD_DIR = Path(__file__).parent.parent / "uploads" / "profile_photos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Configurações de upload
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    response: Response = None
):
    """Retorna o perfil do usuário logado"""
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    print(f"📋 GET /v1/users/me - user_id={current_user.id}, email={current_user.email}")
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    response: Response = None
):
    """Atualiza o perfil do usuário logado"""
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    print(f"✏️ PATCH /v1/users/me - user_id={current_user.id}")
    
    try:
        # Atualizar campos fornecidos
        update_data = user_update.dict(exclude_unset=True)
        
        # Validar email único se fornecido
        if "email" in update_data and update_data["email"] != current_user.email:
            existing_user = db.query(User).filter(
                User.email == update_data["email"],
                User.id != current_user.id
            ).first()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Email já está em uso por outro usuário"
                )
        
        # Atualizar campos
        changed_fields = []
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
                changed_fields.append(field)
        
        db.commit()
        db.refresh(current_user)
        
        print(f"✏️ User profile updated: user_id={current_user.id}, fields={changed_fields}")
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to update user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile. Please try again later."
        )


@router.post("/me/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload de foto de perfil"""
    print(f"📷 POST /v1/users/me/profile-photo - user_id={current_user.id}")
    
    try:
        # Validar extensão
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Formato de arquivo não suportado. Use PNG ou JPG"
            )
        
        # Validar tamanho
        file.file.seek(0, 2)  # Mover para o final do arquivo
        file_size = file.file.tell()
        file.file.seek(0)  # Voltar para o início
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Arquivo muito grande. Tamanho máximo: 5MB"
            )
        
        # Remover foto anterior se existir
        if current_user.profile_photo_url:
            old_photo_path = UPLOAD_DIR / Path(current_user.profile_photo_url).name
            if old_photo_path.exists():
                old_photo_path.unlink()
                print(f"🗑️ Old photo removed: {old_photo_path.name}")
        
        # Gerar nome único para o arquivo
        unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Salvar arquivo
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Atualizar URL no banco
        photo_url = f"/api/v1/uploads/profile_photos/{unique_filename}"
        current_user.profile_photo_url = photo_url
        db.commit()
        
        file_size_mb = file_size / (1024 * 1024)
        print(f"📷 Profile photo uploaded: user_id={current_user.id}, filename={unique_filename}, size={file_size_mb:.2f}MB")
        
        return {
            "profile_photo_url": photo_url,
            "message": "Foto de perfil atualizada com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to upload photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao fazer upload da foto. Tente novamente."
        )


@router.delete("/me/profile-photo")
def delete_profile_photo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a foto de perfil"""
    print(f"🗑️ DELETE /v1/users/me/profile-photo - user_id={current_user.id}")
    
    try:
        if not current_user.profile_photo_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhuma foto de perfil encontrada"
            )
        
        # Remover arquivo
        photo_filename = Path(current_user.profile_photo_url).name
        file_path = UPLOAD_DIR / photo_filename
        if file_path.exists():
            file_path.unlink()
            print(f"🗑️ Photo file removed: {photo_filename}")
        
        # Atualizar banco
        current_user.profile_photo_url = None
        db.commit()
        
        print(f"🗑️ Profile photo removed: user_id={current_user.id}")
        
        return {"message": "Foto de perfil removida com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to delete photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao remover foto. Tente novamente."
        )


@router.get("/uploads/profile_photos/{filename}")
async def serve_profile_photo(filename: str):
    """Serve fotos de perfil"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada"
        )
    
    # Validar que o arquivo está no diretório correto (segurança)
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    return FileResponse(file_path)

