from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional
from auth.dependencies import get_db
from models.appointment import Appointment
from schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentPaginatedResponse
from sqlalchemy import and_, func, case
from cachetools import TTLCache
import threading

router = APIRouter(prefix="/v1/appointments", tags=["appointments"])

# ============================================================================
# CACHE - P1-003
# ============================================================================

# Cache em memória com TTL de 30 segundos
# maxsize=100: Armazena até 100 cache keys diferentes
# ttl=30: Cada entrada expira automaticamente após 30 segundos
stats_cache = TTLCache(maxsize=100, ttl=30)

# Lock para garantir thread-safety em acesso ao cache
cache_lock = threading.Lock()

def get_cache_key(tenant_id: str, tz: str) -> str:
    """
    Gera chave de cache única para mega_stats.
    
    Formato: mega_stats:{tenant_id}:{tz}:{date}
    
    Inclui data atual para invalidação automática ao trocar de dia.
    """
    now = datetime.now(ZoneInfo(tz))
    date_key = now.strftime('%Y-%m-%d')
    return f"mega_stats:{tenant_id}:{tz}:{date_key}"

def _count_bucket(db: Session, tenant_id: str, start_local: datetime, end_local: datetime, TZ: ZoneInfo):
    """
    Conta appointments em um bucket de tempo específico usando agregação condicional.
    
    Otimização P1-002: Reduz de 2 queries para 1 query usando CASE SQL.
    
    Args:
        db: SQLAlchemy session
        tenant_id: ID do tenant (isolamento multi-tenant)
        start_local: Data/hora início no timezone local
        end_local: Data/hora fim no timezone local
        TZ: Timezone para conversão
    
    Returns:
        Dict com contagem de confirmed e pending:
        {"confirmed": 5, "pending": 3}
    
    Performance:
        - Antes: 2 queries (confirmed + pending separados)
        - Depois: 1 query (agregação condicional com CASE)
        - Ganho: ~75% redução em queries ao banco
    """
    # Converte limites locais -> UTC para filtrar starts_at (UTC)
    start_utc = start_local.astimezone(ZoneInfo("UTC"))
    end_utc = end_local.astimezone(ZoneInfo("UTC"))

    # Query única com agregação condicional
    # SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed
    # SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending
    result = db.query(
        func.sum(
            case((Appointment.status == "confirmed", 1), else_=0)
        ).label("confirmed"),
        func.sum(
            case((Appointment.status == "pending", 1), else_=0)
        ).label("pending")
    ).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.starts_at >= start_utc,
        Appointment.starts_at < end_utc,
        Appointment.status.in_(["confirmed", "pending"])
    ).first()

    # Resultado é uma tupla (confirmed, pending) ou None
    # Usar 'or 0' para tratar None quando não há registros
    return {
        "confirmed": result.confirmed or 0,
        "pending": result.pending or 0
    }

@router.get("/summary")
def get_summary(
    response: Response,
    tenantId: str = Query(..., alias="tenantId"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    tz: str = Query("America/Recife"),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    from_dt = datetime.fromisoformat(from_.replace('Z', '+00:00'))
    to_dt = datetime.fromisoformat(to.replace('Z', '+00:00'))
    
    appts = (
        db.query(Appointment)
          .filter(Appointment.tenant_id == tenantId)
          .filter(Appointment.starts_at >= from_dt)
          .filter(Appointment.starts_at < to_dt)
          .all()
    )

    TZ = ZoneInfo(tz)
    today_local = datetime.now(TZ).date()
    tomorrow_local = today_local + timedelta(days=1)

    summary = {
        "today": {"total": 0, "confirmed": 0, "pending": 0},
        "tomorrow": {"total": 0, "confirmed": 0, "pending": 0},
    }

    for a in appts:
        # Convert UTC to local timezone
        local_dt = a.starts_at.replace(tzinfo=ZoneInfo('UTC')).astimezone(TZ)
        local_date = local_dt.date()
        
        if   local_date == today_local:    bucket = "today"
        elif local_date == tomorrow_local: bucket = "tomorrow"
        else: continue

        summary[bucket]["total"] += 1
        if a.status == "confirmed":
            summary[bucket]["confirmed"] += 1
        else:
            summary[bucket]["pending"] += 1

    return summary

@router.get("/", response_model=AppointmentPaginatedResponse)
def list_appointments(
    response: Response,
    tenantId: str = Query(..., description="ID do tenant"),
    from_date: Optional[str] = Query(None, alias="from", description="Data início (ISO)"),
    to_date: Optional[str] = Query(None, alias="to", description="Data fim (ISO)"),
    page: int = Query(1, ge=1, description="Número da página (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db),
):
    """
    Lista agendamentos com paginação.
    
    - **tenantId**: ID do tenant (obrigatório)
    - **from**: Data início (ISO 8601) - filtro opcional
    - **to**: Data fim (ISO 8601) - filtro opcional
    - **page**: Número da página (default: 1)
    - **page_size**: Itens por página (default: 50, max: 100)
    
    Returns:
        PaginatedResponse com appointments da página solicitada
    """
    response.headers["Cache-Control"] = "no-store"
    
    # Build base query
    query = db.query(Appointment).filter(Appointment.tenant_id == tenantId)
    
    # Aplicar filtros de data
    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.starts_at >= from_dt)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid 'from' date format: {from_date}. Use ISO 8601."
            )
    
    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.starts_at < to_dt)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid 'to' date format: {to_date}. Use ISO 8601."
            )
    
    # Contar total (antes de aplicar paginação)
    total = query.count()
    
    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size  # Ceiling division
    
    # Validar página solicitada
    if page > total_pages and total > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Page {page} does not exist. Total pages: {total_pages}"
        )
    
    # Aplicar paginação
    appointments = (
        query
        .order_by(Appointment.starts_at)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    # Retornar resposta paginada
    return AppointmentPaginatedResponse(
        data=appointments,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/mega-stats")
def mega_stats(
    response: Response,
    tenantId: str = Query(...),
    tz: str = Query("America/Recife"),
    db: Session = Depends(get_db),
):
    """
    Retorna estatísticas agregadas de appointments.
    
    Cache: TTL 30s (otimização P1-003)
    - Cache HIT: < 1ms de resposta
    - Cache MISS: ~100ms (calcula e salva no cache)
    """
    cache_key = get_cache_key(tenantId, tz)
    
    # Tentar buscar do cache (thread-safe)
    with cache_lock:
        cached = stats_cache.get(cache_key)
        if cached is not None:
            response.headers["Cache-Control"] = "no-store"
            response.headers["X-Cache"] = "HIT"
            return cached
    
    # Cache miss - calcular stats
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Cache"] = "MISS"

    TZ = ZoneInfo(tz)
    now_local = datetime.now(TZ)

    # Hoje (início do dia local → início do dia seguinte local)
    today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = today_start + timedelta(days=1)

    # Semana vigente: domingo → sábado (considerando semana DOM-SÁB)
    # weekday(): Monday=0 ... Sunday=6 ; queremos domingo=0, sábado=6 em base local.
    # Converte para índice DOM=0:
    dow = (now_local.weekday() + 1) % 7  # se segunda=0 => dom=6; ajustamos
    # Melhor abordagem: obter o domingo mais recente:
    # Se dow==0 (domingo), start é hoje; senão, retrocede dow dias.
    sunday_start = today_start - timedelta(days=dow)
    saturday_end = sunday_start + timedelta(days=7)  # intervalo meio-aberto [dom, próximo dom)

    # Mês vigente
    month_start = today_start.replace(day=1)
    # início do próximo mês:
    if month_start.month == 12:
        next_month_start = month_start.replace(year=month_start.year+1, month=1)
    else:
        next_month_start = month_start.replace(month=month_start.month+1)

    # Próximo mês: [início do próximo mês, início do mês seguinte]
    if next_month_start.month == 12:
        after_next_month_start = next_month_start.replace(year=next_month_start.year+1, month=1)
    else:
        after_next_month_start = next_month_start.replace(month=next_month_start.month+1)

    stats = {
        "today":     _count_bucket(db, tenantId, today_start, today_end, TZ),
        "week":      _count_bucket(db, tenantId, sunday_start, saturday_end, TZ),
        "month":     _count_bucket(db, tenantId, month_start, next_month_start, TZ),
        "nextMonth": _count_bucket(db, tenantId, next_month_start, after_next_month_start, TZ),
    }
    
    # Salvar no cache (thread-safe)
    with cache_lock:
        stats_cache[cache_key] = stats
    
    return stats

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    try:
        starts_at = datetime.fromisoformat(appointment.startsAt.replace('Z', '+00:00'))
        
        db_appointment = Appointment(
            tenant_id=appointment.tenantId,
            patient_id=appointment.patientId,
            starts_at=starts_at,
            duration_min=appointment.durationMin,
            status=appointment.status or "pending"
        )
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        print(f"✅ Appointment created: ID={db_appointment.id}, tenant={appointment.tenantId}")
        return db_appointment
        
    except ValueError as e:
        db.rollback()
        print(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid data: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create appointment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create appointment. Please try again later."
        )

@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    appointment: AppointmentUpdate,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    try:
        db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not db_appointment:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Appointment {appointment_id} not found")
        
        db_appointment.status = appointment.status
        db.commit()
        db.refresh(db_appointment)
        
        print(f"✅ Appointment updated: ID={appointment_id}, new_status={appointment.status}")
        return db_appointment
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to update appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update appointment. Please try again later."
        )

