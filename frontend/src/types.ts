export type UserRole = 'CAPTURE_USER' | 'ADMIN';

export interface ProvenanceRecord {
  evidence_id: string;
  original_hash: string;
  capture_timestamp: string;
  signature_hex: string;
  signature_valid: boolean;
  provenance_version: number;
  stego_token_embedded: boolean;
  provenance_status: 'VALID' | 'INVALID';
  public_key_pem?: string;
}

export interface EvidenceVersion {
  id: number;
  version_num: number;
  title: string;
  sha256_hash: string;
  is_original_sealed: boolean;
  hash_matches_original: boolean;
  submitter_source: string;
  created_at: string;
  notes?: string;
}

export interface TimelineSegment {
  start: number;
  end: number;
  status: 'MATCH' | 'UNCERTAIN' | 'DIFF_ANOMALY' | 'NEW_CONTENT';
  label: string;
  similarity_pct: number;
  diff_score: number;
  details: string;
}

export interface ForensicAnalysis {
  tampering_risk_score: number;
  tampering_risk_label: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  tampering_risk_category: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  tampering_risk_color?: string;
  synthetic_media_indicators: 'LOW' | 'MEDIUM' | 'HIGH';
  manipulation_indicators: 'LOW' | 'MEDIUM' | 'HIGH';
  visual_consistency: 'LOW' | 'MEDIUM' | 'HIGH';
  audio_video_consistency: 'CONSISTENT' | 'SUSPICIOUS';
  ela_variance_score?: number;
  noise_analysis?: {
    noise_anomaly_level: string;
    noise_inconsistency_ratio: number;
    quadrant_variances?: number[];
  };
  disclaimer: string;
}

export interface MediaComparison {
  content_match_pct: number;
  changed_content_pct: number;
  new_unmatched_pct: number;
  ssim: number;
  mse: number;
  hist_correlation?: number;
  dimension_match?: boolean;
  timeline_segments?: TimelineSegment[];
  changed_regions_count?: number;
  changed_regions?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    rel_x: number;
    rel_y: number;
    rel_w: number;
    rel_h: number;
  }>;
}

export interface EvidenceItem {
  id: number;
  evidence_id: string;
  incident_id?: string;
  device_id: string;
  media_type: string;
  status: 'SEALED' | 'FLAGGED' | 'UNDER_REVIEW' | 'PENDING_SYNC';
  captured_offline: boolean;
  capture_timestamp: string;
  sync_timestamp?: string;
  original_hash?: string;
  tampering_risk_score: number;
  tampering_risk_label: string;
  tampering_risk_category: string;
  content_match_pct: number;
  versions_count: number;
  signature_valid: boolean;
  provenance_status: 'VALID' | 'INVALID';
}

export interface EvidenceDetail extends EvidenceItem {
  capture_session_id?: string;
  created_at: string;
  provenance?: ProvenanceRecord;
  versions: EvidenceVersion[];
  analysis?: ForensicAnalysis;
  comparison?: MediaComparison;
}

export interface IncidentSummary {
  incident_id: string;
  title: string;
  description?: string;
  location?: string;
  created_at: string;
  evidence_count: number;
  verified_count: number;
  flagged_count: number;
}

export interface IncidentTimelineEvent {
  evidence_id: string;
  device_id: string;
  media_type: string;
  status: string;
  capture_timestamp_reported: string;
  server_received_timestamp: string;
  captured_offline: boolean;
  tampering_risk_score: number;
  tampering_risk_label: string;
  timeline_status: string;
  sha256_prefix: string;
  content_match_pct: number;
  notes: string;
}

export interface OfflineLocalCapture {
  local_id: string;
  evidence_id: string;
  timestamp: string;
  media_type: string;
  data_url: string;
  sha256: string;
  status: 'SEALED_LOCAL';
  device_id: string;
}
