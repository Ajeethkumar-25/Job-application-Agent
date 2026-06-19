"""
Shared SQLAlchemy engine + session factory.
Import `get_db` as a FastAPI dependency in any endpoint that needs DB access.
"""
# pyrefly: ignore [missing-import]
import os
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
from app.db.models import Base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
db_url = f"sqlite:///{os.path.join(BASE_DIR, 'data', 'linker.db')}"

engine = create_engine(db_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Ensure tables exist on startup
Base.metadata.create_all(engine)


def get_db():
    """FastAPI dependency: yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
