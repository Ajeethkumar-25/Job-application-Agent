# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """One row per registered user. Passwords are bcrypt-hashed — never stored plain."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="owner", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = 'applications'

    id = Column(Integer, primary_key=True, index=True)

    # — User isolation — every application belongs to exactly one user
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    owner = relationship("User", back_populates="applications")

    source = Column(String, index=True)
    company = Column(String, index=True)
    job_title = Column(String)
    hr_contact = Column(String)
    hiring_manager = Column(String)
    technical_contact = Column(String)
    ats_score = Column(String)
    application_status = Column(String)
    applied_date = Column(String)
    follow_up_date = Column(String)
    job_link = Column(String)
    drafted_message = Column(String)
    improvement_suggestions = Column(String)
    resume_used = Column(String)
