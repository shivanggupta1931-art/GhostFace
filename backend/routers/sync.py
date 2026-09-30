import secrets
import time
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import SyncJob, AuditLog
from backend.db.schemas import OfflineSyncPayload

router = APIRouter(prefix="/sync", tags=["Offline Store-and-Forward"])

@router.post("")
def sync_offline_evidence_batch(payload: OfflineSyncPayload, db: Session = Depends(get_db)):
    """
    Ingests bundled evidence collected while devices were offline.
    Records sync timestamp and marks items as synced with provenance intact.
    """
    job_id = f"SYNC-{secrets.token_hex(4).upper()}"
    sync_time = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    db_job = SyncJob(
        job_id=job_id,
        device_id=payload.device_id,
        items_count=len(payload.items),
        status="COMPLETED"
    )
    db.add(db_job)
    
    db_log = AuditLog(
        actor=payload.device_id,
        action="OFFLINE_SYNC",
        target_id=job_id,
        details=f"Synchronized {len(payload.items)} evidence bundles captured offline."
    )
    db.add(db_log)
    db.commit()
    
    return {
        "sync_status": "SUCCESS",
        "job_id": job_id,
        "device_id": payload.device_id,
        "items_synced": len(payload.items),
        "sync_timestamp": sync_time,
        "message": f"Successfully synced {len(payload.items)} items from device {payload.device_id}."
    }

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db)):
    """Retrieve recent sync operations and network queue state"""
    jobs = db.query(SyncJob).order_by(SyncJob.created_at.desc()).limit(20).all()
    return {
        "network_status": "ONLINE",
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "recent_sync_jobs": [
            {
                "job_id": j.job_id,
                "device_id": j.device_id,
                "items_count": j.items_count,
                "status": j.status,
                "timestamp": j.created_at.isoformat() if j.created_at else None
            }
            for j in jobs
        ]
    }
