from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from auth.dependencies import get_db
from models.appointment import Appointment
from schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/v1/appointments", tags=["appointments"])

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

