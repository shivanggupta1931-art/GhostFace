import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CaptureApp } from './components/CaptureApp';
import { AdminDashboard } from './components/AdminDashboard';
import { EvidenceDetailModal } from './components/EvidenceDetailModal';
import { ImageComparator } from './components/ImageComparator';
import { AiDetector } from './components/AiDetector';
import { UserRole, EvidenceItem, EvidenceDetail } from './types';
import { fetchEvidenceList, fetchEvidenceDetail, resetAllEvidence } from './api';
import { clearEvidenceFromIndexedDB } from './storage';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CAPTURE_USER');
  const [activeTab, setActiveTab] = useState<'capture' | 'comparator' | 'dashboard' | 'ai-detector'>('capture');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEvidenceDetail, setSelectedEvidenceDetail] = useState<EvidenceDetail | null>(null);
  const [comparatorSelectedId, setComparatorSelectedId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetToast, setResetToast] = useState<string | null>(null);

  // Load evidence repository
  const loadEvidence = async () => {
    setIsLoading(true);
    try {
      const items = await fetchEvidenceList();
      setEvidenceList(items);
    } catch (err) {
      console.error('Failed to load evidence list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, []);

  // Open deep inspection modal
  const handleSelectEvidence = async (evidenceId: string) => {
    try {
      const detail = await fetchEvidenceDetail(evidenceId);
      setSelectedEvidenceDetail(detail);
    } catch (err: any) {
      alert(`Could not load evidence detail: ${err.message}`);
    }
  };

  // Reset all captured photos and start fresh from the start
  const handleResetAll = async (reseedDemo: boolean = true) => {
    setIsResetting(true);
    setSelectedEvidenceDetail(null);
    try {
      // Clear client local storage and IndexedDB queues
      await clearEvidenceFromIndexedDB();
      try {
        localStorage.removeItem('ghostframe_local_queue');
        localStorage.removeItem('ghostframe_offline_queue');
      } catch (e) {}
      const res = await resetAllEvidence(reseedDemo);
      await loadEvidence();
      setResetToast(res.message || '✓ All photos deleted. Repository reset from start.');
      setTimeout(() => setResetToast(null), 4000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative">
      
      {/* Reset Toast Notification */}
      {resetToast && (
        <div className="fixed top-18 right-6 z-50 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-2.5 animate-fadeIn backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{resetToast}</span>
        </div>
      )}

      {/* Top Universal App Navigation */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        onResetAll={handleResetAll}
        isResetting={isResetting}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'capture' && (
          <CaptureApp
            isOnline={isOnline}
            onViewEvidenceDetail={(id) => {
              setCurrentRole('ADMIN');
              setActiveTab('dashboard');
              handleSelectEvidence(id);
            }}
            onCompareEvidence={(id) => {
              setCurrentRole('ADMIN');
              setComparatorSelectedId(id);
              setActiveTab('comparator');
            }}
          />
        )}

        {activeTab === 'comparator' && (
          <ImageComparator
            evidenceList={evidenceList}
            initialSelectedId={comparatorSelectedId}
            onSelectEvidence={handleSelectEvidence}
          />
        )}

        {activeTab === 'ai-detector' && (
          <AiDetector />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            evidenceList={evidenceList}
            isLoading={isLoading}
            onSelectEvidence={handleSelectEvidence}
            onOpenInvestigation={() => {
              setComparatorSelectedId(null);
              setActiveTab('comparator');
            }}
            onCompareEvidence={(id) => {
              setComparatorSelectedId(id);
              setActiveTab('comparator');
            }}
            onOpenIncidentTimeline={() => {
              setComparatorSelectedId(null);
              setActiveTab('comparator');
            }}
            onRefresh={loadEvidence}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* Deep Forensic Inspection Modal */}
      {selectedEvidenceDetail && (
        <EvidenceDetailModal
          evidence={selectedEvidenceDetail}
          onClose={() => setSelectedEvidenceDetail(null)}
          onRefresh={async () => {
            await loadEvidence();
            if (selectedEvidenceDetail) {
              const refreshed = await fetchEvidenceDetail(selectedEvidenceDetail.evidence_id);
              setSelectedEvidenceDetail(refreshed);
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05080E] py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GHOSTFRAME Platform • Cryptographic Provenance & Forensic Integrity</span>
          <span className="text-slate-400">Ed25519 Signing • LSB Steganography • Two-Way Comparator</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
