from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    role = Column(String(20), default="CAPTURE_USER")  # CAPTURE_USER, ADMIN
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. INC-004
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    evidence_items = relationship("Evidence", back_populates="incident")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), unique=True, index=True, nullable=False)  # EV-2026-XXXXXX
    incident_id = Column(String(50), ForeignKey("incidents.incident_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    device_id = Column(String(100), default="Phone-01")
    capture_session_id = Column(String(100), nullable=True)
    media_type = Column(String(50), default="image/png")
    status = Column(String(30), default="SEALED")  # SEALED, PENDING_SYNC, UNDER_REVIEW, FLAGGED
    captured_offline = Column(Boolean, default=False)
    capture_timestamp = Column(String(50), nullable=False)
    sync_timestamp = Column(String(50), nullable=True)
    storage_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    incident = relationship("Incident", back_populates="evidence_items")
    provenance = relationship("ProvenanceRecord", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    versions = relationship("EvidenceVersion", back_populates="evidence", cascade="all, delete-orphan")
    analysis = relationship("AnalysisResult", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    comparison = relationship("ComparisonResult", back_populates="evidence", uselist=False, cascade="all, delete-orphan")

class ProvenanceRecord(Base):
    __tablename__ = "provenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    capture_timestamp = Column(String(50), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    media_type = Column(String(50), nullable=False)
    device_id = Column(String(100), nullable=False)
    capture_session_id = Column(String(100), nullable=True)
    provenance_version = Column(Integer, default=1)
    signature_hex = Column(Text, nullable=False)
    public_key_pem = Column(Text, nullable=True)
    stego_token_embedded = Column(Boolean, default=True)
    
    evidence = relationship("Evidence", back_populates="provenance")

class EvidenceVersion(Base):
    __tablename__ = "evidence_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), ForeignKey("evidence.evidence_id"), nullable=False)
    version_num = Column(Integer, nullable=False)
    title = Column(String(100), default="Submitted Version")
    sha256_hash = Column(String(64), nullable=False)
    storage_path = Column(String(255), nullable=False)
    is_original_sealed = Column(Boolean, default=False)
    hash_matches_original = Column(Boolean, default=False)
    submitter_source = Column(String(100), default="Capture Device")
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    evidence = relationship("Evidence", back_populates="versions")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    tampering_risk_score = Column(Integer, default=0)
    tampering_risk_label = Column(String(50), default="Very Low")
    synthetic_media_indicators = Column(String(50), default="LOW")
    manipulation_indicators = Column(String(50), default="LOW")
    visual_consistency = Column(String(50), default="HIGH")
    audio_video_consistency = Column(String(50), default="CONSISTENT")
    ela_variance_score = Column(Float, default=0.0)
    raw_details = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    evidence = relationship("Evidence", back_populates="analysis")

class ComparisonResult(Base):
    __tablename__ = "comparison_results"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    content_match_pct = Column(Float, default=100.0)
    changed_content_pct = Column(Float, default=0.0)
    new_unmatched_pct = Column(Float, default=0.0)
    ssim = Column(Float, default=1.0)
    mse = Column(Float, default=0.0)
    timeline_segments_json = Column(Text, nullable=True)
    raw_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    evidence = relationship("Evidence", back_populates="comparison")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)  # e.g. "VIEW_EVIDENCE", "RUN_COMPARISON", "EXPORT_REPORT"
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SyncJob(Base):
    __tablename__ = "sync_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(50), unique=True, nullable=False)
    device_id = Column(String(100), nullable=False)
    items_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow)
