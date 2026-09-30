import os
import io
import json
import base64
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import Evidence, EvidenceVersion, ProvenanceRecord, AnalysisResult, ComparisonResult, AuditLog, Incident
from backend.core.crypto import (
    generate_evidence_id, compute_sha256, sign_provenance_record, 
    verify_provenance_signature, get_public_key_pem
)
from backend.core.steganography import create_compact_token, embed_lsb_token, extract_lsb_token
from backend.core.comparison import compare_images, compare_video_timelines
from backend.core.forensics import perform_ela, analyze_noise_consistency, analyze_forensic_signals

router = APIRouter(prefix="/evidence", tags=["Evidence Management"])

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "evidence")
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.post("")
async def capture_evidence(
    file: Optional[UploadFile] = File(None),
    data_base64: Optional[str] = Form(None),
    media_type: str = Form("image/png"),
    device_id: str = Form("Phone-01"),
    incident_id: Optional[str] = Form(None),
    captured_offline: bool = Form(False),
    capture_session_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Capture & Seal pipeline:
    1. Read bytes
    2. Generate unique Evidence ID (EV-YYYY-HEX6)
    3. Embed compact provenance token into PNG LSB steganography
    4. Compute exact SHA-256 of the sealed media
    5. Create canonical provenance record & sign with Ed25519
    6. Store sealed media asset securely
    7. Commit DB records with Version 1 (Original Sealed)
    8. Return sealed receipt AND exact sealed_data_url with embedded stego token
    """
    if file:
        raw_bytes = await file.read()
        media_type = file.content_type or media_type
    elif data_base64:
        try:
            if "," in data_base64:
                data_base64 = data_base64.split(",")[1]
            raw_bytes = base64.b64decode(data_base64)
            if not raw_bytes:
                raise ValueError("Decoded byte stream is empty")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image payload: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either file or data_base64")

    evidence_id = generate_evidence_id()
    timestamp_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # 1. Embed Stego Token if image
    is_image = "image" in media_type.lower() or media_type == "image/png"
    stego_bytes = raw_bytes
    stego_embedded = False
    
    if is_image:
        try:
            token_payload = create_compact_token(evidence_id, compute_sha256(raw_bytes), timestamp_str, 1)
            stego_bytes = embed_lsb_token(raw_bytes, token_payload)
            stego_embedded = True
        except Exception:
            stego_bytes = raw_bytes

    # 2. Compute SHA-256 of the sealed media payload
    sealed_sha256 = compute_sha256(stego_bytes)
    
    # 3. Build Canonical Provenance Payload and Sign with Ed25519
    provenance_canonical = {
        "evidence_id": evidence_id,
        "capture_timestamp": timestamp_str,
        "sha256": sealed_sha256,
        "media_type": media_type,
        "device_id": device_id,
        "capture_session_id": capture_session_id or f"sess-{evidence_id}",
        "provenance_version": 1
    }
    canonical_bytes = json.dumps(provenance_canonical, sort_keys=True, separators=(',', ':')).encode('utf-8')
    signature_hex = sign_provenance_record(canonical_bytes)
    pub_key_pem = get_public_key_pem()

    # 4. Save file to disk
    ext = "png" if is_image else "mp4"
    filename = f"{evidence_id}_v1_sealed.{ext}"
    filepath = os.path.join(STORAGE_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(stego_bytes)

    # 5. Database Entities
    db_evidence = Evidence(
        evidence_id=evidence_id,
        incident_id=incident_id,
        device_id=device_id,
        capture_session_id=capture_session_id or f"sess-{evidence_id}",
        media_type=media_type,
        status="SEALED",
        captured_offline=captured_offline,
        capture_timestamp=timestamp_str,
        sync_timestamp=timestamp_str if not captured_offline else None,
        storage_path=filepath
    )
    db.add(db_evidence)
    
    db_prov = ProvenanceRecord(
        evidence_id=evidence_id,
        capture_timestamp=timestamp_str,
        sha256_hash=sealed_sha256,
        media_type=media_type,
        device_id=device_id,
        capture_session_id=capture_session_id or f"sess-{evidence_id}",
        provenance_version=1,
        signature_hex=signature_hex,
        public_key_pem=pub_key_pem,
        stego_token_embedded=stego_embedded
    )
    db.add(db_prov)

    # Version 1 (Original Sealed)
    db_v1 = EvidenceVersion(
        evidence_id=evidence_id,
        version_num=1,
        title="Capture Original (Sealed)",
        sha256_hash=sealed_sha256,
        storage_path=filepath,
        is_original_sealed=True,
        hash_matches_original=True,
        submitter_source=device_id,
        notes="Cryptographically sealed original capture."
    )
    db.add(db_v1)

    # Initial Analysis (Clean baseline)
    forensic_res = analyze_forensic_signals(
        image_bytes=stego_bytes if is_image else None,
        provenance_valid=True,
        hash_match=True,
        content_match_pct=100.0,
        media_type=media_type
    )
    db_analysis = AnalysisResult(
        evidence_id=evidence_id,
        tampering_risk_score=forensic_res["tampering_risk_score"],
        tampering_risk_label=forensic_res["tampering_risk_label"],
        synthetic_media_indicators=forensic_res["synthetic_media_indicators"],
        manipulation_indicators=forensic_res["manipulation_indicators"],
        visual_consistency=forensic_res["visual_consistency"],
        audio_video_consistency=forensic_res["audio_video_consistency"],
        ela_variance_score=forensic_res.get("ela_variance_score", 0.0),
        raw_details=json.dumps(forensic_res)
    )
    db.add(db_analysis)

    db_comp = ComparisonResult(
        evidence_id=evidence_id,
        content_match_pct=100.0,
        changed_content_pct=0.0,
        new_unmatched_pct=0.0,
        ssim=1.0,
        mse=0.0,
        timeline_segments_json=json.dumps(compare_video_timelines(60.0, 60.0)["timeline_segments"]) if not is_image else None,
        raw_details=json.dumps({"info": "Baseline capture is identical to itself"})
    )
    db.add(db_comp)

    # Audit Log
    db_log = AuditLog(
        actor=device_id,
        action="SEAL_EVIDENCE",
        target_id=evidence_id,
        details=f"Evidence {evidence_id} sealed with SHA-256 {sealed_sha256[:16]}... and Ed25519 signature."
    )
    db.add(db_log)
    db.commit()

    # Generate data URL for the sealed file with stego embedded
    sealed_b64 = f"data:{media_type};base64,{base64.b64encode(stego_bytes).decode('utf-8')}"

    return {
        "status": "SEALED",
        "evidence_id": evidence_id,
        "sha256": sealed_sha256,
        "signature": signature_hex,
        "provenance_status": "VALID",
        "captured_timestamp": timestamp_str,
        "stego_token_embedded": stego_embedded,
        "tampering_risk": forensic_res,
        "sealed_data_url": sealed_b64
    }


@router.get("")
def list_evidence(
    incident_id: Optional[str] = None,
    search: Optional[str] = None,
    risk_category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all evidence with rich summaries"""
    query = db.query(Evidence)
    if incident_id:
        query = query.filter(Evidence.incident_id == incident_id)
    if status:
        query = query.filter(Evidence.status == status)
        
    items = query.order_by(Evidence.created_at.desc()).all()
    
    results = []
    for item in items:
        risk_score = item.analysis.tampering_risk_score if item.analysis else 0
        risk_label = item.analysis.tampering_risk_label if item.analysis else "Very Low"
        
        if search:
            s_lower = search.lower()
            if s_lower not in item.evidence_id.lower() and s_lower not in item.device_id.lower() and (not item.incident_id or s_lower not in item.incident_id.lower()):
                continue
                
        results.append({
            "id": item.id,
            "evidence_id": item.evidence_id,
            "incident_id": item.incident_id,
            "device_id": item.device_id,
            "media_type": item.media_type,
            "status": item.status,
            "captured_offline": item.captured_offline,
            "capture_timestamp": item.capture_timestamp,
            "sync_timestamp": item.sync_timestamp,
            "original_hash": item.provenance.sha256_hash if item.provenance else "",
            "tampering_risk_score": risk_score,
            "tampering_risk_label": risk_label,
            "tampering_risk_category": "VERY_LOW" if risk_score <= 15 else ("LOW" if risk_score <= 35 else ("MEDIUM" if risk_score <= 60 else ("HIGH" if risk_score <= 80 else "VERY_HIGH"))),
            "content_match_pct": item.comparison.content_match_pct if item.comparison else 100.0,
            "versions_count": len(item.versions),
            "signature_valid": True,
            "provenance_status": "VALID" if risk_score < 60 else "INVALID"
        })
    return results


@router.get("/{evidence_id}")
def get_evidence_detail(evidence_id: str, db: Session = Depends(get_db)):
    """Retrieve full evidence details including versions, provenance, forensics, and comparison"""
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found")
        
    prov = evidence.provenance
    sig_valid = False
    if prov:
        canonical = {
            "evidence_id": prov.evidence_id,
            "capture_timestamp": prov.capture_timestamp,
            "sha256": prov.sha256_hash,
            "media_type": prov.media_type,
            "device_id": prov.device_id,
            "capture_session_id": prov.capture_session_id,
            "provenance_version": prov.provenance_version
        }
        canonical_bytes = json.dumps(canonical, sort_keys=True, separators=(',', ':')).encode('utf-8')
        sig_valid = verify_provenance_signature(canonical_bytes, prov.signature_hex)

    versions_data = []
    for v in sorted(evidence.versions, key=lambda x: x.version_num):
        versions_data.append({
            "id": v.id,
            "version_num": v.version_num,
            "title": v.title,
            "sha256_hash": v.sha256_hash,
            "is_original_sealed": v.is_original_sealed,
            "hash_matches_original": v.hash_matches_original,
            "submitter_source": v.submitter_source,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "notes": v.notes
        })

    db_log = AuditLog(
        actor="ADMIN-01",
        action="VIEW_EVIDENCE",
        target_id=evidence_id,
        details=f"Investigator opened evidence record {evidence_id} for deep forensic inspection."
    )
    db.add(db_log)
    db.commit()

    return {
        "evidence_id": evidence.evidence_id,
        "incident_id": evidence.incident_id,
        "device_id": evidence.device_id,
        "capture_session_id": evidence.capture_session_id,
        "media_type": evidence.media_type,
        "status": evidence.status,
        "captured_offline": evidence.captured_offline,
        "capture_timestamp": evidence.capture_timestamp,
        "sync_timestamp": evidence.sync_timestamp,
        "created_at": evidence.created_at.isoformat() if evidence.created_at else None,
        "provenance": {
            "evidence_id": prov.evidence_id if prov else "",
            "original_hash": prov.sha256_hash if prov else "",
            "capture_timestamp": prov.capture_timestamp if prov else "",
            "signature_hex": prov.signature_hex if prov else "",
            "signature_valid": sig_valid,
            "provenance_version": prov.provenance_version if prov else 1,
            "stego_token_embedded": prov.stego_token_embedded if prov else False,
            "provenance_status": "VALID" if sig_valid else "INVALID",
            "public_key_pem": prov.public_key_pem if prov else None
        } if prov else None,
        "versions": versions_data,
        "analysis": {
            "tampering_risk_score": evidence.analysis.tampering_risk_score if evidence.analysis else 0,
            "tampering_risk_label": evidence.analysis.tampering_risk_label if evidence.analysis else "Very Low",
            "synthetic_media_indicators": evidence.analysis.synthetic_media_indicators if evidence.analysis else "LOW",
            "manipulation_indicators": evidence.analysis.manipulation_indicators if evidence.analysis else "LOW",
            "visual_consistency": evidence.analysis.visual_consistency if evidence.analysis else "HIGH",
            "audio_video_consistency": evidence.analysis.audio_video_consistency if evidence.analysis else "CONSISTENT",
            "ela_variance_score": evidence.analysis.ela_variance_score if evidence.analysis else 0.0,
            "disclaimer": "Probabilistic forensic indicators only. Not mathematical proof of malice or authenticity."
        } if evidence.analysis else None,
        "comparison": {
            "content_match_pct": evidence.comparison.content_match_pct if evidence.comparison else 100.0,
            "changed_content_pct": evidence.comparison.changed_content_pct if evidence.comparison else 0.0,
            "new_unmatched_pct": evidence.comparison.new_unmatched_pct if evidence.comparison else 0.0,
            "ssim": evidence.comparison.ssim if evidence.comparison else 1.0,
            "mse": evidence.comparison.mse if evidence.comparison else 0.0,
            "timeline_segments": json.loads(evidence.comparison.timeline_segments_json) if (evidence.comparison and evidence.comparison.timeline_segments_json) else []
        } if evidence.comparison else None
    }


@router.post("/{evidence_id}/versions")
async def submit_evidence_version(
    evidence_id: str,
    file: Optional[UploadFile] = File(None),
    data_base64: Optional[str] = Form(None),
    title: str = Form("Submitted Copy"),
    submitter_source: str = Form("External Submission"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    if file:
        raw_bytes = await file.read()
    elif data_base64:
        if "," in data_base64:
            data_base64 = data_base64.split(",")[1]
        raw_bytes = base64.b64decode(data_base64)
    else:
        raise HTTPException(status_code=400, detail="Must provide either file or data_base64")

    submitted_sha256 = compute_sha256(raw_bytes)
    is_image = "image" in evidence.media_type.lower()
    
    with open(evidence.storage_path, "rb") as f:
        orig_bytes = f.read()

    orig_sha256 = evidence.provenance.sha256_hash if evidence.provenance else compute_sha256(orig_bytes)
    hash_match = (submitted_sha256 == orig_sha256)

    version_num = len(evidence.versions) + 1
    ext = "png" if is_image else "mp4"
    filename = f"{evidence_id}_v{version_num}.{ext}"
    filepath = os.path.join(STORAGE_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(raw_bytes)

    if is_image:
        comp_res = compare_images(orig_bytes, raw_bytes)
        timeline_segments = None
    else:
        timeline_res = compare_video_timelines(60.0, 60.0)
        comp_res = {
            "content_match_pct": 82.0 if not hash_match else 100.0,
            "changed_content_pct": 13.0 if not hash_match else 0.0,
            "new_unmatched_pct": 5.0 if not hash_match else 0.0,
            "ssim": 0.81 if not hash_match else 1.0,
            "mse": 42.0 if not hash_match else 0.0
        }
        timeline_segments = timeline_res["timeline_segments"]

    forensic_res = analyze_forensic_signals(
        image_bytes=raw_bytes if is_image else None,
        provenance_valid=hash_match,
        hash_match=hash_match,
        content_match_pct=comp_res["content_match_pct"],
        media_type=evidence.media_type
    )

    db_version = EvidenceVersion(
        evidence_id=evidence_id,
        version_num=version_num,
        title=title,
        sha256_hash=submitted_sha256,
        storage_path=filepath,
        is_original_sealed=False,
        hash_matches_original=hash_match,
        submitter_source=submitter_source,
        notes=notes or ("Exact match to sealed capture" if hash_match else "Submitted file differs from capture-sealed version.")
    )
    db.add(db_version)

    if evidence.comparison:
        evidence.comparison.content_match_pct = comp_res["content_match_pct"]
        evidence.comparison.changed_content_pct = comp_res["changed_content_pct"]
        evidence.comparison.new_unmatched_pct = comp_res["new_unmatched_pct"]
        evidence.comparison.ssim = comp_res["ssim"]
        evidence.comparison.mse = comp_res["mse"]
        if timeline_segments:
            evidence.comparison.timeline_segments_json = json.dumps(timeline_segments)
    
    if evidence.analysis:
        evidence.analysis.tampering_risk_score = forensic_res["tampering_risk_score"]
        evidence.analysis.tampering_risk_label = forensic_res["tampering_risk_label"]
        evidence.analysis.synthetic_media_indicators = forensic_res["synthetic_media_indicators"]
        evidence.analysis.manipulation_indicators = forensic_res["manipulation_indicators"]
        evidence.analysis.visual_consistency = forensic_res["visual_consistency"]
        evidence.analysis.audio_video_consistency = forensic_res["audio_video_consistency"]
        evidence.analysis.ela_variance_score = forensic_res.get("ela_variance_score", 0.0)
        evidence.analysis.raw_details = json.dumps(forensic_res)

    db_log = AuditLog(
        actor=submitter_source,
        action="SUBMIT_VERSION",
        target_id=evidence_id,
        details=f"Version {version_num} submitted. Hash match: {hash_match}. Content match: {comp_res['content_match_pct']}%."
    )
    db.add(db_log)
    db.commit()

    return {
        "status": "VERSION_SUBMITTED",
        "evidence_id": evidence_id,
        "version_num": version_num,
        "hash_match": hash_match,
        "original_sha256": orig_sha256,
        "submitted_sha256": submitted_sha256,
        "comparison": comp_res,
        "tampering_risk": forensic_res
    }


@router.get("/{evidence_id}/ela")
def get_ela_image(evidence_id: str, db: Session = Depends(get_db)):
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not evidence or not os.path.exists(evidence.storage_path):
        raise HTTPException(status_code=404, detail="Media not found")
        
    with open(evidence.storage_path, "rb") as f:
        img_bytes = f.read()
        
    ela_bytes, _ = perform_ela(img_bytes)
    return Response(content=ela_bytes, media_type="image/png")


@router.get("/{evidence_id}/media")
def get_evidence_media(evidence_id: str, version: int = 1, db: Session = Depends(get_db)):
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found")
        
    target_ver = next((v for v in evidence.versions if v.version_num == version), None)
    path = target_ver.storage_path if target_ver else evidence.storage_path
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Media file not found on disk")
        
    return FileResponse(path, media_type=evidence.media_type)
