# Ghostface: Digital Evidence Locker & AI Forensics Platform

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/shivanggupta1931-art/GhostFace)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-black?logo=vercel)](https://ghost-face-omega.vercel.app/)

A cryptographic digital evidence integrity and forensic analysis platform with real-time hardware capture, SHA-256 / Ed25519 tamper-proof digital sealing, forensic image/video comparator, and physics-based AI-generated image detection.

---

## 🌐 Live Deployments & Links

- **GitHub Repository**: [https://github.com/shivanggupta1931-art/GhostFace](https://github.com/shivanggupta1931-art/GhostFace)
- **Vercel Live App**: [https://ghost-face-omega.vercel.app/](https://ghost-face-omega.vercel.app/) *(or deploy with 1-click below)*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fshivanggupta1931-art%2FGhostFace)

---

## 🌟 Key Features

### 1. 🛡️ Cryptographic Evidence Locker & Sealing
- **Cryptographic Hash Integrity**: Generates SHA-256 signatures with Ed25519 digital signatures for tamper-proof chain of custody.
- **Hardware Capture**: Real-time live camera capture with hardware device metadata and timestamping.
- **Sealed Package Verification**: One-click integrity verification to prove bit-for-bit authenticity against original evidence logs.

### 2. 🔍 Forensic Comparator (Images & Videos)
- **Side-by-Side Synchronized Playback**: Synchronous frame-by-frame comparison for video clips and high-resolution images.
- **Difference Heatmaps & Structural Similarity (SSIM)**: Highlights pixel anomalies and temporal changes.
- **Frame-Accurate Scrubbing**: Inspect suspect alterations down to exact millisecond timestamps.

### 3. ✨ Physics-Calibrated AI Image Detector (Bonus Module)
- **Poisson-Gaussian Photon Shot Noise Model ($N \propto \sqrt{I}$)**: Differentiates physical CMOS photon arrival physics from synthetic generative diffusion distributions.
- **2D Hann-Apodized Fourier Spectrum (FFT)**: Detects periodic deconvolution grid spikes while eliminating artificial windowing border effects.
- **Transposed Convolution Grid Autocorrelation**: Uncovers upsampling artifacts from GANs and Diffusion decoders.
- **Sensor PRNU & Error Level Analysis (ELA)**: Validates Photo-Response Non-Uniformity and 8x8 DCT compression quantization errors.
- **Visual Diagnostic Heatmaps**: Interactive 2D FFT spectrum, PRNU noise field, and compression delta heatmaps.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
```

The API and documentation will be available at:
- **API Base**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will run at:
- **Web App (Dev)**: `http://localhost:5173`

---

## 🛠️ Architecture & Tech Stack

- **Backend**: FastAPI, Uvicorn, Pydantic, Cryptography (Ed25519, SHA-256), NumPy, SciPy, Scikit-Image, OpenCV, Pillow.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas API.
- **Testing**: Pytest, Pytest-Asyncio, HTTPX.

---

## 🧪 Running Tests

```bash
pytest
```

---

## 📄 License
MIT License
