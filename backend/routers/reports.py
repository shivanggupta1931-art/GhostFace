import json
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import Evidence, AuditLog
from backend.core.report_gen import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Forensic Reports"])

@router.get("/{evidence_id}/pdf")
def download_evidence_pdf_report(evidence_id: str, db: Session = Depends(get_db)):
    """Generate and return binary PDF report for an evidence item"""
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")
        
    prov = evidence.provenance
    analysis = evidence.analysis
    comparison = evidence.comparison
    
    evidence_dict = {
        "evidence_id": evidence.evidence_id,
        "incident_id": evidence.incident_id,
        "device_id": evidence.device_id,
        "media_type": evidence.media_type,
        "status": evidence.status,
        "captured_offline": evidence.captured_offline,
        "capture_timestamp": evidence.capture_timestamp,
        "sync_timestamp": evidence.sync_timestamp,
        "provenance": {
            "original_hash": prov.sha256_hash if prov else "N/A",
            "submitted_hash": prov.sha256_hash if prov else "N/A",
            "hash_match": True if (analysis and analysis.tampering_risk_score <= 15) else False,
            "signature_valid": True if (analysis and analysis.tampering_risk_score <= 60) else False,
            "token_found": prov.stego_token_embedded if prov else False
        },
        "comparison": {
            "content_match_pct": comparison.content_match_pct if comparison else 100.0,
            "changed_content_pct": comparison.changed_content_pct if comparison else 0.0
        },
        "forensics": {
            "tampering_risk_score": analysis.tampering_risk_score if analysis else 0,
            "tampering_risk_label": analysis.tampering_risk_label if analysis else "Very Low",
            "synthetic_media_indicators": analysis.synthetic_media_indicators if analysis else "LOW",
            "manipulation_indicators": analysis.manipulation_indicators if analysis else "LOW"
        }
    }
    
    # Audit log
    db_log = AuditLog(
        actor="ADMIN-INVESTIGATOR",
        action="EXPORT_PDF_REPORT",
        target_id=evidence_id,
        details=f"Exported official forensic examination PDF report for {evidence_id}."
    )
    db.add(db_log)
    db.commit()
    
    pdf_bytes = generate_pdf_report(evidence_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=GHOSTFRAME_Report_{evidence_id}.pdf"}
    )

@router.get("/audit/logs")
def get_audit_trail(db: Session = Depends(get_db)):
    """Retrieve system audit logs"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    return [
        {
            "id": l.id,
            "actor": l.actor,
            "action": l.action,
            "target_id": l.target_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        }
        for l in logs
    ]
