import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.db.database import Base, engine, SessionLocal
from backend.db.models import Incident
from backend.routers import auth, evidence, investigation, incidents, sync, reports, demo, ai_detector

# Create SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GHOSTFRAME Digital Evidence Platform API",
    description="Cryptographic Provenance, Steganography, Forensic Analysis & Multi-Modal Comparison Engine",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ghostframe-backend"}

# Mount Routers
app.include_router(auth.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(investigation.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(ai_detector.router, prefix="/api")

# Also mount without /api prefix for convenience
app.include_router(auth.router)
app.include_router(evidence.router)
app.include_router(investigation.router)
app.include_router(incidents.router)
app.include_router(sync.router)
app.include_router(reports.router)
app.include_router(demo.router)
app.include_router(ai_detector.router)

# Mount Frontend static files if built
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

@app.on_event("startup")
def on_startup():
    pass

# SPA Fallback for non-API web routes
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    if os.path.exists(FRONTEND_DIST):
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(
                index_file,
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
    return {
        "system": "GHOSTFRAME Evidence Platform",
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8080, reload=True)
