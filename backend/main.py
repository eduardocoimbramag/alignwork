from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models.user import Base
from routes import auth, appointments, patients
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
app.include_router(appointments.router, prefix="/api")
app.include_router(patients.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AlignWork API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
