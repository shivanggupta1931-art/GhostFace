import io
import json
import unittest
from PIL import Image
from backend.core.crypto import (
    generate_evidence_id, compute_sha256, sign_provenance_record, 
    verify_provenance_signature, get_public_key_pem
)
from backend.core.steganography import create_compact_token, embed_lsb_token, extract_lsb_token
from backend.core.comparison import compare_images
from backend.core.forensics import perform_ela, analyze_noise_consistency, analyze_forensic_signals

class CoreAlgorithmTests(unittest.TestCase):
    def test_crypto_signing(self):
        ev_id = generate_evidence_id()
        self.assertTrue(ev_id.startswith("EV-"))
        
        payload = b"test-evidence-payload"
        digest = compute_sha256(payload)
        self.assertEqual(len(digest), 64)
        
        sig = sign_provenance_record(payload)
        self.assertEqual(len(sig), 128)  # Ed25519 64 bytes -> 128 hex chars
        self.assertTrue(verify_provenance_signature(payload, sig))
        self.assertFalse(verify_provenance_signature(b"tampered-payload", sig))

    def test_steganography_roundtrip(self):
        # Create test image
        img = Image.new("RGBA", (100, 100), color=(100, 150, 200, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        raw_bytes = buf.getvalue()
        
        token = create_compact_token("EV-2026-TEST01", "a83f91c7d4e8", "2026-09-29T12:00:00Z", 1)
        stego_bytes = embed_lsb_token(raw_bytes, token)
        
        # Extract
        found, extracted, msg = extract_lsb_token(stego_bytes)
        self.assertTrue(found)
        self.assertEqual(extracted["ev_id"], "EV-2026-TEST01")
        self.assertEqual(extracted["h"], "a83f91c7d4e8")

    def test_comparison_and_forensics(self):
        img1 = Image.new("RGB", (100, 100), color=(50, 100, 150))
        buf1 = io.BytesIO()
        img1.save(buf1, format="PNG")
        b1 = buf1.getvalue()
        
        # Identical comparison
        comp_same = compare_images(b1, b1)
        self.assertGreaterEqual(comp_same["content_match_pct"], 99.0)
        self.assertGreaterEqual(comp_same["ssim"], 0.99)
        
        # Forensic analysis for verified match
        forensics = analyze_forensic_signals(image_bytes=b1, provenance_valid=True, hash_match=True, content_match_pct=100.0)
        self.assertLessEqual(forensics["tampering_risk_score"], 15)
        self.assertEqual(forensics["tampering_risk_category"], "VERY_LOW")

if __name__ == "__main__":
    unittest.main()
