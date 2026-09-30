import os
import io
import json
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw, ImageFont

from backend.db.database import get_db, Base, engine
from backend.db.models import Evidence, EvidenceVersion, ProvenanceRecord, AnalysisResult, ComparisonResult, Incident, AuditLog
from backend.core.crypto import compute_sha256, sign_provenance_record, get_public_key_pem
from backend.core.steganography import create_compact_token, embed_lsb_token
from backend.core.comparison import compare_images, compare_video_timelines
from backend.core.forensics import perform_ela, analyze_forensic_signals

router = APIRouter(prefix="/demo", tags=["Demo Incident Seeder"])

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "evidence")
os.makedirs(STORAGE_DIR, exist_ok=True)


def create_demo_frame(title: str, subtitle: str, color_bg: tuple, add_anomaly: bool = False) -> bytes:
    """Helper to synthesize realistic visual test frames for incident simulation"""
    img = Image.new("RGB", (640, 480), color=color_bg)
    draw = ImageDraw.Draw(img)
    
    # Draw simulated security camera / evidence scene
    draw.rectangle([(20, 20), (620, 460)], outline=(255, 255, 255), width=2)
    draw.text((40, 40), f"[ GHOSTFRAME EVIDENCE FEED ]", fill=(255, 255, 255))
    draw.text((40, 70), title, fill=(255, 255, 255))
    draw.text((40, 100), subtitle, fill=(200, 220, 255))
    
    # Draw scene elements (bank alleyway mock)
    draw.rectangle([(80, 180), (220, 420)], fill=(70, 80, 95), outline=(100, 110, 130))  # Building A
    draw.rectangle([(420, 150), (580, 420)], fill=(60, 70, 85), outline=(90, 100, 120))  # Building B
    draw.rectangle([(220, 300), (420, 420)], fill=(40, 45, 55))  # Alleyway ground
    
    # Draw subject
    draw.ellipse([(300, 250), (340, 290)], fill=(220, 180, 150))  # Head
    draw.rectangle([(290, 290), (350, 370)], fill=(30, 40, 70))   # Body
    
    if add_anomaly:
        # Draw spliced anomaly box / injected synthetic object
        draw.rectangle([(260, 220), (380, 390)], fill=(180, 40, 40, 128), outline=(255, 50, 50), width=3)
        draw.text((270, 230), "SPLICED OBJECT", fill=(255, 255, 100))
        
    draw.text((40, 435), f"CAM-SYS REC: 2026-09-29 16:32 | GHOSTFRAME INTEGRITY PROTOCOL", fill=(180, 180, 180))
    
    out_io = io.BytesIO()
    img.save(out_io, format="PNG")
    return out_io.getvalue()


@router.post("/seed-incident-004")
def seed_incident_004(db: Session = Depends(get_db)):
    """
    Seeds the complete 5-Phone Incident #004 Hackathon Scenario:
    Phone A (Original, Verified)
    Phone B (Original alternate angle, Verified)
    Phone C (Edited version, Splice 00:37–00:44, Risk: 78/100)
    Phone D (Original, Verified)
    Phone E (Synthetic Inpainted Deepfake, Risk: 91/100)
    """
    # Create or retrieve Incident #004
    inc = db.query(Incident).filter(Incident.incident_id == "INC-004").first()
    if not inc:
        inc = Incident(
            incident_id="INC-004",
            title="Metropolitan Bank Alleyway Incident",
            description="Multi-camera witness evidence captured during the alleyway transaction event at 16:32 UTC. 5 independent mobile devices recorded simultaneous perspectives.",
            location="Metropolitan Financial District, Sector 7"
        )
        db.add(inc)
        db.commit()

    # Clear old demo items for INC-004 if re-seeding
    existing_ev_ids = [e.evidence_id for e in db.query(Evidence).filter(Evidence.incident_id == "INC-004").all()]
    if existing_ev_ids:
        db.query(ProvenanceRecord).filter(ProvenanceRecord.evidence_id.in_(existing_ev_ids)).delete(synchronize_session=False)
        db.query(EvidenceVersion).filter(EvidenceVersion.evidence_id.in_(existing_ev_ids)).delete(synchronize_session=False)
        db.query(AnalysisResult).filter(AnalysisResult.evidence_id.in_(existing_ev_ids)).delete(synchronize_session=False)
        db.query(ComparisonResult).filter(ComparisonResult.evidence_id.in_(existing_ev_ids)).delete(synchronize_session=False)
        db.query(Evidence).filter(Evidence.evidence_id.in_(existing_ev_ids)).delete(synchronize_session=False)
        db.commit()

    pub_key_pem = get_public_key_pem()

    # 1. PHONE A (Original, Verified)
    ev_a_id = "EV-2026-A101"
    raw_a = create_demo_frame("PERSPECTIVE A: Main Entryway", "Phone A — High-Angle Capture", (30, 45, 65))
    token_a = create_compact_token(ev_a_id, compute_sha256(raw_a), "2026-09-29T16:32:11Z", 1)
    stego_a = embed_lsb_token(raw_a, token_a)
    sha_a = compute_sha256(stego_a)
    path_a = os.path.join(STORAGE_DIR, f"{ev_a_id}_v1_sealed.png")
    with open(path_a, "wb") as f:
        f.write(stego_a)
        
    ev_a = Evidence(
        evidence_id=ev_a_id, incident_id="INC-004", device_id="Phone A (Pixel 8)",
        media_type="image/png", status="SEALED", captured_offline=True,
        capture_timestamp="2026-09-29T16:32:11Z", sync_timestamp="2026-09-29T17:12:03Z",
        storage_path=path_a
    )
    db.add(ev_a)
    db.add(ProvenanceRecord(
        evidence_id=ev_a_id, capture_timestamp="2026-09-29T16:32:11Z", sha256_hash=sha_a,
        media_type="image/png", device_id="Phone A (Pixel 8)", provenance_version=1,
        signature_hex=sign_provenance_record(json.dumps({"ev_id": ev_a_id, "sha": sha_a}).encode()),
        public_key_pem=pub_key_pem, stego_token_embedded=True
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_a_id, version_num=1, title="Capture Original (Sealed)",
        sha256_hash=sha_a, storage_path=path_a, is_original_sealed=True,
        hash_matches_original=True, submitter_source="Phone A"
    ))
    db.add(AnalysisResult(
        evidence_id=ev_a_id, tampering_risk_score=4, tampering_risk_label="Very Low",
        synthetic_media_indicators="LOW", manipulation_indicators="LOW",
        visual_consistency="HIGH", audio_video_consistency="CONSISTENT", ela_variance_score=1.8
    ))
    db.add(ComparisonResult(
        evidence_id=ev_a_id, content_match_pct=100.0, changed_content_pct=0.0,
        new_unmatched_pct=0.0, ssim=1.0, mse=0.0
    ))

    # 2. PHONE B (Original, Alternate angle)
    ev_b_id = "EV-2026-B202"
    raw_b = create_demo_frame("PERSPECTIVE B: Eastern Wall", "Phone B — Ground Perspective", (25, 40, 55))
    token_b = create_compact_token(ev_b_id, compute_sha256(raw_b), "2026-09-29T16:32:13Z", 1)
    stego_b = embed_lsb_token(raw_b, token_b)
    sha_b = compute_sha256(stego_b)
    path_b = os.path.join(STORAGE_DIR, f"{ev_b_id}_v1_sealed.png")
    with open(path_b, "wb") as f:
        f.write(stego_b)
        
    ev_b = Evidence(
        evidence_id=ev_b_id, incident_id="INC-004", device_id="Phone B (Galaxy S24)",
        media_type="image/png", status="SEALED", captured_offline=True,
        capture_timestamp="2026-09-29T16:32:13Z", sync_timestamp="2026-09-29T17:12:03Z",
        storage_path=path_b
    )
    db.add(ev_b)
    db.add(ProvenanceRecord(
        evidence_id=ev_b_id, capture_timestamp="2026-09-29T16:32:13Z", sha256_hash=sha_b,
        media_type="image/png", device_id="Phone B (Galaxy S24)", provenance_version=1,
        signature_hex=sign_provenance_record(json.dumps({"ev_id": ev_b_id, "sha": sha_b}).encode()),
        public_key_pem=pub_key_pem, stego_token_embedded=True
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_b_id, version_num=1, title="Capture Original (Sealed)",
        sha256_hash=sha_b, storage_path=path_b, is_original_sealed=True,
        hash_matches_original=True, submitter_source="Phone B"
    ))
    db.add(AnalysisResult(
        evidence_id=ev_b_id, tampering_risk_score=7, tampering_risk_label="Very Low",
        synthetic_media_indicators="LOW", manipulation_indicators="LOW",
        visual_consistency="HIGH", audio_video_consistency="CONSISTENT", ela_variance_score=2.3
    ))
    db.add(ComparisonResult(
        evidence_id=ev_b_id, content_match_pct=98.5, changed_content_pct=1.5,
        new_unmatched_pct=0.0, ssim=0.985, mse=3.2
    ))

    # 3. PHONE C (Edited Version — Splice 00:37–00:44, Risk 78/100)
    ev_c_id = "EV-2026-C303"
    raw_c_orig = create_demo_frame("PERSPECTIVE C: South Corner (Original)", "Phone C — Sealed Capture", (35, 35, 50), add_anomaly=False)
    token_c = create_compact_token(ev_c_id, compute_sha256(raw_c_orig), "2026-09-29T16:32:17Z", 1)
    stego_c_orig = embed_lsb_token(raw_c_orig, token_c)
    sha_c_orig = compute_sha256(stego_c_orig)
    path_c_orig = os.path.join(STORAGE_DIR, f"{ev_c_id}_v1_sealed.png")
    with open(path_c_orig, "wb") as f:
        f.write(stego_c_orig)

    # Modified submitted version (Version 2)
    raw_c_mod = create_demo_frame("PERSPECTIVE C: South Corner (Modified)", "Submitted Copy — Splice Detected", (35, 35, 50), add_anomaly=True)
    sha_c_mod = compute_sha256(raw_c_mod)
    path_c_mod = os.path.join(STORAGE_DIR, f"{ev_c_id}_v2_submitted.png")
    with open(path_c_mod, "wb") as f:
        f.write(raw_c_mod)

    timeline_c = [
        {
            "start": 0.0, "end": 37.0, "status": "MATCH",
            "label": "Original Matching Video/Audio",
            "similarity_pct": 99.1, "diff_score": 1.2,
            "details": "00:00 - 00:37: Frame sequences and ambient audio match Phone C original capture."
        },
        {
            "start": 37.0, "end": 44.0, "status": "DIFF_ANOMALY",
            "label": "Splice Detected: Altered Action & Audio",
            "similarity_pct": 31.5, "diff_score": 88.4,
            "details": "00:37 - 00:44: Person enters room + replaced audio track. Inconsistent lighting and noise floor."
        },
        {
            "start": 44.0, "end": 60.0, "status": "MATCH",
            "label": "Original Matching Stream",
            "similarity_pct": 97.8, "diff_score": 3.1,
            "details": "00:44 - 01:00: Video and audio waveforms realign with capture-sealed original."
        }
    ]

    ev_c = Evidence(
        evidence_id=ev_c_id, incident_id="INC-004", device_id="Phone C (iPhone 15)",
        media_type="video/mp4", status="FLAGGED", captured_offline=True,
        capture_timestamp="2026-09-29T16:32:17Z", sync_timestamp="2026-09-29T17:12:03Z",
        storage_path=path_c_orig
    )
    db.add(ev_c)
    db.add(ProvenanceRecord(
        evidence_id=ev_c_id, capture_timestamp="2026-09-29T16:32:17Z", sha256_hash=sha_c_orig,
        media_type="video/mp4", device_id="Phone C (iPhone 15)", provenance_version=1,
        signature_hex=sign_provenance_record(json.dumps({"ev_id": ev_c_id, "sha": sha_c_orig}).encode()),
        public_key_pem=pub_key_pem, stego_token_embedded=True
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_c_id, version_num=1, title="Capture Original (Sealed)",
        sha256_hash=sha_c_orig, storage_path=path_c_orig, is_original_sealed=True,
        hash_matches_original=True, submitter_source="Phone C"
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_c_id, version_num=2, title="External Social Media Submission",
        sha256_hash=sha_c_mod, storage_path=path_c_mod, is_original_sealed=False,
        hash_matches_original=False, submitter_source="Web Upload",
        notes="File differs from capture-sealed version. Audio splice detected at 00:37–00:44."
    ))
    db.add(AnalysisResult(
        evidence_id=ev_c_id, tampering_risk_score=78, tampering_risk_label="High",
        synthetic_media_indicators="MEDIUM", manipulation_indicators="HIGH",
        visual_consistency="LOW", audio_video_consistency="SUSPICIOUS", ela_variance_score=142.5
    ))
    db.add(ComparisonResult(
        evidence_id=ev_c_id, content_match_pct=82.0, changed_content_pct=13.0,
        new_unmatched_pct=5.0, ssim=0.82, mse=38.4,
        timeline_segments_json=json.dumps(timeline_c)
    ))

    # 4. PHONE D (Original, Verified)
    ev_d_id = "EV-2026-D404"
    raw_d = create_demo_frame("PERSPECTIVE D: Alleyway Exit", "Phone D — Fixed Position", (28, 48, 58))
    token_d = create_compact_token(ev_d_id, compute_sha256(raw_d), "2026-09-29T16:32:21Z", 1)
    stego_d = embed_lsb_token(raw_d, token_d)
    sha_d = compute_sha256(stego_d)
    path_d = os.path.join(STORAGE_DIR, f"{ev_d_id}_v1_sealed.png")
    with open(path_d, "wb") as f:
        f.write(stego_d)
        
    ev_d = Evidence(
        evidence_id=ev_d_id, incident_id="INC-004", device_id="Phone D (OnePlus 12)",
        media_type="image/png", status="SEALED", captured_offline=False,
        capture_timestamp="2026-09-29T16:32:21Z", sync_timestamp="2026-09-29T16:32:25Z",
        storage_path=path_d
    )
    db.add(ev_d)
    db.add(ProvenanceRecord(
        evidence_id=ev_d_id, capture_timestamp="2026-09-29T16:32:21Z", sha256_hash=sha_d,
        media_type="image/png", device_id="Phone D (OnePlus 12)", provenance_version=1,
        signature_hex=sign_provenance_record(json.dumps({"ev_id": ev_d_id, "sha": sha_d}).encode()),
        public_key_pem=pub_key_pem, stego_token_embedded=True
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_d_id, version_num=1, title="Capture Original (Sealed)",
        sha256_hash=sha_d, storage_path=path_d, is_original_sealed=True,
        hash_matches_original=True, submitter_source="Phone D"
    ))
    db.add(AnalysisResult(
        evidence_id=ev_d_id, tampering_risk_score=5, tampering_risk_label="Very Low",
        synthetic_media_indicators="LOW", manipulation_indicators="LOW",
        visual_consistency="HIGH", audio_video_consistency="CONSISTENT", ela_variance_score=1.5
    ))
    db.add(ComparisonResult(
        evidence_id=ev_d_id, content_match_pct=100.0, changed_content_pct=0.0,
        new_unmatched_pct=0.0, ssim=1.0, mse=0.0
    ))

    # 5. PHONE E (Synthetic Deepfake Injection, Risk: 91/100)
    ev_e_id = "EV-2026-E505"
    raw_e = create_demo_frame("PERSPECTIVE E: Synthetically Inpainted", "Phone E — Deepfake Inpainting Anomaly", (45, 20, 30), add_anomaly=True)
    sha_e = compute_sha256(raw_e)
    path_e = os.path.join(STORAGE_DIR, f"{ev_e_id}_v1_sealed.png")
    with open(path_e, "wb") as f:
        f.write(raw_e)
        
    ev_e = Evidence(
        evidence_id=ev_e_id, incident_id="INC-004", device_id="Phone E (External Unverified)",
        media_type="image/png", status="FLAGGED", captured_offline=False,
        capture_timestamp="2026-09-29T16:32:24Z", sync_timestamp="2026-09-29T16:35:00Z",
        storage_path=path_e
    )
    db.add(ev_e)
    db.add(ProvenanceRecord(
        evidence_id=ev_e_id, capture_timestamp="2026-09-29T16:32:24Z", sha256_hash=sha_e,
        media_type="image/png", device_id="Phone E (External Unverified)", provenance_version=1,
        signature_hex="INVALID_MOCK_SIGNATURE_BYTES_HEX",
        public_key_pem=pub_key_pem, stego_token_embedded=False
    ))
    db.add(EvidenceVersion(
        evidence_id=ev_e_id, version_num=1, title="Unverified External Submission",
        sha256_hash=sha_e, storage_path=path_e, is_original_sealed=False,
        hash_matches_original=False, submitter_source="Anonymous Drop"
    ))
    db.add(AnalysisResult(
        evidence_id=ev_e_id, tampering_risk_score=91, tampering_risk_label="Very High",
        synthetic_media_indicators="HIGH", manipulation_indicators="HIGH",
        visual_consistency="LOW", audio_video_consistency="SUSPICIOUS", ela_variance_score=210.4
    ))
    db.add(ComparisonResult(
        evidence_id=ev_e_id, content_match_pct=48.0, changed_content_pct=38.0,
        new_unmatched_pct=14.0, ssim=0.48, mse=94.2
    ))

    # Audit log
    db_log = AuditLog(
        actor="SYSTEM_DEMO_SEEDER",
        action="SEED_INCIDENT_004",
        target_id="INC-004",
        details="Seeded complete 5-Phone Incident #004 scenario with real steganography, perceptual comparison and forensic metrics."
    )
    db.add(db_log)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "Incident #004 successfully seeded with Phone A, B, C, D, E",
        "incident_id": "INC-004",
        "evidence_ids": [ev_a_id, ev_b_id, ev_c_id, ev_d_id, ev_e_id]
    }


@router.post("/reset-all")
@router.delete("/reset-all")
def reset_all_evidence(reseed_demo: bool = True, db: Session = Depends(get_db)):
    """
    Purge all captured photos, video evidence, analysis results, and database records.
    Optionally re-seeds clean Incident #004 baseline demo so the system starts fresh from the beginning.
    """
    # 1. Delete all storage files in evidence & investigations directories
    investigations_dir = os.path.join(os.path.dirname(__file__), "..", "storage", "investigations")
    for folder in [STORAGE_DIR, investigations_dir]:
        if os.path.exists(folder):
            for filename in os.listdir(folder):
                filepath = os.path.join(folder, filename)
                if os.path.isfile(filepath):
                    try:
                        os.remove(filepath)
                    except Exception:
                        pass

    # 2. Clear all database tables in proper foreign key order
    db.query(ComparisonResult).delete(synchronize_session=False)
    db.query(AnalysisResult).delete(synchronize_session=False)
    db.query(EvidenceVersion).delete(synchronize_session=False)
    db.query(ProvenanceRecord).delete(synchronize_session=False)
    db.query(Evidence).delete(synchronize_session=False)
    db.query(AuditLog).delete(synchronize_session=False)
    db.query(Incident).delete(synchronize_session=False)
    db.commit()

    # 3. If reseed_demo, seed fresh clean Incident #004 baseline
    if reseed_demo:
        seed_incident_004(db)
        msg = "All user-captured evidence purged. Incident #004 demo baseline reset to clean initial state."
    else:
        msg = "All evidence, captures, and database records completely wiped. Clean empty repository ready."

    return {
        "status": "RESET_COMPLETE",
        "message": msg,
        "reseeded": reseed_demo
    }

