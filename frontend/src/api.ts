import { EvidenceItem, EvidenceDetail, IncidentSummary, IncidentTimelineEvent } from './types';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? `http://${window.location.hostname}:8080/api`
  : '/api';

export async function fetchEvidenceList(params?: {
  incident_id?: string;
  search?: string;
  status?: string;
}): Promise<EvidenceItem[]> {
  const query = new URLSearchParams();
  if (params?.incident_id) query.set('incident_id', params.incident_id);
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/evidence?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch evidence list');
  return res.json();
}

export async function fetchEvidenceDetail(evidenceId: string): Promise<EvidenceDetail> {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}`);
  if (!res.ok) throw new Error(`Failed to fetch evidence ${evidenceId}`);
  return res.json();
}

export async function captureAndSealEvidence(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/evidence`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Capture failed' }));
    throw new Error(err.detail || 'Capture failed');
  }
  return res.json();
}

export async function submitEvidenceVersion(evidenceId: string, formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/versions`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to submit new version');
  return res.json();
}

export async function uploadInvestigationMedia(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/upload/investigation`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Investigation upload failed');
  return res.json();
}

export async function compareDirectImages(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/upload/compare-direct`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Comparison failed' }));
    throw new Error(err.detail || 'Comparison failed');
  }
  return res.json();
}

export async function analyzeAiImage(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/ai-detector/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI Detection failed' }));
    throw new Error(err.detail || 'AI Detection failed');
  }
  return res.json();
}

export async function fetchIncidents(): Promise<IncidentSummary[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentTimeline(incidentId: string): Promise<{
  incident_id: string;
  title: string;
  description: string;
  location: string;
  total_devices: number;
  timeline: IncidentTimelineEvent[];
}> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch incident timeline');
  return res.json();
}

export async function syncOfflineBatch(payload: { device_id: string; items: any[] }): Promise<any> {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

export async function fetchSyncStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/sync/status`);
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}

export async function triggerSeedIncident004(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/seed-incident-004`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo incident');
  return res.json();
}

export async function resetAllEvidence(reseedDemo: boolean = true): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset-all?reseed_demo=${reseedDemo}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset evidence repository');
  return res.json();
}

export function getPdfReportUrl(evidenceId: string): string {
  return `${API_BASE}/reports/${evidenceId}/pdf`;
}

export function getElaImageUrl(evidenceId: string): string {
  return `${API_BASE}/evidence/${evidenceId}/ela`;
}

export function getMediaUrl(evidenceId: string, version: number = 1): string {
  return `${API_BASE}/evidence/${evidenceId}/media?version=${version}`;
}
