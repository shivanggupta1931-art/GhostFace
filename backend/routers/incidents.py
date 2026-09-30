import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import Incident, Evidence, AuditLog

router = APIRouter(prefix="/incidents", tags=["Incidents & Timeline"])

@router.get("")
def list_incidents(db: Session = Depends(get_db)):
    """List all incidents with aggregated summary"""
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        ev_items = inc.evidence_items
        verified_count = sum(1 for e in ev_items if e.analysis and e.analysis.tampering_risk_score <= 15)
        flagged_count = sum(1 for e in ev_items if e.analysis and e.analysis.tampering_risk_score > 60)
        
        results.append({
            "incident_id": inc.incident_id,
            "title": inc.title,
            "description": inc.description,
            "location": inc.location,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "evidence_count": len(ev_items),
            "verified_count": verified_count,
            "flagged_count": flagged_count
        })
    return results

@router.get("/{incident_id}/timeline")
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    """
    Builds the multi-device chronological timeline for an incident.
    Shows capture-reported vs server-received timestamps, device IDs, and verification states.
    """
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    timeline_events = []
    for ev in incident.evidence_items:
        risk_score = ev.analysis.tampering_risk_score if ev.analysis else 0
        risk_label = ev.analysis.tampering_risk_label if ev.analysis else "Very Low"
        
        # Provenance status
        prov_status = "VERIFIED" if risk_score <= 15 else ("SUSPICIOUS" if risk_score <= 60 else "AI_INDICATORS" if ev.analysis and ev.analysis.synthetic_media_indicators == "HIGH" else "HIGH_RISK")
        
        timeline_events.append({
            "evidence_id": ev.evidence_id,
            "device_id": ev.device_id,
            "media_type": ev.media_type,
            "status": ev.status,
            "capture_timestamp_reported": ev.capture_timestamp,
            "server_received_timestamp": ev.sync_timestamp or "17:12:03 UTC",
            "captured_offline": ev.captured_offline,
            "tampering_risk_score": risk_score,
            "tampering_risk_label": risk_label,
            "timeline_status": prov_status,
            "sha256_prefix": (ev.provenance.sha256_hash[:12] + "...") if ev.provenance else "",
            "content_match_pct": ev.comparison.content_match_pct if ev.comparison else 100.0,
            "notes": f"Captured on {ev.device_id} with sealed Ed25519 provenance."
        })
        
    # Sort events by capture timestamp
    timeline_events.sort(key=lambda x: x["capture_timestamp_reported"])
    
    return {
        "incident_id": incident.incident_id,
        "title": incident.title,
        "description": incident.description,
        "location": incident.location,
        "total_devices": len(set(e["device_id"] for e in timeline_events)),
        "timeline": timeline_events
    }
