import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

def create_pdf_report(report_json_str, output_filename):
    """
    Parses the JSON response from Gemini and generates a structured PDF report.
    """
    try:
        # Gemini sometimes wraps JSON in markdown blocks
        clean_json = report_json_str.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_json)
    except Exception as e:
        print(f"Failed to parse JSON: {e}")
        # Fallback to saving raw text directly into a PDF
        doc = SimpleDocTemplate(output_filename, pagesize=letter)
        styles = getSampleStyleSheet()
        fallback_elements = [Paragraph("AI Raw Compliance Audit Report", styles['Title']), Spacer(1, 12)]
        for line in report_json_str.split('\n'):
            fallback_elements.append(Paragraph(line.replace('<', '&lt;').replace('>', '&gt;'), styles['Normal']))
            fallback_elements.append(Spacer(1, 4))
        doc.build(fallback_elements)
        return output_filename

    doc = SimpleDocTemplate(output_filename, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("AI Compliance Audit Report", styles['Title']))
    elements.append(Spacer(1, 12))

    # Overall Score
    score = data.get('overall_score', 'N/A')
    elements.append(Paragraph(f"Overall Compliance Score: {score}/100", styles['Heading2']))
    elements.append(Spacer(1, 12))

    # Summary
    elements.append(Paragraph("Executive Summary", styles['Heading3']))
    elements.append(Paragraph(data.get('summary', 'No summary available.'), styles['Normal']))
    elements.append(Spacer(1, 12))

    # Parties
    elements.append(Paragraph("Involved Parties", styles['Heading3']))
    party_data = [["Role", "Name", "Type"]]
    for party in data.get('parties', []):
        party_data.append([
            party.get('role', ''),
            party.get('name', ''),
            party.get('type', '')
        ])
    
    if len(party_data) > 1:
        t = Table(party_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t)
    elements.append(Spacer(1, 12))

    # Clauses
    elements.append(Paragraph("Clause Breakdown", styles['Heading3']))
    for clause in data.get('clauses', []):
        elements.append(Paragraph(f"<b>{clause.get('title', 'Untitled')}</b>", styles['Normal']))
        elements.append(Paragraph(f"Risk: {clause.get('risk', '')} | Status: {clause.get('status', '')}", styles['Normal']))
        if clause.get('quote'):
            elements.append(Paragraph(f"<i>Quote extracted from contract: \"{clause.get('quote')}\"</i>", styles['Normal']))
        elements.append(Paragraph(f"Explanation: {clause.get('explanation', '')}", styles['Normal']))
        elements.append(Spacer(1, 6))

    doc.build(elements)
    return output_filename
