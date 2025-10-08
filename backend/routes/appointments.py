from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional
from auth.dependencies import get_db
from models.appointment import Appointment
from schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from sqlalchemy import and_

router = APIRouter(prefix="/v1/appointments", tags=["appointments"])

def _count_bucket(db: Session, tenant_id: str, start_local: datetime, end_local: datetime, TZ: ZoneInfo):
    # Converte limites locais -> UTC para filtrar starts_at (UTC)
    start_utc = start_local.astimezone(ZoneInfo("UTC"))
    end_utc   = end_local.astimezone(ZoneInfo("UTC"))

    q = (
        db.query(Appointment)
          .filter(Appointment.tenant_id == tenant_id)
          .filter(Appointment.starts_at >= start_utc)
          .filter(Appointment.starts_at <  end_utc)
          .filter(Appointment.status.in_(["confirmed","pending"]))
    )

    confirmed = q.filter(Appointment.status == "confirmed").count()
    pending   = q.filter(Appointment.status == "pending").count()
    return {"confirmed": confirmed, "pending": pending}

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
    
    # Parse ISO strings to datetime
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

@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    response: Response,
    tenantId: str = Query(...),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    """Lista agendamentos com filtros opcionais por data."""
    response.headers["Cache-Control"] = "no-store"
    
    query = db.query(Appointment).filter(Appointment.tenant_id == tenantId)
    
    if from_date:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.starts_at >= from_dt)
    
    if to_date:
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.starts_at < to_dt)
    
    appointments = query.order_by(Appointment.starts_at).all()
    return appointments

@router.get("/mega-stats")
def mega_stats(
    response: Response,
    tenantId: str = Query(...),
    tz: str = Query("America/Recife"),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

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
    return stats

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    # Parse ISO string to datetime
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
    return db_appointment

@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    appointment: AppointmentUpdate,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db_appointment.status = appointment.status
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

