from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, SMTPSettings, Application
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
    
    # Categorize applications into folders
    categorized = {}
    if not apps:
        categorized["Other"] = []
    else:
        for app in apps:
            # Exclude the "id" field in the Excel export columns
            excel_app = {k: v for k, v in app.items() if k != "id"}
            title = excel_app.get("Job Title", "")
            
            folder = "Other"
            title_lower = title.lower()
            if any(x in title_lower for x in ["ai", "machine learning", "ml", "deep learning", "llm"]):
                folder = "AI Engineer"
            elif any(x in title_lower for x in ["business analyst", "data analyst", "product analyst", "analyst"]):
                folder = "Business Analyst"
            elif any(x in title_lower for x in ["frontend", "react", "ui", "ux"]):
                folder = "Frontend Engineer"
            elif any(x in title_lower for x in ["full stack", "fullstack"]):
                folder = "Full Stack Developer"
            elif any(x in title_lower for x in ["backend", "node", "django", "python"]):
                folder = "Backend Engineer"
                
            categorized.setdefault(folder, []).append(excel_app)

    import tempfile
    import shutil

    with tempfile.TemporaryDirectory() as tmpdir:
        for folder_name, folder_apps in categorized.items():
            category_dir = os.path.join(tmpdir, folder_name)
            os.makedirs(category_dir, exist_ok=True)
            
            if not folder_apps:
                df = pd.DataFrame(columns=tracker_service.COLUMNS)
            else:
                df = pd.DataFrame(folder_apps)
                
            filepath = os.path.join(category_dir, "applications.xlsx")
            df.to_excel(filepath, index=False, sheet_name=folder_name)
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"applications_tracker_{current_user.id}_{timestamp}"
        zip_filepath_base = os.path.join(TEMP_DIR, zip_filename)
        
        actual_zip_path = shutil.make_archive(zip_filepath_base, 'zip', tmpdir)
        
        return FileResponse(
            path=actual_zip_path,
            filename=f"{zip_filename}.zip",
            media_type="application/zip",
        )


@router.post("/send-email")
def send_tracker_email(
    email: str = Form(...),
    app_ids: str = Form(None), # Comma-separated list of IDs, e.g. "1,2,5"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if app_ids:
        ids_list = [int(x.strip()) for x in app_ids.split(",") if x.strip()]
        query = query.filter(Application.id.in_(ids_list))
    db_apps = query.all()
    
    apps = [tracker_service._app_to_dict(app) for app in db_apps]
    
    # Exclude the "id" field in the Excel export columns
    excel_apps = []
    for app in apps:
        excel_app = {k: v for k, v in app.items() if k != "id"}
        excel_apps.append(excel_app)

    if not excel_apps:
        df = pd.DataFrame(columns=tracker_service.COLUMNS)
    else:
        df = pd.DataFrame(excel_apps)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"applications_tracker_{current_user.id}_{timestamp}.xlsx"
    filepath = os.path.join(TEMP_DIR, filename)
    df.to_excel(filepath, index=False, sheet_name="Applications")

    # Load SMTP settings from DB if configured
    db_settings = db.query(SMTPSettings).filter(SMTPSettings.user_id == current_user.id).first()

    try:
        send_application_list_email(email, filepath, excel_apps, db_settings=db_settings)
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
