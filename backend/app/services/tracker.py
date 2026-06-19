# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.db.models import Application
from datetime import datetime, timedelta

COLUMNS = [
    "Source", "Company", "Job Title", "HR Contact", "Hiring Manager", 
    "Technical Contact", "ATS Score", "Application Status", "Applied Date", 
    "Follow-up Date", "Job Link", "Drafted Message", "Improvement Suggestions", "Resume Used"
]

def _app_to_dict(app: Application) -> dict:
    return {
        "Source": app.source or "",
        "Company": app.company or "",
        "Job Title": app.job_title or "",
        "HR Contact": app.hr_contact or "",
        "Hiring Manager": app.hiring_manager or "",
        "Technical Contact": app.technical_contact or "",
        "ATS Score": app.ats_score or "",
        "Application Status": app.application_status or "",
        "Applied Date": app.applied_date or "",
        "Follow-up Date": app.follow_up_date or "",
        "Job Link": app.job_link or "",
        "Drafted Message": app.drafted_message or "",
        "Improvement Suggestions": app.improvement_suggestions or "",
        "Resume Used": app.resume_used or ""
    }

def get_applications(user_id: int, db: Session):
    apps = db.query(Application).filter(Application.user_id == user_id).all()
    return [_app_to_dict(app) for app in apps]

def add_application(user_id: int, db: Session, source: str, company: str, job_title: str, 
                    hr_contact: str = "", hiring_manager: str = "", tech_contact: str = "", 
                    ats_score: str = "", status: str = "Pending", job_link: str = "", 
                    drafted_msg: str = "", suggestions: str = "", resume_used: str = ""):
    applied_date = datetime.now()
    follow_up_date = applied_date + timedelta(days=7)
    
    new_app = Application(
        user_id=user_id,
        source=source,
        company=company,
        job_title=job_title,
        hr_contact=hr_contact,
        hiring_manager=hiring_manager,
        technical_contact=tech_contact,
        ats_score=str(ats_score),
        application_status=status,
        applied_date=applied_date.strftime("%Y-%m-%d"),
        follow_up_date=follow_up_date.strftime("%Y-%m-%d"),
        job_link=job_link,
        drafted_message=drafted_msg,
        improvement_suggestions=suggestions,
        resume_used=resume_used
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return _app_to_dict(new_app)

def update_status(user_id: int, db: Session, company: str, job_title: str, new_status: str):
    app = db.query(Application).filter(
        Application.user_id == user_id,
        Application.company == company,
        Application.job_title == job_title
    ).first()
    if app:
        app.application_status = new_status
        db.commit()
        return True
    return False

def update_message(user_id: int, db: Session, company: str, job_title: str, new_message: str):
    app = db.query(Application).filter(
        Application.user_id == user_id,
        Application.company == company,
        Application.job_title == job_title
    ).first()
    if app:
        app.drafted_message = new_message
        db.commit()
        return True
    return False

def delete_application(user_id: int, db: Session, company: str, job_title: str):
    app = db.query(Application).filter(
        Application.user_id == user_id,
        Application.company == company,
        Application.job_title == job_title
    ).first()
    if app:
        db.delete(app)
        db.commit()
        return True
    return False

def clear_tracker(user_id: int, db: Session):
    db.query(Application).filter(Application.user_id == user_id).delete()
    db.commit()
    return True

# Simple wrapper class for backwards compatibility with bots
class Tracker:
    def __init__(self, user_id: int, db: Session):
        self.user_id = user_id
        self.db = db

    def get_applications(self, *args, **kwargs):
        return get_applications(self.user_id, self.db, *args, **kwargs)

    def add_application(self, *args, **kwargs):
        return add_application(self.user_id, self.db, *args, **kwargs)
