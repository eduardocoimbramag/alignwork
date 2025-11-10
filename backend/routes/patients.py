from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import re
from auth.dependencies import get_db
from models.patient import Patient
from schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientPaginatedResponse

router = APIRouter(prefix="/v1/patients", tags=["patients"])

@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(
    patient: PatientCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Cria um novo paciente
    
    - **tenant_id**: ID do tenant (isolamento multi-tenant)
    - **name**: Nome completo do paciente
    - **cpf**: CPF do paciente (único)
    - **phone**: Telefone de contato
    - **email**: Email (opcional)
    - **address**: Endereço completo
    - **notes**: Observações adicionais (opcional)
    """
    response.headers["Cache-Control"] = "no-store"
    
    # CPF já está normalizado pelo schema (somente dígitos)
    # Verificar se CPF já existe no mesmo tenant (isolamento multi-tenant)
    existing_patient = db.query(Patient).filter(
        Patient.cpf == patient.cpf,
        Patient.tenant_id == patient.tenant_id
    ).first()
    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail=f"Patient with CPF {patient.cpf} already exists"
        )
    
    try:
        db_patient = Patient(
            tenant_id=patient.tenant_id,
            name=patient.name,
            cpf=patient.cpf,
            phone=patient.phone,
            email=patient.email,
            address=patient.address,
            notes=patient.notes
        )
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        # DEBUG: Verificar se o paciente foi realmente salvo
        verify = db.query(Patient).filter(Patient.id == db_patient.id).first()
        if verify:
            print(f"✅ Patient created: ID={db_patient.id}, name={patient.name}, tenant={patient.tenant_id}")
            print(f"✅ VERIFICATION: Patient ID={db_patient.id} confirmed in database")
        else:
            print(f"❌ WARNING: Patient ID={db_patient.id} NOT found after commit!")
        
        return db_patient
        
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create patient: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create patient. Please try again later."
        )

@router.get("/", response_model=PatientPaginatedResponse)
def list_patients(
    response: Response,
    tenant_id: str = Query(..., alias="tenantId", description="ID do tenant"),
    search: Optional[str] = Query(None, description="Buscar por nome ou CPF"),
    page: int = Query(1, ge=1, description="Número da página (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db),
):
    """
    Lista pacientes com paginação e busca
    
    - **tenantId**: ID do tenant (obrigatório)
    - **search**: Buscar por nome ou CPF (opcional)
    - **page**: Número da página (default: 1)
    - **page_size**: Itens por página (default: 50, max: 100)
    """
    response.headers["Cache-Control"] = "no-store"
    
    # Build base query
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    
    # Aplicar filtro de busca
    if search:
        search_term = f"%{search}%"
        # Normalizar termo de busca (remover máscara) para buscar CPF
        search_normalized = re.sub(r'\D', '', search)
        query = query.filter(
            (Patient.name.ilike(search_term)) | 
            (Patient.cpf.like(f"%{search_normalized}%"))
        )
    
    # Contar total (antes de aplicar paginação)
    total = query.count()
    
    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    # Validar página solicitada
    if page > total_pages and total > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Page {page} does not exist. Total pages: {total_pages}"
        )
    
    # Aplicar paginação e ordenar por nome
    patients = (
        query
        .order_by(Patient.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    # Retornar resposta paginada
    return PatientPaginatedResponse(
        data=patients,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    tenant_id: str = Query(..., alias="tenantId"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Busca um paciente específico por ID
    
    - **patient_id**: ID do paciente
    - **tenantId**: ID do tenant (isolamento multi-tenant)
    """
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.tenant_id == tenant_id
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    return patient

@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    tenant_id: str = Query(..., alias="tenantId"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Atualiza informações de um paciente
    
    - **patient_id**: ID do paciente
    - **tenantId**: ID do tenant (isolamento multi-tenant)
    """
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.tenant_id == tenant_id
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Atualizar apenas campos fornecidos
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    try:
        db.commit()
        db.refresh(patient)
        print(f"✅ Patient updated: ID={patient_id}, tenant={tenant_id}")
        return patient
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to update patient: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update patient. Please try again later."
        )

@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    tenant_id: str = Query(..., alias="tenantId"),
    db: Session = Depends(get_db),
):
    """
    Remove um paciente
    
    - **patient_id**: ID do paciente
    - **tenantId**: ID do tenant (isolamento multi-tenant)
    """
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.tenant_id == tenant_id
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    try:
        db.delete(patient)
        db.commit()
        print(f"✅ Patient deleted: ID={patient_id}, tenant={tenant_id}")
        return None
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to delete patient: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete patient. Please try again later."
        )

@router.get("/count", response_model=dict)
def count_patients(
    tenant_id: str = Query(..., alias="tenantId"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Conta total de pacientes de um tenant
    
    - **tenantId**: ID do tenant
    """
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    count = db.query(Patient).filter(Patient.tenant_id == tenant_id).count()
    
    return {"count": count}

