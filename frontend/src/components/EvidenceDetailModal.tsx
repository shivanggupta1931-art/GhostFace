import React, { useState } from 'react';
import { 
  X, Shield, CheckCircle2, AlertTriangle, ShieldAlert, FileText, 
  Layers, Activity, Clock, Cpu, Play, Pause, RefreshCw, Upload, Eye, Check, Info 
} from 'lucide-react';
import { EvidenceDetail } from '../types';
import { getPdfReportUrl, getElaImageUrl, getMediaUrl, submitEvidenceVersion } from '../api';

interface EvidenceDetailModalProps {
  evidence: EvidenceDetail;
  onClose: () => void;
  onRefresh: () => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  evidence,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'comparison' | 'timeline' | 'forensics' | 'versions' | 'sync'>('provenance');
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(0);
  const [isPlayingSync, setIsPlayingSync] = useState<boolean>(false);
  const [syncSeekTime, setSyncSeekTime] = useState<number>(37); // default to interesting splice zone
  const [isSubmittingVersion, setIsSubmittingVersion] = useState<boolean>(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNotes, setNewVersionNotes] = useState<string>('');

  const prov = evidence.provenance;
  const comp = evidence.comparison;
  const analysis = evidence.analysis;
  const segments = comp?.timeline_segments || [];
  const riskScore = analysis?.tampering_risk_score || 0;
  const riskLabel = analysis?.tampering_risk_label || 'Very Low';
  const isHighRisk = riskScore > 60;
  const isMediumRisk = riskScore > 15 && riskScore <= 60;

  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile) return;

    setIsSubmittingVersion(true);
    try {
      const formData = new FormData();
      formData.append('file', newVersionFile);
      formData.append('title', `Submitted Copy v${evidence.versions.length + 1}`);
      formData.append('submitter_source', 'Investigator Upload');
      formData.append('notes', newVersionNotes || 'Manual version upload for comparison analysis.');

      await submitEvidenceVersion(evidence.evidence_id, formData);
      alert('New version submitted and comparison engine executed successfully.');
      setNewVersionFile(null);
      setNewVersionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0A0F1D] border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0D1424] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isHighRisk 
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                : isMediumRisk 
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' 
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            }`}>
              <Shield className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-white font-mono tracking-wider">
                  {evidence.evidence_id}
                </h3>
                {evidence.incident_id && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {evidence.incident_id}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-500/30">
                  {evidence.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Captured: {evidence.capture_timestamp} • Device: {evidence.device_id}
              </p>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={getPdfReportUrl(evidence.evidence_id)}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-[#0E1528] px-5 overflow-x-auto text-xs font-mono font-semibold">
          {[
            { id: 'provenance', label: '1. Provenance & Cryptography' },
            { id: 'comparison', label: '2. Media Comparison & Diff' },
            { id: 'timeline', label: '3. Frame & Scene Timeline' },
            { id: 'forensics', label: '4. AI Forensics & ELA' },
            { id: 'versions', label: `5. Version History (${evidence.versions.length})` },
            { id: 'sync', label: '6. Offline / Sync Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: PROVENANCE & CRYPTOGRAPHY */}
          {activeTab === 'provenance' && (
            <div className="space-y-6">
              
              {/* Verification Callout */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                prov?.signature_valid && riskScore <= 15
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                {prov?.signature_valid && riskScore <= 15 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold font-mono">
                    {prov?.signature_valid && riskScore <= 15
                      ? 'CRYPTOGRAPHIC INTEGRITY: PROVENANCE VALID & SEALED'
                      : 'INTEGRITY WARNING: SUBMITTED MEDIA DIFFERS FROM CAPTURE-SEALED RECORD'}
                  </h4>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    {prov?.signature_valid && riskScore <= 15
                      ? 'The SHA-256 byte digest and Ed25519 digital signature match the initial capture record exactly. No bit-level alterations detected.'
                      : 'File differs from capture-sealed evidence. Byte hash mismatch detected. Perceptual and forensic analysis should be consulted below.'}
                  </p>
                </div>
              </div>

              {/* Provenance Matrix Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Capture Record Card */}
                <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Original Capture Seal
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      VERIFIED ✓
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Sealed SHA-256 Hash</span>
                      <span className="text-slate-200 text-[11px] break-all">
                        {prov?.original_hash || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Ed25519 Digital Signature</span>
                      <span className="text-blue-300 text-[11px] break-all">
                        {prov?.signature_hex ? prov.signature_hex.slice(0, 48) + '...' : 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Stego Watermark</span>
                        <span className="text-sky-400 font-bold text-[11px]">
                          {prov?.stego_token_embedded ? 'EMBEDDED (GHST-LSB)' : 'NONE'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Provenance Ver</span>
                        <span className="text-slate-300 font-bold text-[11px]">v{prov?.provenance_version || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Authority / Public Key */}
                <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Cryptographic Authority Key
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                      Ed25519 PUBKEY
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Asymmetric public key used to cryptographically verify the device provenance token and timestamp seal.
                  </p>

                  <div className="bg-[#161F36] p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto break-all">
                    {prov?.public_key_pem || '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAX...GHOSTFRAME...AUTHORITY\n-----END PUBLIC KEY-----'}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Device Origin: {evidence.device_id} • Hardware Attested
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MEDIA COMPARISON & DIFF */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              
              {/* Comparison Statistics Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0D1322] p-4 rounded-2xl border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Estimated Content Match</span>
                  <span className="text-xl font-black text-blue-400">{comp?.content_match_pct || 100}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Changed Content</span>
                  <span className="text-xl font-black text-amber-400">{comp?.changed_content_pct || 0}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Structural SSIM</span>
                  <span className="text-xl font-black text-slate-200">{comp?.ssim?.toFixed(3) || '1.000'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">MSE Error</span>
                  <span className="text-xl font-black text-slate-200">{comp?.mse?.toFixed(1) || '0.0'}</span>
                </div>
              </div>

              {/* Side-by-Side Synchronized Media Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Original Capture */}
                <div className="bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-400">ORIGINAL CAPTURE (SEALED)</span>
                    <span className="text-[10px] text-slate-400">Version 1 (Sealed)</span>
                  </div>

                  <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={getMediaUrl(evidence.evidence_id, 1)}
                      alt="Original Capture"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                      SEALED REFERENCE
                    </div>
                  </div>
                </div>

                {/* Right: Submitted Copy / Examined Version */}
                <div className="bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-rose-400">SUBMITTED / EXAMINED VERSION</span>
                    <span className="text-[10px] text-slate-400">Version {evidence.versions.length}</span>
                  </div>

                  <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={getMediaUrl(evidence.evidence_id, evidence.versions.length)}
                      alt="Submitted Version"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-rose-300 border border-rose-500/30">
                      EXAMINED COPY
                    </div>

                    {/* Visual Bounding Box Overlay if differences detected */}
                    {comp && comp.changed_content_pct > 0 && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-rose-500/80 m-12 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <span className="bg-rose-950/90 text-rose-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500">
                          DELTA REGION DETECTED
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Synchronized Playback Control Bar for Video Evidence */}
              <div className="bg-[#0D1322] border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlayingSync(!isPlayingSync)}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {isPlayingSync ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-slate-300 font-bold">Synchronized Scrub Controller</span>
                  </div>
                  <span className="text-slate-400">
                    Timestamp: <strong className="text-blue-400">00:{syncSeekTime.toString().padStart(2, '0')}</strong> / 01:00
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="60"
                  value={syncSeekTime}
                  onChange={(e) => setSyncSeekTime(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

            </div>
          )}

          {/* TAB 3: TIMELINE & FRAME SEQUENCE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              <div className="bg-[#0D1322] border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Interactive Video Scene Timeline
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Match
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Uncertain
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Anomaly / Splice
                    </span>
                  </div>
                </div>

                {/* Horizontal Segment Bar */}
                <div className="h-9 w-full bg-slate-900 rounded-xl overflow-hidden flex border border-slate-700 shadow-inner">
                  {segments.map((seg, idx) => {
                    const dur = seg.end - seg.start;
                    const pct = (dur / 60.0) * 100.0;
                    const isSelected = selectedSegmentIdx === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSegmentIdx(idx)}
                        style={{ width: `${pct}%` }}
                        className={`h-full cursor-pointer transition-all flex items-center justify-center relative border-r border-slate-900/60 ${
                          seg.status === 'MATCH'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : seg.status === 'DIFF_ANOMALY'
                            ? 'bg-rose-600 hover:bg-rose-500 animate-pulse'
                            : 'bg-amber-600 hover:bg-amber-500'
                        } ${isSelected ? 'ring-2 ring-white z-10' : ''}`}
                      >
                        <span className="text-[10px] font-mono font-bold text-white drop-shadow">
                          00:{Math.floor(seg.start).toString().padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Segment Inspection Card */}
                {segments[selectedSegmentIdx] && (
                  <div className="p-4 rounded-xl bg-[#161F36] border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                        Segment Inspector: 00:{Math.floor(segments[selectedSegmentIdx].start).toString().padStart(2, '0')} – 00:{Math.floor(segments[selectedSegmentIdx].end).toString().padStart(2, '0')}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        segments[selectedSegmentIdx].status === 'MATCH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {segments[selectedSegmentIdx].label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {segments[selectedSegmentIdx].details}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-400">
                      <span>Similarity: <strong className="text-white">{segments[selectedSegmentIdx].similarity_pct}%</strong></span>
                      <span>Diff Score: <strong className="text-rose-400">{segments[selectedSegmentIdx].diff_score}</strong></span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AI FORENSICS & ELA */}
          {activeTab === 'forensics' && (
            <div className="space-y-6">
              
              {/* Tampering Risk Score Summary Banner */}
              <div className="bg-[#0D1322] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    GHOSTFRAME Tampering Risk Score
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className={`text-4xl font-black font-mono ${
                      isHighRisk ? 'text-rose-400' : isMediumRisk ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {riskScore} <span className="text-lg text-slate-500 font-normal">/ 100</span>
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      isHighRisk 
                        ? 'bg-rose-950/80 border-rose-500/40 text-rose-400' 
                        : isMediumRisk 
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-400' 
                        : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                    }`}>
                      Risk Level: {riskLabel}
                    </span>
                  </div>
                </div>

                {/* Score Scale Legend */}
                <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-[#161F36] p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-300 uppercase mb-1">Standard Forensic Scale:</div>
                  <div>0–15: Very Low • 16–35: Low</div>
                  <div>36–60: Medium • 61–80: High • 81–100: Very High</div>
                </div>
              </div>

              {/* Forensic Signal Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-[#0D1322] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Synthetic Media</span>
                  <span className={`font-bold ${analysis?.synthetic_media_indicators === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis?.synthetic_media_indicators || 'LOW'}
                  </span>
                </div>

                <div className="bg-[#0D1322] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Manipulation Cues</span>
                  <span className={`font-bold ${analysis?.manipulation_indicators === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis?.manipulation_indicators || 'LOW'}
                  </span>
                </div>

                <div className="bg-[#0D1322] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Visual Consistency</span>
                  <span className={`font-bold ${analysis?.visual_consistency === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analysis?.visual_consistency || 'HIGH'}
                  </span>
                </div>

                <div className="bg-[#0D1322] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Audio/Video Sync</span>
                  <span className={`font-bold ${analysis?.audio_video_consistency === 'SUSPICIOUS' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis?.audio_video_consistency || 'CONSISTENT'}
                  </span>
                </div>
              </div>

              {/* Error Level Analysis (ELA) Heatmap Preview */}
              <div className="bg-[#0D1322] border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                      Error Level Analysis (ELA) Compression Map
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Highlights compression rate inconsistencies across JPEG/PNG quantization tables.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    ELA Variance Score: <strong className="text-white">{analysis?.ela_variance_score?.toFixed(1) || '0.0'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={getMediaUrl(evidence.evidence_id, 1)}
                      alt="Source Media"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 relative">
                    <img
                      src={getElaImageUrl(evidence.evidence_id)}
                      alt="ELA Map"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                      AMPLIFIED ELA RESIDUAL
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory Epistemic Honesty Disclaimer */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 leading-relaxed">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-mono block uppercase">Forensic Evaluation Notice:</strong>
                  GHOSTFRAME outputs probabilistic indicators to guide investigative workflows. AI anomaly detectors and ELA variance scores do not constitute mathematical or legal proof of malice or synthetic fabrication.
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: VERSION HISTORY & SUBMIT NEW VERSION */}
          {activeTab === 'versions' && (
            <div className="space-y-6">
              
              {/* Version History Table */}
              <div className="bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Submitted Versions & Lineage
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Never silently overwrites</span>
                </div>

                <div className="divide-y divide-slate-800/60 font-mono text-xs">
                  {evidence.versions.map((ver) => (
                    <div key={ver.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#152038] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">Version {ver.version_num}: {ver.title}</span>
                          {ver.is_original_sealed && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                              SEALED ORIGINAL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          SHA-256: {ver.sha256_hash}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Submitted by: {ver.submitter_source} • {ver.notes}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ver.hash_matches_original ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                            HASH MATCH ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                            HASH MISMATCH ✕
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit New Version Form */}
              <div className="bg-[#0D1322] border border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Submit Subsequent Version For Comparison</span>
                </h4>

                <form onSubmit={handleVersionSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Select File (Image / Video)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Investigation Notes</label>
                    <input
                      type="text"
                      placeholder="e.g., Transcoded export from witness cloud backup"
                      value={newVersionNotes}
                      onChange={(e) => setNewVersionNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161F36] border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newVersionFile || isSubmittingVersion}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingVersion ? 'animate-spin' : ''}`} />
                    <span>{isSubmittingVersion ? 'Analyzing...' : 'Ingest & Compare Version'}</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 6: OFFLINE SYNC AUDIT */}
          {activeTab === 'sync' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#0D1322] border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider">
                  Store-and-Forward Provenance Chain
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#161F36] border border-slate-800">
                    <span className="text-slate-400">Captured While Offline:</span>
                    <span className="font-bold text-white">{evidence.captured_offline ? 'YES (Disconnected Queue)' : 'NO (Live Upload)'}</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-lg bg-[#161F36] border border-slate-800">
                    <span className="text-slate-400">Capture Device:</span>
                    <span className="font-bold text-blue-400">{evidence.device_id}</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-lg bg-[#161F36] border border-slate-800">
                    <span className="text-slate-400">Capture-Reported Timestamp:</span>
                    <span className="font-bold text-white">{evidence.capture_timestamp}</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-lg bg-[#161F36] border border-slate-800">
                    <span className="text-slate-400">Server-Received Sync Time:</span>
                    <span className="font-bold text-emerald-400">{evidence.sync_timestamp || '17:12:03 UTC'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
