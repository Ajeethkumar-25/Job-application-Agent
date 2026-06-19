import pandas as pd
import os
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
from app.db.models import Application

db_url = "sqlite:///linker.db"
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)

def migrate():
    filename = "applications_tracker.xlsx"
    if not os.path.exists(filename):
        print("No Excel tracker found. Skipping migration.")
        return

    df = pd.read_excel(filename)
    df = df.fillna("")

    session = SessionLocal()
    try:
        count = 0
        for _, row in df.iterrows():
            source = row.get("Source", "LinkedIn")
            if not source: source = "LinkedIn"
            
            # Check if it already exists to avoid dupes during test runs
            existing = session.query(Application).filter_by(
                company=row.get("Company", ""), 
                job_title=row.get("Job Title", "")
            ).first()
            
            if existing:
                continue

            app = Application(
                source=source,
                company=row.get("Company", ""),
                job_title=row.get("Job Title", ""),
                hr_contact=row.get("HR Contact", ""),
                hiring_manager=row.get("Hiring Manager", ""),
                technical_contact=row.get("Technical Contact", ""),
                ats_score=str(row.get("ATS Score", "")),
                application_status=row.get("Application Status", ""),
                applied_date=str(row.get("Applied Date", "")),
                follow_up_date=str(row.get("Follow-up Date", "")),
                job_link=row.get("Job Link", ""),
                drafted_message=row.get("Drafted Message", ""),
                improvement_suggestions=row.get("Improvement Suggestions", ""),
                resume_used=row.get("Resume Used", "")
            )
            session.add(app)
            count += 1
            
        session.commit()
        print(f"Successfully migrated {count} records from Excel to SQLite.")
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
