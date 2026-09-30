import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from backend.core.forensics import detect_ai_generated_image

router = APIRouter(prefix="/ai-detector", tags=["AI Media & Deepfake Detection"])


@router.post("/analyze")
async def analyze_ai_image(
    file: Optional[UploadFile] = File(None),
    data_base64: Optional[str] = Form(None)
):
    """
    Independent Standalone AI Generation & Deepfake Detector:
    Intakes any image (uploaded file or base64) and evaluates
    2D Fourier Transform (FFT) frequency spectrum, sensor pattern noise (PRNU),
    Error Level Analysis (ELA), and edge gradient smoothness to determine
    whether the image is AI-generated (Midjourney, DALL-E, Stable Diffusion, Flux, GANs)
    or a natural camera photograph.
    """
    if file:
        raw_bytes = await file.read()
    elif data_base64:
        try:
            if "," in data_base64:
                data_base64 = data_base64.split(",")[1]
            raw_bytes = base64.b64decode(data_base64)
            if not raw_bytes:
                raise ValueError("Decoded byte stream is empty")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either file upload or data_base64")

    try:
        results = detect_ai_generated_image(raw_bytes)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Detection error: {str(e)}")
