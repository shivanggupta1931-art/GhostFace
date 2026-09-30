from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProvenanceSchema(BaseModel):
    evidence_id: str
    capture_timestamp: str
    sha256_hash: str
    media_type: str
    device_id: str
    capture_session_id: Optional[str] = None
    provenance_version: int = 1
    signature_hex: str
    public_key_pem: Optional[str] = None
    stego_token_embedded: bool = True

class EvidenceVersionSchema(BaseModel):
    id: int
    version_num: int
    title: str
    sha256_hash: str
    is_original_sealed: bool
    hash_matches_original: bool
    submitter_source: str
    created_at: datetime
    storage_path: str
    notes: Optional[str] = None

class AnalysisSchema(BaseModel):
    tampering_risk_score: int
    tampering_risk_label: str
    synthetic_media_indicators: str
    manipulation_indicators: str
    visual_consistency: str
    audio_video_consistency: str
    ela_variance_score: float
    raw_details: Optional[str] = None

class ComparisonSchema(BaseModel):
    content_match_pct: float
    changed_content_pct: float
    new_unmatched_pct: float
    ssim: float
    mse: float
    timeline_segments_json: Optional[str] = None
    raw_details: Optional[str] = None

class EvidenceDetailResponse(BaseModel):
    id: int
    evidence_id: str
    incident_id: Optional[str] = None
    device_id: str
    media_type: str
    status: str
    captured_offline: bool
    capture_timestamp: str
    sync_timestamp: Optional[str] = None
    storage_path: str
    created_at: datetime
    provenance: Optional[ProvenanceSchema] = None
    versions: List[EvidenceVersionSchema] = []
    analysis: Optional[AnalysisSchema] = None
    comparison: Optional[ComparisonSchema] = None

class IncidentSchema(BaseModel):
    incident_id: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    evidence_count: int = 0
    evidence_items: List[Dict[str, Any]] = []

class OfflineSyncPayload(BaseModel):
    device_id: str
    items: List[Dict[str, Any]]

class InvestigationUploadResponse(BaseModel):
    stego_token_found: bool
    extracted_token: Optional[Dict[str, Any]] = None
    matching_evidence_id: Optional[str] = None
    sha256_hash: str
    comparison_summary: Optional[Dict[str, Any]] = None
    forensic_analysis: Dict[str, Any]
    investigation_status: str
    notes: str
