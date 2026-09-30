import hashlib
import os
import secrets
import time
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

KEY_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "keys")
os.makedirs(KEY_DIR, exist_ok=True)
PRIV_KEY_PATH = os.path.join(KEY_DIR, "ed25519_private.pem")
PUB_KEY_PATH = os.path.join(KEY_DIR, "ed25519_public.pem")


def get_or_create_keypair() -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
    if os.path.exists(PRIV_KEY_PATH) and os.path.exists(PUB_KEY_PATH):
        with open(PRIV_KEY_PATH, "rb") as f:
            private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUB_KEY_PATH, "rb") as f:
            public_key = serialization.load_pem_public_key(f.read())
        return private_key, public_key
    else:
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        
        priv_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        pub_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        with open(PRIV_KEY_PATH, "wb") as f:
            f.write(priv_pem)
        with open(PUB_KEY_PATH, "wb") as f:
            f.write(pub_pem)
        return private_key, public_key


def generate_evidence_id() -> str:
    """Collision-resistant Evidence ID: EV-YYYY-HEX6"""
    year = time.strftime("%Y")
    hex_rand = secrets.token_hex(3).upper()
    return f"EV-{year}-{hex_rand}"


def compute_sha256(data: bytes) -> str:
    """Calculate exact SHA-256 byte digest"""
    return hashlib.sha256(data).hexdigest()


def sign_provenance_record(record_payload: bytes, private_key: ed25519.Ed25519PrivateKey = None) -> str:
    """Sign canonical canonical provenance bytes with Ed25519"""
    if private_key is None:
        private_key, _ = get_or_create_keypair()
    sig = private_key.sign(record_payload)
    return sig.hex()


def verify_provenance_signature(record_payload: bytes, signature_hex: str, public_key: ed25519.Ed25519PublicKey = None) -> bool:
    """Verify Ed25519 digital signature of provenance bytes"""
    if public_key is None:
        _, public_key = get_or_create_keypair()
    try:
        sig_bytes = bytes.fromhex(signature_hex)
        public_key.verify(sig_bytes, record_payload)
        return True
    except Exception:
        return False


def get_public_key_pem() -> str:
    _, pub = get_or_create_keypair()
    return pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
