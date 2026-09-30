import React, { useState } from 'react';
import { Shield, Smartphone, LayoutDashboard, Wifi, WifiOff, RefreshCw, Zap, FileSearch, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: 'capture' | 'comparator' | 'dashboard' | 'ai-detector';
  setActiveTab: (tab: 'capture' | 'comparator' | 'dashboard' | 'ai-detector') => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  onResetAll?: (reseed: boolean) => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  activeTab,
  setActiveTab,
  isOnline,
  setIsOnline,
  onResetAll,
  isResetting = false,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  return (
    <header className="border-b border-slate-800 bg-[#0A0F1D]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#0A0F1D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-lg bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-['JetBrains_Mono']">
                  GHOSTFRAME
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300">
                  v1.0 SEALED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Digital Evidence Integrity & Steganography Forensics</p>
            </div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center bg-[#131C31] p-1 rounded-xl border border-slate-800 shadow-inner max-w-full overflow-x-auto gap-1">
          <button
            onClick={() => {
              setCurrentRole('CAPTURE_USER');
              setActiveTab('capture');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'capture'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Capture</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('ADMIN');
              setActiveTab('comparator');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'comparator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Forensic Comparator</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('ADMIN');
              setActiveTab('ai-detector');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
              activeTab === 'ai-detector'
                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/40 font-bold'
                : 'border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>AI Detector</span>
            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-[9px] font-mono font-bold text-purple-200 uppercase">
              New
            </span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('ADMIN');
              setActiveTab('dashboard');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Evidence Repository</span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Start From Scratch / Reset All Button */}
          {onResetAll && (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              title="Delete all captured evidence, clear local queues, and start completely from the beginning"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-rose-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Purging...' : 'Start from Start'}</span>
            </button>
          )}

          {/* Network Simulator Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
              isOnline
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
            }`}
            title="Toggle simulated network connectivity (online / offline capture)"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>OFFLINE MODE</span>
              </>
            )}
          </button>

          {/* Role Badge Indicator */}
          <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            Role: <span className="font-bold text-blue-400">{currentRole}</span>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Reset All */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Delete All & Start Fresh?</h3>
                <p className="text-xs text-rose-300 font-mono">Purge captured media & restart</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              This action will permanently delete all captured photos, videos, offline queues, and investigation reports from storage and database.
            </p>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>✓ Clears device local storage and offline queues</div>
              <div>✓ Purges all user captures & sealed files from server</div>
              <div>✓ Resets repository to clean starting state</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-all border border-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetAll && onResetAll(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
