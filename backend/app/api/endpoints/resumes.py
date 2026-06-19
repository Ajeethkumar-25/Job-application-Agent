# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Depends
import os
import shutil
from app.core.config import RESUMES_DIR
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/")
def get_resumes(current_user: User = Depends(get_current_user)):
    user_dir = os.path.join(RESUMES_DIR, str(current_user.id))
    if not os.path.exists(user_dir):
        return {"resumes": []}
    files = [f for f in os.listdir(user_dir) if f.endswith(('.pdf', '.docx', '.txt'))]
    return {"resumes": files}

@router.post("/")
def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    user_dir = os.path.join(RESUMES_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"success": True, "filename": file.filename}

@router.delete("/{filename}")
def delete_resume(filename: str, current_user: User = Depends(get_current_user)):
    user_dir = os.path.join(RESUMES_DIR, str(current_user.id))
    file_path = os.path.join(user_dir, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"success": True}
    return {"success": False, "error": "Not found"}
