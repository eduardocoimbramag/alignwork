from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.user import User
from schemas.auth import UserRegister, UserLogin, Token, RefreshToken
from schemas.user import UserResponse
from auth.utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from auth.dependencies import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=Token)
@limiter.limit("3/hour")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user. Rate limit: 3 registrations per hour per IP."""
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    # TODO: Remover username após migração de banco de dados
    # Usando email como username temporário até a coluna ser removida
    temp_username = user_data.email.split('@')[0]  # Parte antes do @
    db_user = User(
        email=user_data.email,
        username=temp_username,  # Temporário - será removido após migração
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(
        data={"sub": db_user.email, "user_id": db_user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": db_user.email, "user_id": db_user.id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login user and return tokens. Rate limit: 5 attempts per minute per IP."""
    print(f"Login attempt: {user_credentials.email}")
    
    user = db.query(User).filter(User.email == user_credentials.email).first()
    print(f"User found: {user is not None}")
    
    if user:
        print(f"User email: {user.email}")
        # print(f"User password hash: {user.hashed_password}")  # REMOVIDO: exposição de dados sensíveis (P0-001)
        print(f"User active: {user.is_active}")
        print(f"User verified: {user.is_verified}")
        
        password_valid = verify_password(user_credentials.password, user.hashed_password)
        print(f"Password valid: {password_valid}")
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        print("Login failed: user not found or invalid password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to False for development
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to False for development
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: Optional[str] = Cookie(None),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    try:
        token_data = verify_token(refresh_token, "refresh")
        user = db.query(User).filter(User.email == token_data["email"]).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": user.email, "user_id": user.id}
        )
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing cookies."""
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user
