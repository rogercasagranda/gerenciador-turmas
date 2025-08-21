from __future__ import annotations

from datetime import datetime
from io import BytesIO
import os
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle


def generate_pdf(
    title: str,
    user: str,
    columns: list[str],
    rows: list[list[str]],
    orientation: str = "portrait",
    logo_path: str | None = None,
) -> bytes:
    """Generate a PDF table report.

    Args:
        title: Report title to display in the header.
        user: User emitting the report.
        columns: Column headers.
        rows: Table data.
        orientation: "portrait" or "landscape".
        logo_path: Optional path to a logo image.
    Returns:
        The binary content of the generated PDF.
    """

    buffer = BytesIO()
    pagesize = landscape(A4) if orientation == "landscape" else A4
    doc = SimpleDocTemplate(
        buffer,
        pagesize=pagesize,
        leftMargin=36,
        rightMargin=36,
        topMargin=72,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    # Build table data with paragraph cells to enable wrapping
    data = [columns] + [[Paragraph(str(cell), styles["Normal"]) for cell in row] for row in rows]
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ]
        )
    )

    elements = [table]

    def _header_footer(canvas, doc_obj):
        canvas.saveState()
        width, height = pagesize
        y = height - 40
        x_text = 40
        if logo_path and os.path.exists(logo_path):
            canvas.drawImage(logo_path, x_text, y - 15, height=30, preserveAspectRatio=True)
            x_text += 40
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawString(x_text, y, title)
        dt = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y %H:%M")
        canvas.setFont("Helvetica", 9)
        canvas.drawString(x_text, y - 12, f"Emitido em {dt} por {user}")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(width - 40, 20, f"Página {doc_obj.page}")
        canvas.restoreState()

    doc.build(elements, onFirstPage=_header_footer, onLaterPages=_header_footer)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
