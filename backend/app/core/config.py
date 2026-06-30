import os
import secrets
from dotenv import load_dotenv

# Base directory is backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from the workspace root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(BASE_DIR), ".env"))

DATA_DIR = os.path.join(BASE_DIR, "data")
RESUMES_DIR = os.path.join(DATA_DIR, "resumes")
TEMP_DIR = os.path.join(DATA_DIR, "temp")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(RESUMES_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# JWT / Auth Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "linkerai-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
