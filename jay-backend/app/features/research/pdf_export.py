"""Generate a downloadable PDF from a research report markdown."""
import io
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def markdown_to_pdf(markdown: str, product_name: str) -> bytes:
    """Convert markdown report to a styled PDF. Returns PDF bytes."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, mm
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    except ImportError:
        # Fallback: return raw markdown as text PDF
        return _simple_text_pdf(markdown, product_name)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=25 * mm, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='JayTitle', fontSize=22, leading=28,
        textColor=HexColor('#1a1a1a'), fontName='Helvetica-Bold',
        spaceAfter=12, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='JayH2', fontSize=14, leading=18,
        textColor=HexColor('#007AFF'), fontName='Helvetica-Bold',
        spaceBefore=18, spaceAfter=8, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='JayH3', fontSize=12, leading=15,
        textColor=HexColor('#333333'), fontName='Helvetica-Bold',
        spaceBefore=12, spaceAfter=6, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='JayBody', fontSize=10, leading=14,
        textColor=HexColor('#333333'), fontName='Helvetica',
        spaceAfter=6, alignment=TA_JUSTIFY,
    ))
    styles.add(ParagraphStyle(
        name='JayMeta', fontSize=8, leading=10,
        textColor=HexColor('#888888'), fontName='Helvetica',
        spaceAfter=4,
    ))

    elements = []

    # Title
    elements.append(Paragraph(f"JAY Research — {_escape(product_name)}", styles['JayTitle']))
    elements.append(Paragraph(
        f"Generated {datetime.now().strftime('%B %d, %Y')} | AI-Powered Product Intelligence",
        styles['JayMeta'],
    ))
    elements.append(Spacer(1, 12))

    # Parse markdown into elements
    lines = markdown.split('\n')
    i = 0
    in_code_block = False
    code_buffer = []

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                # End code block — render as monospace
                code_text = '\n'.join(code_buffer)
                if len(code_text) > 2000:
                    code_text = code_text[:2000] + "\n... [truncated for PDF]"
                elements.append(Paragraph(
                    f"<font face='Courier' size='7'>{_escape(code_text)}</font>",
                    styles['JayBody'],
                ))
                code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            elements.append(Spacer(1, 4))
            i += 1
            continue

        # Headers
        if stripped.startswith('# ') and not stripped.startswith('## '):
            elements.append(Paragraph(_escape(stripped[2:]), styles['JayTitle']))
            i += 1
            continue
        if stripped.startswith('## '):
            elements.append(Paragraph(_escape(stripped[3:]), styles['JayH2']))
            i += 1
            continue
        if stripped.startswith('### '):
            elements.append(Paragraph(_escape(stripped[4:]), styles['JayH3']))
            i += 1
            continue

        # Tables
        if '|' in stripped and stripped.startswith('|'):
            table_lines = []
            while i < len(lines) and '|' in lines[i] and lines[i].strip().startswith('|'):
                table_lines.append(lines[i])
                i += 1
            _add_table(elements, table_lines, styles)
            continue

        # Horizontal rules
        if stripped in ('---', '***', '___'):
            elements.append(Spacer(1, 8))
            i += 1
            continue

        # Bullet points
        if stripped.startswith('- ') or stripped.startswith('* ') or stripped.startswith('— '):
            bullet_text = stripped[2:]
            elements.append(Paragraph(f"• {_escape(bullet_text)}", styles['JayBody']))
            i += 1
            continue

        # Numbered lists
        if re.match(r'^\d+\.\s', stripped):
            elements.append(Paragraph(_escape(stripped), styles['JayBody']))
            i += 1
            continue

        # Regular paragraph
        elements.append(Paragraph(_md_to_html(stripped), styles['JayBody']))
        i += 1

    # Footer
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "This report is for informational purposes only and does not constitute "
        "medical or dermatological advice. Generated by JAY Research — AI Product Intelligence Engine.",
        styles['JayMeta'],
    ))

    doc.build(elements)
    return buf.getvalue()


def _escape(text: str) -> str:
    """Escape HTML entities for reportlab."""
    return (text
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('**', '')
        .replace('*', '')
        .replace('_', ' ')
    )


def _md_to_html(text: str) -> str:
    """Basic markdown bold/italic to HTML for reportlab."""
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    return text


def _add_table(elements, table_lines, styles):
    """Parse markdown table into reportlab Table."""
    rows = []
    for line in table_lines:
        cells = [c.strip() for c in line.split('|') if c.strip()]
        if cells and not all(c.replace('-', '').replace(':', '').strip() == '' for c in cells):
            rows.append(cells)

    if not rows:
        return

    # Normalize column count
    max_cols = max(len(r) for r in rows)
    for r in rows:
        while len(r) < max_cols:
            r.append('')

    # Convert to Paragraphs
    from reportlab.platypus import Table, TableStyle
    from reportlab.lib.colors import HexColor

    table_data = []
    for ri, row in enumerate(rows):
        table_data.append([
            Paragraph(_md_to_html(cell), styles['JayBody']) for cell in row
        ])

    if not table_data:
        return

    t = Table(table_data, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f0f0f5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#333333')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8))


def _simple_text_pdf(text: str, title: str) -> bytes:
    """Fallback: plain text PDF without reportlab styles."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen.canvas import Canvas
    except ImportError:
        # Last resort: return markdown as bytes
        return text.encode('utf-8')

    buf = io.BytesIO()
    c = Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, y, f"JAY Research — {title}")
    y -= 30
    c.setFont("Helvetica", 9)
    for line in text.split('\n'):
        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 9)
            y = height - 50
        c.drawString(40, y, line[:100])
        y -= 12
    c.save()
    return buf.getvalue()
