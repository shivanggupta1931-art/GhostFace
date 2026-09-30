import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, AlertTriangle, ShieldAlert, Clock, Search, 
  Filter, FileText, ChevronRight, Zap, RefreshCw, Smartphone, ExternalLink,
  Trash2, RotateCcw
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { getPdfReportUrl } from '../api';

interface AdminDashboardProps {
  evidenceList: EvidenceItem[];
  isLoading: boolean;
  onSelectEvidence: (evidenceId: string) => void;
  onOpenInvestigation: () => void;
  onCompareEvidence?: (evidenceId: string) => void;
  onOpenIncidentTimeline: (incidentId: string) => void;
  onRefresh: () => void;
  onResetAll?: (reseed: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  evidenceList,
  isLoading,
  onSelectEvidence,
  onOpenInvestigation,
  onCompareEvidence,
  onOpenIncidentTimeline,
  onRefresh,
  onResetAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Metrics computation
  const totalCount = evidenceList.length;
  const verifiedCount = evidenceList.filter((e) => e.tampering_risk_score <= 15).length;
  const reviewCount = evidenceList.filter((e) => e.tampering_risk_score > 15 && e.tampering_risk_score <= 60).length;
  const highRiskCount = evidenceList.filter((e) => e.tampering_risk_score > 60).length;
  const offlinePendingCount = evidenceList.filter((e) => e.captured_offline && !e.sync_timestamp).length;

  // Filtered evidence list
  const filteredList = evidenceList.filter((item) => {
    const matchesSearch =
      item.evidence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.incident_id && item.incident_id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'VERIFIED') return item.tampering_risk_score <= 15;
    if (riskFilter === 'REVIEW') return item.tampering_risk_score > 15 && item.tampering_risk_score <= 60;
    if (riskFilter === 'HIGH_RISK') return item.tampering_risk_score > 60;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D1424] via-[#101B33] to-[#0A0F1D] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
              FORENSIC INVESTIGATION SYSTEM
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs font-mono text-slate-400">Cryptographic Integrity Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Evidence Repository & Multi-Modal Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Examine cryptographic provenance, perceptual content deltas, high-frequency noise variance, and multi-signal forensic indicators across submitted media assets.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 relative z-10 flex-wrap">
          <button
            onClick={() => onOpenIncidentTimeline('INC-004')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Incident #004 Timeline</span>
          </button>

          <button
            onClick={onOpenInvestigation}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/25"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Compare Two Images</span>
          </button>

          {onResetAll && (
            <button
              onClick={() => onResetAll(true)}
              title="Delete all captured photos and reset repository"
              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Refresh Evidence"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Forensic Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        
        {/* Total Evidence */}
        <div 
          onClick={() => setRiskFilter('ALL')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'ALL'
              ? 'bg-[#131E38] border-blue-500 shadow-lg shadow-blue-500/15'
              : 'bg-[#0D1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Evidence</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Sealed in repository</div>
        </div>

        {/* Cryptographically Verified */}
        <div 
          onClick={() => setRiskFilter('VERIFIED')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'VERIFIED'
              ? 'bg-[#0F281E] border-emerald-500 shadow-lg shadow-emerald-500/15'
              : 'bg-[#0D1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">100% Provenance Match</div>
        </div>

        {/* Needs Review */}
        <div 
          onClick={() => setRiskFilter('REVIEW')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'REVIEW'
              ? 'bg-[#2A200E] border-amber-500 shadow-lg shadow-amber-500/15'
              : 'bg-[#0D1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Needs Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{reviewCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-1 font-mono">Deltas / Re-encoded</div>
        </div>

        {/* High Risk */}
        <div 
          onClick={() => setRiskFilter('HIGH_RISK')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'HIGH_RISK'
              ? 'bg-[#2B1015] border-rose-500 shadow-lg shadow-rose-500/15'
              : 'bg-[#0D1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">High Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{highRiskCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-1 font-mono">Significant anomalies</div>
        </div>

        {/* Offline Pending */}
        <div className="rounded-2xl p-4 bg-[#0D1322] border border-slate-800 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Offline Syncs</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">{offlinePendingCount}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Mesh Store-Forward</div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0D1322] p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Device, Incident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#161F36] border border-slate-700 text-slate-200 text-xs font-mono rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 uppercase hidden md:inline">Filter:</span>
          {['ALL', 'VERIFIED', 'REVIEW', 'HIGH_RISK'].map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setRiskFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                riskFilter === filterKey
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#161F36] text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
            >
              {filterKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
            <span>Recent Evidence Records</span>
            <span className="text-xs text-slate-500 font-normal">({filteredList.length} items)</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Click any row for Deep Forensic Inspection</span>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-mono">No evidence records matching current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121A2D] text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Evidence ID</th>
                  <th className="px-4 py-3">Incident / Device</th>
                  <th className="px-4 py-3">Capture Time</th>
                  <th className="px-4 py-3">Provenance</th>
                  <th className="px-4 py-3">Content Match</th>
                  <th className="px-4 py-3">Tampering Risk</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => {
                  const isHigh = item.tampering_risk_score > 60;
                  const isMedium = item.tampering_risk_score > 15 && item.tampering_risk_score <= 60;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item.evidence_id)}
                      className="hover:bg-[#152038] cursor-pointer transition-colors group"
                    >
                      {/* Evidence ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400 group-hover:text-blue-300">
                            {item.evidence_id}
                          </span>
                          {item.media_type.includes('video') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                              VIDEO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {item.versions_count} version{item.versions_count > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Incident / Device */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200 font-medium">
                          {item.device_id}
                        </div>
                        {item.incident_id ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenIncidentTimeline(item.incident_id!);
                            }}
                            className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 mt-0.5"
                          >
                            {item.incident_id}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Unassigned</span>
                        )}
                      </td>

                      {/* Capture Time */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <div>{item.capture_timestamp.slice(11, 19)} UTC</div>
                        <div className="text-[10px] text-slate-500">{item.capture_timestamp.slice(0, 10)}</div>
                      </td>

                      {/* Provenance Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {item.tampering_risk_score <= 15 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              VALID ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3" />
                              MISMATCH ⚠
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          SHA: {item.original_hash ? item.original_hash.slice(0, 10) + '...' : 'N/A'}
                        </span>
                      </td>

                      {/* Content Match % */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${
                                item.content_match_pct >= 95
                                  ? 'bg-emerald-500'
                                  : item.content_match_pct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.content_match_pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200">{item.content_match_pct}%</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Perceptual SSIM</span>
                      </td>

                      {/* Tampering Risk Score Badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 ${
                            isHigh
                              ? 'bg-rose-950/80 border-rose-500/40 text-rose-400'
                              : isMedium
                              ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{item.tampering_risk_score} / 100</span>
                            <span className="opacity-80 text-[10px]">({item.tampering_risk_label})</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onCompareEvidence && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompareEvidence(item.evidence_id);
                              }}
                              title="Compare this image against another questioned file"
                              className="px-2 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <span>Compare</span>
                            </button>
                          )}

                          <a
                            href={getPdfReportUrl(item.evidence_id)}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF Report"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvidence(item.evidence_id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
