from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models.user import Base
from models.consultorio import Consultorio  # Importar para criar a tabela
from routes import auth, appointments, patients, consultorios, users
from auth.dependencies import get_db

# Load environment variables
load_dotenv()

# Database setup
# Definir caminho absoluto para o banco na raiz do projeto
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "alignwork.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

print(f"📦 Database location: {DATABASE_PATH}")
print(f"📦 File exists: {DATABASE_PATH.exists()}")
print(f"📦 File size: {DATABASE_PATH.stat().st_size if DATABASE_PATH.exists() else 0} bytes")

engine = create_engine(
    DATABASE_URL, 
    connect_args={
        "check_same_thread": False,
        "timeout": 30
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# FastAPI app
app = FastAPI(
    title="AlignWork API",
    description="API for AlignWork - Healthcare Management System",
    version="1.0.0"
)

# Register limiter with app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom exception handler for validation errors with PAST_START code
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic validation errors.
    Checks for PAST_START code in error messages and returns structured response.
    """
    errors = exc.errors()
    
    # Check if any error is related to PAST_START
    for error in errors:
        if error.get('type') == 'value_error':
            msg = error.get('msg', '')
            # Check if the error message contains PAST_START context
            # The Pydantic error will have the message but we need to extract context
            # from the original exception if available
            if 'cannot be scheduled in the past' in msg.lower():
                # Try to parse the error message to extract timestamps
                # This is a fallback - ideally we'd have the context in the error
                # For now, return a structured error without full context
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={
                        "detail": [
                            {
                                "loc": error.get('loc', []),
                                "msg": msg,
                                "type": "value_error",
                                "code": "PAST_START"
                            }
                        ]
                    }
                )
    
    # Default validation error response
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors}
    )

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency override for get_db
def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(consultorios.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AlignWork API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
