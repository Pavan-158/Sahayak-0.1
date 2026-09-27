"""
SQLAlchemy models for Sahayak database.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database.db import Base


class Scheme(Base):
    """Government scheme model."""
    __tablename__ = "schemes"
    
    id = Column(String, primary_key=True)
    scheme_name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    state_code = Column(String, nullable=False)
    level = Column(String)  # Central, State
    category = Column(String)
    eligibility = Column(Text)
    benefits = Column(Text)
    application_process = Column(Text)
    documents_required = Column(Text)
    official_link = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserProfile(Base):
    """User profile for personalized recommendations."""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, unique=True, nullable=False)
    name = Column(String)
    age = Column(Integer)
    income = Column(Float)
    state = Column(String)
    occupation = Column(String)
    interests = Column(Text)  # Comma-separated
    language = Column(String, default="en")
    gender = Column(String, default="male")
    category = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserProgress(Base):
    """User progress tracking for scheme application steps."""
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False)
    scheme_id = Column(String, nullable=False)
    step_number = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DocumentRecord(Base):
    """Uploaded document records."""
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text)
    simplified_text = Column(Text)
    target_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
