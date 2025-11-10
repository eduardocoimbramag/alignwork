from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from auth.dependencies import get_db
from models.consultorio import Consultorio
from schemas.consultorio import ConsultorioCreate, ConsultorioUpdate, ConsultorioResponse

router = APIRouter(prefix="/v1/consultorios", tags=["consultorios"])

@router.post("/", response_model=ConsultorioResponse, status_code=201)
def create_consultorio(
    consultorio: ConsultorioCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Cria um novo consultório
    
    - **tenant_id**: ID do tenant (isolamento multi-tenant)
    - **nome**: Nome do consultório
    - **estado**: UF do estado (ex: "SP", "PE")
    - **cidade**: Nome da cidade
    - **cep**: CEP no formato "00000-000"
    - **rua**: Nome da rua/logradouro
    - **numero**: Número do endereço
    - **bairro**: Nome do bairro
    - **informacoes_adicionais**: Informações adicionais (opcional)
    """
    response.headers["Cache-Control"] = "no-store"
    
    try:
        db_consultorio = Consultorio(
            tenant_id=consultorio.tenant_id,
            nome=consultorio.nome,
            estado=consultorio.estado,
            cidade=consultorio.cidade,
            cep=consultorio.cep,
            rua=consultorio.rua,
            numero=consultorio.numero,
            bairro=consultorio.bairro,
            informacoes_adicionais=consultorio.informacoes_adicionais
        )
        db.add(db_consultorio)
        db.commit()
        db.refresh(db_consultorio)
        
        print(f"✅ Consultorio created: ID={db_consultorio.id}, nome={consultorio.nome}, tenant={consultorio.tenant_id}")
        return db_consultorio
        
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create consultorio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create consultorio. Please try again later."
        )

@router.get("/", response_model=list[ConsultorioResponse])
def list_consultorios(
    response: Response,
    tenant_id: str = Query(..., alias="tenant_id", description="ID do tenant"),
    db: Session = Depends(get_db),
):
    """
    Lista consultórios de um tenant
    
    - **tenant_id**: ID do tenant (obrigatório)
    """
    response.headers["Cache-Control"] = "no-store"
    
    consultorios = (
        db.query(Consultorio)
        .filter(Consultorio.tenant_id == tenant_id)
        .order_by(Consultorio.nome)
        .all()
    )
    
    return consultorios

@router.get("/{consultorio_id}", response_model=ConsultorioResponse)
def get_consultorio(
    consultorio_id: int,
    tenant_id: str = Query(..., alias="tenant_id"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Busca um consultório específico por ID
    
    - **consultorio_id**: ID do consultório
    - **tenant_id**: ID do tenant (isolamento multi-tenant)
    """
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    consultorio = db.query(Consultorio).filter(
        Consultorio.id == consultorio_id,
        Consultorio.tenant_id == tenant_id
    ).first()
    
    if not consultorio:
        raise HTTPException(
            status_code=404,
            detail=f"Consultorio with ID {consultorio_id} not found"
        )
    
    return consultorio

@router.put("/{consultorio_id}", response_model=ConsultorioResponse)
def update_consultorio(
    consultorio_id: int,
    consultorio_update: ConsultorioUpdate,
    tenant_id: str = Query(..., alias="tenant_id"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Atualiza informações de um consultório
    
    - **consultorio_id**: ID do consultório
    - **tenant_id**: ID do tenant (isolamento multi-tenant)
    """
    if response:
        response.headers["Cache-Control"] = "no-store"
    
    consultorio = db.query(Consultorio).filter(
        Consultorio.id == consultorio_id,
        Consultorio.tenant_id == tenant_id
    ).first()
    
    if not consultorio:
        raise HTTPException(
            status_code=404,
            detail=f"Consultorio with ID {consultorio_id} not found"
        )
    
    # Atualizar apenas campos fornecidos
    update_data = consultorio_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consultorio, field, value)
    
    try:
        db.commit()
        db.refresh(consultorio)
        print(f"✅ Consultorio updated: ID={consultorio_id}, tenant={tenant_id}")
        return consultorio
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to update consultorio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update consultorio. Please try again later."
        )

@router.delete("/{consultorio_id}", status_code=204)
def delete_consultorio(
    consultorio_id: int,
    tenant_id: str = Query(..., alias="tenant_id"),
    db: Session = Depends(get_db),
):
    """
    Remove um consultório
    
    - **consultorio_id**: ID do consultório
    - **tenant_id**: ID do tenant (isolamento multi-tenant)
    """
    consultorio = db.query(Consultorio).filter(
        Consultorio.id == consultorio_id,
        Consultorio.tenant_id == tenant_id
    ).first()
    
    if not consultorio:
        raise HTTPException(
            status_code=404,
            detail=f"Consultorio with ID {consultorio_id} not found"
        )
    
    try:
        db.delete(consultorio)
        db.commit()
        print(f"✅ Consultorio deleted: ID={consultorio_id}, tenant={tenant_id}")
        return None
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to delete consultorio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete consultorio. Please try again later."
        )

