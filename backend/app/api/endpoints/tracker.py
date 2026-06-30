from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, SMTPSettings
from app.core.security import get_current_user
from app.core.config import TEMP_DIR
import app.services.tracker as tracker_service
from app.services.email import send_application_list_email

router = APIRouter()


@router.get("/")
def get_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tracker_service.get_applications(current_user.id, db)


@router.post("/update")
def update_tracker(
    company: str = Form(...),
    job_title: str = Form(...),
    status: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = tracker_service.update_status(current_user.id, db, company, job_title, status)
    return {"success": success}


@router.post("/update-message")
def update_tracker_message(
    company: str = Form(...),
    job_title: str = Form(...),
    message: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = tracker_service.update_message(current_user.id, db, company, job_title, message)
    return {"success": success}


@router.post("/delete")
def delete_tracker(
    company: str = Form(...),
    job_title: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = tracker_service.delete_application(current_user.id, db, company, job_title)
    return {"success": success}


@router.post("/clear")
def clear_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = tracker_service.clear_tracker(current_user.id, db)
    return {"success": success}


@router.get("/export")
def export_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    apps = tracker_service.get_applications(current_user.id, db)
    if not apps:
        df = pd.DataFrame(columns=tracker_service.COLUMNS)
    else:
        df = pd.DataFrame(apps)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"applications_tracker_{current_user.id}_{timestamp}.xlsx"
    filepath = os.path.join(TEMP_DIR, filename)
    df.to_excel(filepath, index=False, sheet_name="Applications")

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.post("/send-email")
def send_tracker_email(
    email: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    apps = tracker_service.get_applications(current_user.id, db)
    if not apps:
        df = pd.DataFrame(columns=tracker_service.COLUMNS)
    else:
        df = pd.DataFrame(apps)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"applications_tracker_{current_user.id}_{timestamp}.xlsx"
    filepath = os.path.join(TEMP_DIR, filename)
    df.to_excel(filepath, index=False, sheet_name="Applications")

    # Load SMTP settings from DB if configured
    db_settings = db.query(SMTPSettings).filter(SMTPSettings.user_id == current_user.id).first()

    try:
        send_application_list_email(email, filepath, apps, db_settings=db_settings)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Email sending failed: {str(e)}"
        )


@router.get("/smtp-settings")
def get_smtp_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(SMTPSettings).filter(SMTPSettings.user_id == current_user.id).first()
    if not settings:
        return {"configured": False, "smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_from": ""}
    return {
        "configured": True,
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_user": settings.smtp_user,
        "smtp_from": settings.smtp_from or "",
        "has_password": True
    }


@router.put("/smtp-settings")
def update_smtp_settings(
    smtp_host: str = Form(...),
    smtp_port: int = Form(587),
    smtp_user: str = Form(...),
    smtp_password: str = Form(...),
    smtp_from: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(SMTPSettings).filter(SMTPSettings.user_id == current_user.id).first()
    if not settings:
        settings = SMTPSettings(user_id=current_user.id)
        db.add(settings)
        
    settings.smtp_host = smtp_host
    settings.smtp_port = smtp_port
    settings.smtp_user = smtp_user
    
    # Do not overwrite the password if it's the masked value or empty
    if smtp_password and smtp_password != "••••••••":
        settings.smtp_password = smtp_password
        
    settings.smtp_from = smtp_from
    db.commit()
    return {"success": True}


@router.delete("/smtp-settings")
def delete_smtp_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(SMTPSettings).filter(SMTPSettings.user_id == current_user.id).first()
    if settings:
        db.delete(settings)
        db.commit()
        return {"success": True}
    return {"success": False, "detail": "No SMTP settings configured."}
