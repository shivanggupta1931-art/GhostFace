import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Upload, CheckCircle2, AlertTriangle, ShieldAlert, 
  ArrowRight, Eye, RefreshCw, Info, Image as ImageIcon, Sparkles,
  Layers, Lock, Sliders, Database, Check, X, SplitSquareVertical,
  Video, Film, Clock, Play
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { compareDirectImages, getMediaUrl } from '../api';

interface ImageComparatorProps {
  evidenceList: EvidenceItem[];
  initialSelectedId?: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ 
  evidenceList, 
  initialSelectedId,
  onSelectEvidence 
}) => {
  // Selection modes for Media A
  const [sourceModeA, setSourceModeA] = useState<'storage' | 'upload'>('storage');
  const [selectedStorageId, setSelectedStorageId] = useState<string>(initialSelectedId || '');
  const [fileA, setFileA] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [isVideoA, setIsVideoA] = useState<boolean>(false);

  // Media B (Comparison / Upload)
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [isVideoB, setIsVideoB] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>('');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [activeVisualTab, setActiveVisualTab] = useState<'delta_overlay' | 'side_by_side' | 'timeline'>('delta_overlay');

  // Helper to check if file/evidence is video
  const checkIsVideo = (file: File | null, storageId?: string, url?: string | null) => {
    if (file) {
      return file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);
    }
    if (storageId) {
      const ev = evidenceList.find((e) => e.evidence_id === storageId);
      if (ev && ev.media_type && ev.media_type.toLowerCase().includes('video')) return true;
    }
    if (url && (url.startsWith('data:video/') || /\.(mp4|webm|mov|avi|mkv)/i.test(url))) return true;
    return false;
  };

  // Initialize or update selected storage item
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedStorageId(initialSelectedId);
      setSourceModeA('storage');
    } else if (evidenceList.length > 0 && !selectedStorageId) {
      setSelectedStorageId(evidenceList[0].evidence_id);
    }
  }, [initialSelectedId, evidenceList]);

  // Update preview for Storage Media A
  useEffect(() => {
    if (sourceModeA === 'storage' && selectedStorageId) {
      const url = getMediaUrl(selectedStorageId, 1);
      setPreviewA(url);
      setIsVideoA(checkIsVideo(null, selectedStorageId, url));
    } else if (sourceModeA === 'upload' && fileA) {
      const url = URL.createObjectURL(fileA);
      setPreviewA(url);
      setIsVideoA(checkIsVideo(fileA, undefined, url));
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewA(null);
      setIsVideoA(false);
    }
  }, [sourceModeA, selectedStorageId, fileA, evidenceList]);

  // Update preview for Media B
  useEffect(() => {
    if (fileB) {
      const url = URL.createObjectURL(fileB);
      setPreviewB(url);
      setIsVideoB(checkIsVideo(fileB, undefined, url));
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewB(null);
      setIsVideoB(false);
    }
  }, [fileB]);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceModeA === 'storage' && !selectedStorageId) {
      alert('Please select a sealed photo or video from storage for Media A');
      return;
    }
    if (sourceModeA === 'upload' && !fileA) {
      alert('Please upload Media A');
      return;
    }
    if (!fileB) {
      alert('Please select or drop Media B to compare');
      return;
    }

    setIsComparing(true);
    try {
      const formData = new FormData();
      if (sourceModeA === 'storage') {
        formData.append('evidence_id_a', selectedStorageId);
      } else if (fileA) {
        formData.append('file_a', fileA);
      }
      formData.append('file_b', fileB);
      if (notes) formData.append('notes', notes);

      const res = await compareDirectImages(formData);
      setResult(res);

      if (res.media_mode === 'video' || (res.visual_comparison && res.visual_comparison.timeline_segments)) {
        setActiveVisualTab('timeline');
      } else {
        setActiveVisualTab('delta_overlay');
      }
    } catch (err: any) {
      alert(`Comparison error: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0D1424] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
            FORENSIC MEDIA COMPARATOR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs font-mono text-slate-400">Photos & Video Clips Engine</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          Side-by-Side Steganography, Video Timeline & Visual Comparator
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed font-sans">
          Select any sealed capture from your local storage / evidence repository as <strong>Media A</strong> (Photo or Video Clip), and compare it against any questioned file as <strong>Media B</strong>. GHOSTFRAME will decode embedded steganographic provenance tokens, analyze temporal frame sequences, highlight altered regions with delta bounding boxes, and compute structural similarity metrics.
        </p>
      </div>

      {/* Two-Way Input Grid */}
      <form onSubmit={handleCompare} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box A: Reference / Storage Media */}
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-bold text-xs">
                  MEDIA A
                </span>
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  Reference / Sealed Original
                </span>
              </div>

              {/* Source Switcher */}
              <div className="flex items-center bg-[#161F36] p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setSourceModeA('storage')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    sourceModeA === 'storage' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  From Storage
                </button>
                <button
                  type="button"
                  onClick={() => setSourceModeA('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    sourceModeA === 'upload' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {sourceModeA === 'storage' ? (
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400 block">
                  Select Sealed Evidence Record ({evidenceList.length} available):
                </label>
                {evidenceList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 text-center">
                    No sealed media in storage yet. Capture a photo or video clip in Evidence Recorder first.
                  </div>
                ) : (
                  <select
                    value={selectedStorageId}
                    onChange={(e) => setSelectedStorageId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161F36] border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {evidenceList.map((ev) => {
                      const isVid = ev.media_type && ev.media_type.toLowerCase().includes('video');
                      return (
                        <option key={ev.evidence_id} value={ev.evidence_id}>
                          {ev.evidence_id} • {isVid ? '🎥 Video' : '📷 Photo'} • {ev.device_id.split(' ')[0]} ({ev.capture_timestamp.slice(11, 19)} UTC)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-5 text-center transition-all bg-[#090E1A] cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,video/*,.mp4,.webm,.mov,.png,.jpg,.jpeg"
                  onChange={(e) => setFileA(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-200">
                  {fileA ? fileA.name : 'Select or drop Reference Media A'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Photos (PNG, JPG) or Videos (MP4, WebM)
                </div>
              </div>
            )}

            {/* Preview A */}
            <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 aspect-[4/3] flex items-center justify-center relative">
              {previewA ? (
                isVideoA ? (
                  <video 
                    src={previewA} 
                    controls 
                    playsInline 
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img src={previewA} alt="Preview A" className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-xs font-mono text-slate-600">No Media A Selected</div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1">
                {isVideoA ? <Film className="w-3 h-3 text-sky-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
                <span>Media A Preview ({isVideoA ? 'Video' : 'Photo'})</span>
              </span>
            </div>
          </div>

          {/* Box B: Comparison / Questioned Media */}
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                  MEDIA B
                </span>
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  Questioned / Comparison Media
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">External File</span>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-5 text-center transition-all bg-[#090E1A] cursor-pointer relative">
              <input
                type="file"
                accept="image/*,video/*,.mp4,.webm,.mov,.png,.jpg,.jpeg"
                onChange={(e) => setFileB(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSearch className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-200">
                {fileB ? fileB.name : 'Select or drop Questioned Media B'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Photos (PNG, JPG) or Videos (MP4, WebM, MOV)
              </div>
            </div>

            {/* Preview B */}
            <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 aspect-[4/3] flex items-center justify-center relative">
              {previewB ? (
                isVideoB ? (
                  <video 
                    src={previewB} 
                    controls 
                    playsInline 
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img src={previewB} alt="Preview B" className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-xs font-mono text-slate-600">No Media B Selected</div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1">
                {isVideoB ? <Film className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
                <span>Media B Preview ({isVideoB ? 'Video' : 'Photo'})</span>
              </span>
            </div>
          </div>

        </div>

        {/* Submit Comparison Button */}
        <button
          type="submit"
          disabled={isComparing || (!previewA || !fileB)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm font-mono tracking-wider uppercase shadow-xl shadow-blue-600/25 border border-blue-400/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
          <span>{isComparing ? 'Analyzing Video & Steganography Alignment...' : 'Run Forensic Media Comparison'}</span>
        </button>
      </form>

      {/* Comparison Results */}
      {result && (
        <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          
          {/* Main Verdict Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Forensic Comparison Verdict</span>
              <h3 className="text-lg font-bold text-white font-mono">
                {result.verdict_summary}
              </h3>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border self-start sm:self-auto ${
              result.cryptographic_integrity.exact_sha256_match
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            }`}>
              {result.cryptographic_integrity.exact_sha256_match ? 'EXACT BIT MATCH ✓' : 'MODIFIED CONTENT ⚠'}
            </div>
          </div>

          {/* Steganography & Container Provenance Card */}
          <div className="bg-[#131C31] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase">
                  Steganography & Container Token Analysis
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                result.steganography_analysis.token_preserved || result.steganography_analysis.verdict?.includes('VERIFIED')
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {result.steganography_analysis.verdict}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-[#0A0F1D] p-3 rounded-xl border border-slate-800">
              {result.steganography_analysis.summary}
            </p>

            {/* Token / Container Payload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Media A Token</span>
                  <span className={`text-[10px] font-bold ${result.image_a.stego_found ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {result.image_a.stego_found ? 'TOKEN PRESENT ✓' : result.image_a.is_video ? 'VIDEO CONTAINER' : 'NO TOKEN'}
                  </span>
                </div>
                {result.image_a.stego_token ? (
                  <pre className="p-2.5 rounded bg-[#0A0F1D] text-[11px] text-sky-300 overflow-x-auto">
                    {JSON.stringify(result.image_a.stego_token, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[11px] text-slate-400 italic p-2 bg-[#0A0F1D] rounded">
                    {result.image_a.stego_message || 'Container hash attested'}
                  </div>
                )}
              </div>

              <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Media B Token</span>
                  <span className={`text-[10px] font-bold ${result.image_b.stego_found ? 'text-emerald-400' : result.image_b.is_video ? 'VIDEO CONTAINER' : 'text-rose-400'}`}>
                    {result.image_b.stego_found ? 'TOKEN PRESENT ✓' : result.image_b.is_video ? 'VIDEO CONTAINER' : 'NO TOKEN DETECTED'}
                  </span>
                </div>
                {result.image_b.stego_token ? (
                  <pre className="p-2.5 rounded bg-[#0A0F1D] text-[11px] text-sky-300 overflow-x-auto">
                    {JSON.stringify(result.image_b.stego_token, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[11px] text-slate-400 italic p-2 bg-[#0A0F1D] rounded">
                    {result.image_b.stego_message || 'Container hash analysis complete'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual / Video Difference Viewer */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SplitSquareVertical className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase">
                  {result.media_mode === 'video' ? 'Video Temporal & Visual Alignment' : 'Visual Difference & Delta Mapping'}
                </h4>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-[#161F36] p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                {result.visual_comparison?.timeline_segments && (
                  <button
                    type="button"
                    onClick={() => setActiveVisualTab('timeline')}
                    className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                      activeVisualTab === 'timeline' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Timeline Map</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveVisualTab('delta_overlay')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeVisualTab === 'delta_overlay' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Delta Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVisualTab('side_by_side')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeVisualTab === 'side_by_side' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Video Timeline Segment View */}
            {activeVisualTab === 'timeline' && result.visual_comparison?.timeline_segments && (
              <div className="bg-[#131C31] rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Video Temporal Alignment ({result.visual_comparison.duration_seconds || '0'}s Stream)
                  </span>
                  <span className="text-xs font-mono text-blue-400">
                    {result.visual_comparison.timeline_segments.length} Time Segments Analyzed
                  </span>
                </div>

                {/* Visual Timeline Bar */}
                <div className="h-6 w-full rounded-xl overflow-hidden flex bg-black border border-slate-700">
                  {result.visual_comparison.timeline_segments.map((seg: any, idx: number) => {
                    const dur = Math.max(0.1, (seg.end - seg.start));
                    const totalDur = result.visual_comparison.duration_seconds || 1;
                    const widthPct = Math.max(5, (dur / totalDur) * 100);
                    const isMatch = seg.status === 'MATCH';
                    const isAnomaly = seg.status === 'DIFF_ANOMALY';
                    return (
                      <div
                        key={idx}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full border-r border-slate-900 transition-all ${
                          isMatch ? 'bg-emerald-600/80 hover:bg-emerald-500' : isAnomaly ? 'bg-rose-600/80 hover:bg-rose-500' : 'bg-amber-600/80 hover:bg-amber-500'
                        }`}
                        title={`${seg.label} (${seg.start}s - ${seg.end}s): ${seg.similarity_pct}%`}
                      />
                    );
                  })}
                </div>

                {/* Segment Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {result.visual_comparison.timeline_segments.map((seg: any, idx: number) => {
                    const isMatch = seg.status === 'MATCH';
                    const isAnomaly = seg.status === 'DIFF_ANOMALY';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                          isMatch 
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                            : isAnomaly 
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' 
                            : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{seg.start}s – {seg.end}s</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/40 border border-white/10">
                            {seg.similarity_pct}% Match
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200">{seg.label}</div>
                        <p className="text-[11px] text-slate-400">{seg.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delta Overlay Map View */}
            {activeVisualTab === 'delta_overlay' && result.visual_comparison?.diff_overlay_base64 && (
              <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 p-2 flex flex-col items-center">
                <img 
                  src={result.visual_comparison.diff_overlay_base64} 
                  alt="Delta Overlay" 
                  className="max-h-[460px] w-full object-contain rounded-xl"
                />
                <div className="flex items-center justify-between w-full mt-2 px-3 text-[11px] font-mono text-slate-400">
                  <span>Red bounding boxes highlight altered pixels / keyframe disparity</span>
                  <span className="text-amber-400 font-bold">
                    {result.visual_comparison.changed_regions_count || 0} delta region(s) detected
                  </span>
                </div>
              </div>
            )}

            {/* Side-by-Side View */}
            {activeVisualTab === 'side_by_side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 p-2">
                  {result.image_a?.is_video ? (
                    <video 
                      src={result.image_a.preview_url} 
                      controls 
                      playsInline 
                      className="w-full aspect-[4/3] object-contain rounded-xl bg-black"
                    />
                  ) : (
                    <img src={result.image_a.preview_url} alt="Media A" className="w-full aspect-[4/3] object-contain rounded-xl" />
                  )}
                  <div className="text-center font-mono text-[11px] text-slate-400 mt-1">
                    Media A ({result.image_a.name})
                  </div>
                </div>

                <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 p-2">
                  {result.image_b?.is_video ? (
                    <video 
                      src={result.image_b.preview_url} 
                      controls 
                      playsInline 
                      className="w-full aspect-[4/3] object-contain rounded-xl bg-black"
                    />
                  ) : (
                    <img src={result.image_b.preview_url} alt="Media B" className="w-full aspect-[4/3] object-contain rounded-xl" />
                  )}
                  <div className="text-center font-mono text-[11px] text-slate-400 mt-1">
                    Media B ({result.image_b.name})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantitative Forensic Metrics Radar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs text-center">
            <div className={`p-3.5 rounded-xl border ${
              result.forensics.tampering_risk_score <= 15
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : result.forensics.tampering_risk_score <= 60
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}>
              <span className="text-[10px] text-slate-400 block uppercase">Tampering Risk</span>
              <span className="text-xl font-black">{result.forensics.tampering_risk_score} / 100</span>
              <span className="block text-[10px] font-bold mt-0.5">{result.forensics.tampering_risk_label}</span>
            </div>

            <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Content Match</span>
              <span className="text-xl font-black text-blue-400">{result.visual_comparison.content_match_pct}%</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Perceptual Alignment</span>
            </div>

            <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">SSIM Index</span>
              <span className="text-xl font-black text-slate-200">{result.visual_comparison.ssim}</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Structural Similarity</span>
            </div>

            <div className="bg-[#161F36] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Changed Content</span>
              <span className="text-xl font-black text-amber-400">{result.visual_comparison.changed_content_pct}%</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Disparity / Splice</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hashes */}
          <div className="p-3.5 rounded-xl bg-[#0A0F1D] border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="break-all">Media A SHA-256: <strong className="text-slate-300">{result.image_a.sha256}</strong></div>
            <div className="break-all">Media B SHA-256: <strong className="text-slate-300">{result.image_b.sha256}</strong></div>
          </div>

        </div>
      )}

    </div>
  );
};
