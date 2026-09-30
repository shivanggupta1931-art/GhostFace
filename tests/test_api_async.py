import io
import json
import requests
from PIL import Image

def run_all_tests():
    base_url = "http://127.0.0.1:8080"
    print(f"Testing live GHOSTFRAME API on {base_url}...")

    # 1. Health
    res = requests.get(f"{base_url}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    assert res.json()["status"] == "ok"
    print("✓ Health Check Passed")

    # 2. Seed / Reset Incident #004
    res = requests.post(f"{base_url}/api/demo/seed-incident-004")
    assert res.status_code == 200, f"Seed failed: {res.text}"
    assert res.json()["incident_id"] == "INC-004"
    print("✓ Demo Incident #004 Seeded Successfully")

    # 3. List Evidence
    res = requests.get(f"{base_url}/api/evidence")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 5
    ev_ids = [item["evidence_id"] for item in items]
    assert "EV-2026-A101" in ev_ids
    assert "EV-2026-C303" in ev_ids
    assert "EV-2026-E505" in ev_ids
    print(f"✓ Evidence List Passed ({len(items)} items verified)")

    # 4. Evidence Detail (Phone C - Splice)
    res = requests.get(f"{base_url}/api/evidence/EV-2026-C303")
    assert res.status_code == 200
    detail = res.json()
    assert detail["evidence_id"] == "EV-2026-C303"
    assert detail["analysis"]["tampering_risk_label"] == "High"
    assert detail["comparison"]["content_match_pct"] == 82.0
    assert len(detail["versions"]) == 2
    print("✓ Evidence Detail & Forensic Analysis Passed (Phone C 82% Match, Risk 78/100)")

    # 5. Capture & Seal Pipeline
    img = Image.new("RGB", (200, 200), color=(80, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    
    form_data = {
        "device_id": "Test-Pixel-9",
        "media_type": "image/png",
        "captured_offline": "false"
    }
    files = {"file": ("capture.png", buf.getvalue(), "image/png")}
    res = requests.post(f"{base_url}/api/evidence", data=form_data, files=files)
    assert res.status_code == 200
    cap_res = res.json()
    assert cap_res["status"] == "SEALED"
    assert cap_res["evidence_id"].startswith("EV-")
    assert len(cap_res["sha256"]) == 64
    assert cap_res["provenance_status"] == "VALID"
    assert cap_res["stego_token_embedded"] is True
    print(f"✓ Capture & Sealing Pipeline Passed ({cap_res['evidence_id']} SEALED ✓)")

    # 6. ELA Image Generation
    res = requests.get(f"{base_url}/api/evidence/EV-2026-A101/ela")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 100
    print("✓ ELA Visual Heatmap Generation Passed")

    # 7. Incident #004 Multi-Camera Timeline
    res = requests.get(f"{base_url}/api/incidents/INC-004/timeline")
    assert res.status_code == 200
    inc_data = res.json()
    assert inc_data["incident_id"] == "INC-004"
    assert len(inc_data["timeline"]) >= 5
    print(f"✓ Incident #004 Timeline Reconstructed ({len(inc_data['timeline'])} camera feeds)")

    # 8. PDF Report Generation
    res = requests.get(f"{base_url}/api/reports/EV-2026-C303/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")
    print(f"✓ PDF Examination Report Generated ({len(res.content)} bytes)")

    print("\nALL END-TO-END INTEGRATION TESTS PASSED 100%! 🚀")

if __name__ == "__main__":
    run_all_tests()
