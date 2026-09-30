import json
import struct
import io
from typing import Optional, Dict, Any, Tuple
from PIL import Image
import numpy as np

MAGIC_HEADER = b"GHST"  # 4 bytes marker

def create_compact_token(evidence_id: str, sha256_digest: str, timestamp: str, version: int = 1) -> bytes:
    """Create compact JSON token payload"""
    token_obj = {
        "ev_id": evidence_id,
        "h": sha256_digest[:16],  # 16-char prefix for compact reference
        "ts": timestamp,
        "v": version
    }
    return json.dumps(token_obj, separators=(',', ':')).encode('utf-8')


def embed_lsb_token(image_bytes: bytes, token_payload: bytes) -> bytes:
    """
    Embeds magic header + 4-byte length + token_payload into the least significant bits of image pixels.
    Supports PNG/lossless formats. Returns PNG bytes.
    """
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA')
    
    img_array = np.array(img, dtype=np.uint8)
    
    # Full payload: MAGIC (4 bytes) + Length (4 bytes big-endian) + payload
    full_payload = MAGIC_HEADER + struct.pack(">I", len(token_payload)) + token_payload
    
    # Convert payload to bit list
    bits = []
    for byte in full_payload:
        for i in range(8):
            bits.append((byte >> (7 - i)) & 1)
            
    total_bits = len(bits)
    flat_pixels = img_array.reshape(-1)
    
    if total_bits > len(flat_pixels):
        raise ValueError("Image is too small to carry provenance payload")
        
    # Modify only LSB of flattened pixels
    for i in range(total_bits):
        flat_pixels[i] = (flat_pixels[i] & 0xFE) | bits[i]
        
    modified_array = flat_pixels.reshape(img_array.shape)
    stego_img = Image.fromarray(modified_array, mode=img.mode)
    
    out_io = io.BytesIO()
    stego_img.save(out_io, format="PNG")
    return out_io.getvalue()


def extract_lsb_token(image_bytes: bytes) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Extracts embedded steganographic provenance token from image LSBs.
    Returns: (found: bool, token_data: dict, error_or_info: str)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGBA')
            
        img_array = np.array(img, dtype=np.uint8)
        flat_pixels = img_array.reshape(-1)
        
        # Need at least 8 bytes (64 bits) for header + length
        if len(flat_pixels) < 64:
            return False, None, "Image too small to contain provenance header"
            
        # Extract first 64 bits (8 bytes)
        extracted_bytes = bytearray()
        for byte_idx in range(8):
            val = 0
            for bit_idx in range(8):
                bit = flat_pixels[byte_idx * 8 + bit_idx] & 1
                val = (val << 1) | bit
            extracted_bytes.append(val)
            
        magic = extracted_bytes[:4]
        if magic != MAGIC_HEADER:
            return False, None, "No GHOSTFRAME steganographic signature detected"
            
        payload_len = struct.unpack(">I", extracted_bytes[4:8])[0]
        if payload_len <= 0 or payload_len > 100000 or (8 + payload_len) * 8 > len(flat_pixels):
            return False, None, "Invalid provenance payload length detected"
            
        # Extract remaining payload bytes
        payload_bytes = bytearray()
        for byte_idx in range(8, 8 + payload_len):
            val = 0
            for bit_idx in range(8):
                bit = flat_pixels[byte_idx * 8 + bit_idx] & 1
                val = (val << 1) | bit
            payload_bytes.append(val)
            
        token_str = payload_bytes.decode('utf-8')
        token_data = json.loads(token_str)
        return True, token_data, "Provenance token successfully extracted from image LSB"
    except Exception as e:
        return False, None, f"Extraction failed: {str(e)}"
