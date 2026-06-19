from fastapi import APIRouter, Form, Depends
from fastapi.responses import FileResponse
import os
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.core.security import get_current_user
from app.core.config import TEMP_DIR
import app.services.tracker as tracker_service

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
