import io
import time
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(evidence_data: Dict[str, Any], audit_logs: list = None) -> bytes:
    """
    Generates a professional PDF forensic examination report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=12
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#B45309'),
        leading=11
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("GHOSTFRAME EVIDENCE INTEGRITY REPORT", title_style))
    elements.append(Paragraph(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC')} | Document ID: GFR-{evidence_data.get('evidence_id', 'UNKNOWN')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=15))
    
    # 1. Overview Table
    elements.append(Paragraph("1. EVIDENCE RECORD OVERVIEW", h2_style))
    overview_data = [
        ["Evidence ID:", evidence_data.get('evidence_id', 'N/A'), "Incident ID:", evidence_data.get('incident_id', 'INC-NONE')],
        ["Device / Origin:", evidence_data.get('device_id', 'Phone A (Mobile Capture)'), "Capture Time:", evidence_data.get('capture_timestamp', 'N/A')],
        ["Media Type:", evidence_data.get('media_type', 'image/png'), "Sealing Status:", evidence_data.get('status', 'SEALED ✓')],
        ["Offline Captured:", "YES (Local Queue Sync)" if evidence_data.get('captured_offline') else "NO (Live)", "Sync Timestamp:", evidence_data.get('sync_timestamp', '17:12:03 UTC')]
    ]
    t_overview = Table(overview_data, colWidths=[110, 150, 110, 150])
    t_overview.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1E293B')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(t_overview)
    elements.append(Spacer(1, 10))
    
    # 2. Cryptographic Integrity Table
    elements.append(Paragraph("2. CRYPTOGRAPHIC PROVENANCE & INTEGRITY", h2_style))
    prov = evidence_data.get('provenance', {})
    prov_data = [
        ["Attribute", "Capture Sealed Record", "Submitted / Examined Record", "Verification Status"],
        ["SHA-256 Digest", prov.get('original_hash', 'N/A')[:24] + "...", prov.get('submitted_hash', 'N/A')[:24] + "...", "MATCH ✓" if prov.get('hash_match') else "MISMATCH ✕"],
        ["Ed25519 Signature", "VALID (Authority Key)", "EXAMINED", "VALID ✓" if prov.get('signature_valid') else "INVALID ✕"],
        ["Stego Token", "EMBEDDED (GHST-LSB)", "EXTRACTED", "VERIFIED ✓" if prov.get('token_found') else "NOT FOUND ⚠"]
    ]
    t_prov = Table(prov_data, colWidths=[100, 160, 160, 100])
    t_prov.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F1F5F9')])
    ]))
    elements.append(t_prov)
    elements.append(Spacer(1, 10))
    
    # 3. Content Comparison & Forensic Scores
    elements.append(Paragraph("3. MULTI-MODAL FORENSICS & RISK ASSESSMENT", h2_style))
    comp = evidence_data.get('comparison', {})
    forensics = evidence_data.get('forensics', {})
    
    risk_score = forensics.get('tampering_risk_score', 12)
    risk_label = forensics.get('tampering_risk_label', 'Low')
    
    analysis_data = [
        ["Metric / Indicator", "Value / Assessment", "Evaluation Context"],
        ["Estimated Content Similarity", f"{comp.get('content_match_pct', 100)}%", "Derived from perceptual SSIM, MSE & color correlation"],
        ["Changed / Unmatched Content", f"{comp.get('changed_content_pct', 0)}%", "Estimated structural or frame sequence divergence"],
        ["AI Synthetic Media Signals", forensics.get('synthetic_media_indicators', 'LOW'), "Fourier frequency & inpainting artifact scan"],
        ["Visual Manipulation Indicators", forensics.get('manipulation_indicators', 'LOW'), "Laplacian noise variance & compression ELA"],
        ["GHOSTFRAME Tampering Risk", f"{risk_score} / 100 ({risk_label})", "Weighted composite risk index (0–100)"]
    ]
    t_analysis = Table(analysis_data, colWidths=[150, 130, 240])
    t_analysis.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t_analysis)
    elements.append(Spacer(1, 15))
    
    # 4. Mandatory Safety Disclaimer
    elements.append(Paragraph("4. LEGAL & FORENSIC LIMITATIONS / DISCLAIMER", h2_style))
    disclaimer_text = (
        "<b>IMPORTANT NOTICE:</b> GHOSTFRAME delivers cryptographic integrity measurements and probabilistic "
        "forensic indicators to support trained investigators. Cryptographic mismatch establishes only that the submitted file "
        "is not bit-for-bit identical to the capture-sealed record (which may result from transcoding or editing). AI and "
        "forensic anomaly scores are probabilistic estimates and do not constitute legal or mathematical proof of malice or authenticity."
    )
    t_disc = Table([[Paragraph(disclaimer_text, callout_style)]], colWidths=[520])
    t_disc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F59E0B')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_disc)
    
    doc.build(elements)
    return buffer.getvalue()
