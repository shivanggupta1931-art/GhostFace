import React, { useState } from 'react';
import { 
  Sparkles, Upload, Eye, RefreshCw, AlertTriangle, CheckCircle2, 
  ShieldAlert, Layers, Activity, Cpu, Sliders, Info, Zap, Download,
  Image as ImageIcon, HelpCircle, ArrowRight
} from 'lucide-react';
import { analyzeAiImage } from '../api';

export const AiDetector: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [activeVisualMap, setActiveVisualMap] = useState<'fft' | 'noise' | 'ela' | 'original'>('fft');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      const url = URL.createObjectURL(dropped);
      setPreviewUrl(url);
      setResult(null);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file && !previewUrl) {
      alert('Please upload or drop an image first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (previewUrl) {
        formData.append('data_base64', previewUrl);
      }

      const data = await analyzeAiImage(formData);
      setResult(data);
    } catch (err: any) {
      alert(`Detection failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample quick test generator
  const loadDemoSample = (type: 'ai' | 'real') => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'ai') {
      // Create a smooth diffusion-like gradient with high-frequency periodic grid spikes
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#8B5CF6');
      grad.addColorStop(0.5, '#EC4899');
      grad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Add synthetic grid patterns (characteristic of transposed conv upscalers)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let y = 0; y < 480; y += 8) {
        for (let x = 0; x < 640; x += 8) {
          ctx.fillRect(x, y, 4, 4);
        }
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Synthetic AI Test Sample', 50, 240);
    } else {
      // Create natural camera shot with simulated CMOS photon noise
      ctx.fillStyle = '#2A3B5C';
      ctx.fillRect(0, 0, 640, 480);
      const imgData = ctx.getImageData(0, 0, 640, 480);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 35;
        imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
        imgData.data[i+1] = Math.min(255, Math.max(0, imgData.data[i+1] + noise));
        imgData.data[i+2] = Math.min(255, Math.max(0, imgData.data[i+2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('Natural CMOS Sensor Capture', 50, 240);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setFile(null);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0D1424] border border-purple-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
            BONUS FORENSIC SUITE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-xs font-mono text-slate-400">Independent AI & Deepfake Verification Engine</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          AI-Generated Image & Deepfake Detector
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed font-sans">
          This standalone utility inspects any submitted image for <strong>2D Fourier Transform (FFT) frequency spectrum artifacts</strong>, <strong>CMOS sensor pattern noise (PRNU)</strong>, and <strong>Error Level Analysis (ELA)</strong> compression variance to determine whether it was generated by generative AI models (Midjourney, DALL-E, Stable Diffusion, Flux, GANs) or taken with a physical camera.
        </p>

        {/* Demo Preset Buttons */}
        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400">Quick Test Presets:</span>
          <button
            type="button"
            onClick={() => loadDemoSample('ai')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            ⚡ Load AI Generator Sample
          </button>
          <button
            type="button"
            onClick={() => loadDemoSample('real')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            📷 Load Real Camera Sample
          </button>
        </div>
      </div>

      {/* Main Upload & Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image Ingestion (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D1322] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-300 font-bold uppercase">
              Target Image For Inspection
            </span>
            {previewUrl && (
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }}
                className="text-[11px] font-mono text-rose-400 hover:text-rose-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
              previewUrl 
                ? 'border-purple-500/40 bg-[#090E1A]' 
                : 'border-slate-700 hover:border-purple-500 bg-[#090E1A]/80 cursor-pointer'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            
            {previewUrl ? (
              <div className="space-y-3">
                <div className="aspect-[4/3] w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img src={previewUrl} alt="Inspection Target" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs font-mono text-slate-300 font-bold truncate">
                  {file ? file.name : 'Custom Test Image'}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Rendered Frame'} • Click or drop to replace
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/20">
                  <Upload className="w-7 h-7 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-200">Select or drop an image to check</div>
                  <div className="text-xs text-slate-400 font-mono">PNG, JPG, WEBP, or JPEG</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !previewUrl}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-extrabold text-sm font-mono tracking-wider uppercase shadow-xl shadow-purple-600/25 border border-purple-400/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Running Spectral & Noise Analysis...' : 'Detect AI Generation'}</span>
          </button>
        </div>

        {/* Right Column: Forensic Results & Visual Maps (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {result ? (
            <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                    AI Probability Verdict
                  </span>
                  <h3 className="text-xl font-black text-white font-mono mt-0.5">
                    {result.verdict_label}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-1">
                    {result.verdict_description}
                  </p>
                </div>

                {/* Probability Badge */}
                <div 
                  style={{ backgroundColor: `${result.badge_color}20`, borderColor: `${result.badge_color}50` }}
                  className="px-4 py-2 rounded-2xl border text-center self-start sm:self-auto shrink-0"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-300 block uppercase">
                    AI Probability
                  </span>
                  <span 
                    style={{ color: result.badge_color }}
                    className="text-2xl font-black font-mono tracking-tight"
                  >
                    {result.ai_probability_pct}%
                  </span>
                </div>
              </div>

              {/* Suspected Architecture Fingerprint Card */}
              <div className="bg-[#131C31] p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs font-mono">
                  <span className="text-slate-400 font-semibold block">Inferred Generation Pipeline:</span>
                  <span className="text-slate-200 font-bold text-sm block">
                    {result.suspected_architecture}
                  </span>
                </div>
              </div>

              {/* Visual Maps Tab View */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Spectral & Noise Inspection Maps</span>
                  </span>

                  {/* Switcher */}
                  <div className="flex items-center bg-[#161F36] p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveVisualMap('fft')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeVisualMap === 'fft' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      2D FFT Spectrum
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVisualMap('noise')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeVisualMap === 'noise' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      PRNU Noise
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVisualMap('ela')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeVisualMap === 'ela' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ELA Map
                    </button>
                  </div>
                </div>

                {/* Map Display Box */}
                <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 p-2 flex flex-col items-center">
                  {activeVisualMap === 'fft' && result.visual_maps.fft_spectrum_base64 && (
                    <div className="w-full space-y-2">
                      <img 
                        src={result.visual_maps.fft_spectrum_base64} 
                        alt="2D FFT Spectrum" 
                        className="max-h-[360px] w-full object-contain rounded-xl"
                      />
                      <div className="text-[11px] font-mono text-slate-400 px-2 flex items-center justify-between">
                        <span>2D Fourier Transform (FFT) Power Spectrum</span>
                        <span className="text-purple-400">
                          {result.forensic_signals.fft_spectral_anomaly.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeVisualMap === 'noise' && result.visual_maps.noise_residual_base64 && (
                    <div className="w-full space-y-2">
                      <img 
                        src={result.visual_maps.noise_residual_base64} 
                        alt="Sensor Noise Residual" 
                        className="max-h-[360px] w-full object-contain rounded-xl"
                      />
                      <div className="text-[11px] font-mono text-slate-400 px-2 flex items-center justify-between">
                        <span>Sensor Photo-Response Non-Uniformity (PRNU) Map</span>
                        <span className="text-purple-400">
                          {result.forensic_signals.sensor_noise_prnu.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeVisualMap === 'ela' && result.visual_maps.ela_heatmap_base64 && (
                    <div className="w-full space-y-2">
                      <img 
                        src={result.visual_maps.ela_heatmap_base64} 
                        alt="Error Level Analysis" 
                        className="max-h-[360px] w-full object-contain rounded-xl"
                      />
                      <div className="text-[11px] font-mono text-slate-400 px-2 flex items-center justify-between">
                        <span>Error Level Analysis (ELA) Compression Residual</span>
                        <span className="text-purple-400">
                          {result.forensic_signals.ela_compression_uniformity.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Forensic Metric Cards Grid (4 Pillars) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                
                {/* 1. FFT Frequency */}
                <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">FFT Frequency Grid Spikes</span>
                    <span className="text-purple-400">{result.forensic_signals.fft_spectral_anomaly.score}/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    {result.forensic_signals.fft_spectral_anomaly.explanation}
                  </div>
                </div>

                {/* 2. Poisson Photon Noise Physics */}
                <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">Photon Shot Noise (N ~ √I)</span>
                    <span className="text-purple-400">{result.forensic_signals.poisson_noise_physics?.score ?? 25}/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    {result.forensic_signals.poisson_noise_physics?.explanation ?? 'Tests physical CMOS photon arrival physics versus synthetic uniform noise.'}
                  </div>
                </div>

                {/* 3. Sensor PRNU Noise */}
                <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">Sensor Noise (PRNU)</span>
                    <span className="text-purple-400">{result.forensic_signals.sensor_noise_prnu.score}/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    {result.forensic_signals.sensor_noise_prnu.explanation}
                  </div>
                </div>

                {/* 4. ELA */}
                <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">ELA Grid Consistency</span>
                    <span className="text-purple-400">{result.forensic_signals.ela_compression_uniformity.score}/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    {result.forensic_signals.ela_compression_uniformity.explanation}
                  </div>
                </div>

              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-[#090E1A] border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{result.disclaimer}</span>
              </div>

            </div>
          ) : (
            <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-8 text-center space-y-3 h-full flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white font-mono">No Image Analyzed Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm font-sans">
                Upload or drag any picture to start deepfake & generative AI frequency analysis.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
