# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Form, BackgroundTasks, UploadFile, File, Depends 
import os
import json
import shutil
from typing import List, Dict
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.core.config import TEMP_DIR, BASE_DIR, RESUMES_DIR
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services.instances import analyzer as analyzer_service
from app.services.tracker import Tracker

from app.services.bots.linkedin_bot import LinkedInBot
from app.services.bots.naukri_bot import NaukriBot
from app.services.bots.indeed_bot import IndeedBot
from app.services.bots.internshala_bot import InternshalaBot
from app.services.bots.unstop_bot import UnstopBot
from app.services.bots.foundit_bot import FounditBot
from app.services.bots.instahyre_bot import InstahyreBot

router = APIRouter()

BOT_REGISTRY = {
    "linkedin":    {"class": LinkedInBot,    "label": "LinkedIn",    "login_required": True,  "color": "#0A66C2"},
    "naukri":      {"class": NaukriBot,      "label": "Naukri",      "login_required": False, "color": "#4A90D9"},
    "indeed":      {"class": IndeedBot,      "label": "Indeed",      "login_required": False, "color": "#2164F3"},
    "internshala": {"class": InternshalaBot, "label": "Internshala", "login_required": False, "color": "#00A5EC"},
    "unstop":      {"class": UnstopBot,      "label": "Unstop",      "login_required": False, "color": "#FF6B35"},
    "foundit":     {"class": FounditBot,     "label": "foundit",     "login_required": False, "color": "#6C5CE7"},
    "instahyre":   {"class": InstahyreBot,   "label": "Instahyre",   "login_required": True,  "color": "#00B894"},
}

# ── Per-user state (in-memory) ────────────────────────────────────────────────
# Each key is a user_id (int). No user can see another's logs.
_user_logs: Dict[int, List[str]] = {}
_user_running: Dict[int, bool] = {}


def _get_logs(user_id: int) -> List[str]:
    return _user_logs.setdefault(user_id, [])

def _is_running(user_id: int) -> bool:
    return _user_running.get(user_id, False)

def _log(user_id: int, msg: str):
    print(f"[user={user_id}] {msg}")
    _get_logs(user_id).append(msg)


# ── Background job ────────────────────────────────────────────────────────────

def run_multi_portal_flow(
    user_id: int,
    portals: List[str],
    target_titles: List[str],
    dry_run: bool,
    location: str,
    experience: str = "Any",
    recency: str = "Any",
    auto_apply: bool = False,
    resume_text: str = "",
    ats_threshold: int = 85,
    max_jobs: int = 20,
):
    from app.db.database import SessionLocal
    db = SessionLocal()
    
    _user_running[user_id] = True
    tracker = Tracker(user_id=user_id, db=db)

    _log(user_id, "═" * 50)
    _log(user_id, "Starting Multi-Portal Agent Automation...")
    _log(user_id, f"Portals: {', '.join(portals)}")

    locations_list = [l.strip() for l in location.split(",") if l.strip()]
    applied_total = 0

    for portal_key in portals:
        if applied_total >= max_jobs:
            _log(user_id, f"Reached global application limit of {max_jobs}. Stopping.")
            break
        entry = BOT_REGISTRY.get(portal_key)
        if not entry:
            continue
        BotClass = entry["class"]
        label = entry["label"]
        bot = BotClass(log_callback=lambda msg: _log(user_id, msg))
        try:
            bot.login()
            for title in target_titles:
                if applied_total >= max_jobs:
                    break
                for loc in locations_list:
                    if applied_total >= max_jobs:
                        break
                    jobs = bot.search_jobs(title, location=loc, experience=experience, recency=recency)
                    if resume_text:
                        remaining_slots = max_jobs - applied_total
                        new_applied = bot.process_applications(
                            jobs, resume_text, analyzer_service, tracker,
                            dry_run=(not auto_apply or dry_run),
                            ats_threshold=ats_threshold,
                            max_jobs=remaining_slots
                        )
                        applied_total += new_applied
                    else:
                        for job in jobs:
                            if applied_total >= max_jobs:
                                break
                            company = job.get("company", "Unknown")
                            job_title = job.get("title", title)
                            existing = tracker.get_applications()
                            if any(x["Company"] == company and x["Job Title"] == job_title for x in existing):
                                continue
                            tracker.add_application(
                                source=label, company=company, job_title=job_title,
                                status="Dry-Run Drafted" if dry_run else "Applied",
                                job_link=job.get("link", ""),
                                drafted_msg=f"[{label}] Application for {job_title}",
                                resume_used="Primary Resume",
                            )
                            applied_total += 1
        except Exception as e:
            _log(user_id, f"[{label}] ✗ Error: {e}")
        finally:
            try:
                bot.close()
            except Exception:
                pass

    _user_running[user_id] = False
    _log(user_id, f"Automation completed. Total applied/drafted: {applied_total}")
    db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    file_path = os.path.join(TEMP_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    extracted_text = analyzer_service.extract_text(file_path)
    if not extracted_text:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            extracted_text = f.read()
    analysis_result = analyzer_service.analyze_resume(extracted_text)
    os.remove(file_path)
    return analysis_result


@router.get("/analyze-resume/{filename}")
def analyze_existing_resume(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    resume_path = os.path.join(RESUMES_DIR, str(current_user.id), filename)
    if not os.path.exists(resume_path):
        return {"error": "File not found"}
    extracted_text = analyzer_service.extract_text(resume_path)
    if not extracted_text:
        try:
            with open(resume_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        except Exception:
            pass
    analysis_result = analyzer_service.analyze_resume(extracted_text)
    return analysis_result


@router.post("/run-multi-agent")
def start_multi_agent(
    background_tasks: BackgroundTasks,
    target_titles: str = Form(...),
    portals: str = Form(...),
    experience: str = Form("Any"),
    recency: str = Form("Any"),
    dry_run: bool = Form(True),
    location: str = Form("Remote"),
    auto_apply: bool = Form(False),
    resume_filename: str = Form(""),
    ats_threshold: int = Form(85),
    max_jobs: int = Form(20),
    current_user: User = Depends(get_current_user),
):
    if _is_running(current_user.id):
        return {"status": "already_running"}

    resume_text = ""
    print(f"[Agent Debug] resume_filename received: '{resume_filename}'")
    if resume_filename:
        resume_path = os.path.join(RESUMES_DIR, str(current_user.id), resume_filename)
        print(f"[Agent Debug] Calculated path: {resume_path}")
        print(f"[Agent Debug] Path exists: {os.path.exists(resume_path)}")
        if os.path.exists(resume_path):
            resume_text = analyzer_service.extract_text(resume_path) or ""
            print(f"[Agent Debug] Extracted resume text length: {len(resume_text)}")

    titles_list = [t.strip() for t in target_titles.split(",") if t.strip()]
    portals_list = [p.strip() for p in portals.split(",") if p.strip()]

    background_tasks.add_task(
        run_multi_portal_flow,
        current_user.id, portals_list, titles_list, dry_run, location,
        experience, recency, auto_apply, resume_text, ats_threshold, max_jobs,
    )
    return {"status": "started", "portals": portals_list}


@router.get("/available-portals")
def get_available_portals():
    return [
        {"id": k, "label": v["label"], "login_required": v["login_required"], "color": v["color"]}
        for k, v in BOT_REGISTRY.items()
    ]


@router.get("/tech-portals")
def get_tech_portals():
    file_path = os.path.join(BASE_DIR, "tech_portals.json")
    if not os.path.exists(file_path):
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/logs")
def get_logs(current_user: User = Depends(get_current_user)):
    """Returns only THIS user's agent logs — never another user's."""
    return {
        "logs": _get_logs(current_user.id),
        "running": _is_running(current_user.id),
    }


@router.post("/logs/clear")
def clear_logs(current_user: User = Depends(get_current_user)):
    _user_logs[current_user.id] = []
    return {"status": "cleared"}
