import io
import json
import unittest
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal
from backend.routers import demo

class EndToEndApiTests(unittest.TestCase):
    def setUp(self):
        db = SessionLocal()
        try:
            demo.seed_incident_004(db)
        finally:
            db.close()
        self.client = TestClient(app)

    def test_health_and_root(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_seeded_incident_and_evidence(self):
        res = self.client.get("/api/evidence")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreaterEqual(len(items), 5)
        
        ev_ids = [item["evidence_id"] for item in items]
        self.assertIn("EV-2026-A101", ev_ids)
        self.assertIn("EV-2026-C303", ev_ids)
        self.assertIn("EV-2026-E505", ev_ids)

    def test_evidence_detail_and_provenance(self):
        res = self.client.get("/api/evidence/EV-2026-C303")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["evidence_id"], "EV-2026-C303")
        self.assertIn("provenance", data)
        self.assertIn("comparison", data)
        self.assertIn("analysis", data)
        self.assertEqual(data["analysis"]["tampering_risk_label"], "High")
        self.assertEqual(data["comparison"]["content_match_pct"], 82.0)
        self.assertEqual(len(data["versions"]), 2)

    def test_capture_and_seal_flow(self):
        # Create a fresh synthetic PNG test image
        img = Image.new("RGB", (200, 200), color=(80, 120, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        response = self.client.post(
            "/api/evidence",
            data={"device_id": "Test-Pixel-9", "media_type": "image/png", "captured_offline": "false"},
            files={"file": ("capture.png", buf.getvalue(), "image/png")}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "SEALED")
        self.assertTrue(result["evidence_id"].startswith("EV-"))
        self.assertEqual(len(result["sha256"]), 64)
        self.assertEqual(result["provenance_status"], "VALID")
        self.assertTrue(result["stego_token_embedded"])

    def test_ela_image_generation(self):
        res = self.client.get("/api/evidence/EV-2026-A101/ela")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "image/png")
        self.assertGreater(len(res.content), 100)

    def test_incident_timeline(self):
        res = self.client.get("/api/incidents/INC-004/timeline")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["incident_id"], "INC-004")
        self.assertGreaterEqual(len(data["timeline"]), 5)
        times = [e["capture_timestamp_reported"] for e in data["timeline"]]
        self.assertEqual(times, sorted(times))

    def test_pdf_report_generation(self):
        res = self.client.get("/api/reports/EV-2026-C303/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF"))

if __name__ == "__main__":
    unittest.main()
