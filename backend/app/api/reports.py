"""
API Router - Report Generation
Generates comprehensive PDF and JSON reports from evaluation data.
"""
import io
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.project import Project
from app.models.user import User, UserRole
from app.utils.dependencies import get_current_user

router = APIRouter()


def _get_grade(score: Optional[float]) -> str:
    if score is None:
        return "N/A"
    if score >= 90:
        return "A+"
    elif score >= 85:
        return "A"
    elif score >= 80:
        return "B+"
    elif score >= 75:
        return "B"
    elif score >= 70:
        return "C+"
    elif score >= 65:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


def _get_risk_level(score: Optional[float], invert: bool = False) -> str:
    """invert=True means higher score = higher risk (e.g. AI detection)."""
    if score is None:
        return "Unknown"
    effective = (100 - score) if invert else score
    if effective >= 80:
        return "Low Risk"
    elif effective >= 60:
        return "Moderate Risk"
    else:
        return "High Risk"


async def _fetch_project_with_evaluation(
    project_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
):
    """Shared helper to load a project and verify report access permissions."""
    stmt = (
        select(Project)
        .options(
            selectinload(Project.evaluation),
            selectinload(Project.owner),
            selectinload(Project.faculty),
        )
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization
    if current_user.role == UserRole.STUDENT and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")

    if current_user.role == UserRole.PROFESSOR and project.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")

    # Must have a completed evaluation
    if not project.evaluation or project.evaluation.status != EvaluationStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Report is only available after AI Analysis is completed",
        )

    return project


def _build_report_data(project: Project) -> dict:
    """Compile all evaluation data into a unified report dictionary."""
    ev = project.evaluation
    team_members = []
    if project.team_members:
        try:
            raw = project.team_members if isinstance(project.team_members, list) else json.loads(project.team_members)
            team_members = raw
        except Exception:
            team_members = []

    faculty_name = project.faculty.full_name if project.faculty else "Unassigned"
    student_name = project.owner.full_name if project.owner else "Unknown"

    total = ev.total_score
    code_q = ev.code_quality_score
    doc_s = ev.documentation_score
    plag_s = ev.plagiarism_score
    align_s = ev.report_alignment_score
    ai_s = ev.ai_code_score

    # Parse JSON detail fields
    code_analysis = ev.code_analysis_result or {}
    doc_eval = ev.doc_evaluation_result or {}
    plagiarism = ev.plagiarism_result or {}
    alignment = ev.alignment_result or {}
    ai_detection = ev.ai_detection_result or {}

    return {
        "meta": {
            "project_id": str(project.id),
            "evaluation_id": str(ev.id),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "report_version": "1.0",
        },
        "project": {
            "title": project.title,
            "description": project.description or "",
            "course_name": project.course_name or "",
            "batch_year": project.batch_year or "",
            "status": project.status.value,
            "submitted_at": project.submitted_at.isoformat() if project.submitted_at else None,
            "created_at": project.created_at.isoformat(),
        },
        "team": {
            "team_name": project.team_name or "Individual Project",
            "student_name": student_name,
            "faculty_name": faculty_name,
            "members": team_members,
        },
        "scores": {
            "total": total,
            "grade": _get_grade(total),
            "code_quality": code_q,
            "documentation": doc_s,
            "plagiarism_originality": plag_s,
            "report_alignment": align_s,
            "ai_code_score": ai_s,
        },
        "flags": {
            "ai_code_detected": ev.ai_code_detected,
            "plagiarism_detected": ev.plagiarism_detected,
        },
        "ai_code_detector": {
            "score": ai_s,
            "detected": ev.ai_code_detected,
            "risk_level": _get_risk_level(ai_s, invert=True),
            "details": ai_detection,
            "summary": (
                "AI-generated code patterns detected. Manual review recommended."
                if ev.ai_code_detected
                else "Code appears to be predominantly human-authored."
            ),
        },
        "code_analysis": {
            "score": code_q,
            "grade": _get_grade(code_q),
            "details": code_analysis,
            "summary": f"Code quality assessed at {round(code_q or 0, 1)}/100.",
        },
        "doc_evaluator": {
            "score": doc_s,
            "grade": _get_grade(doc_s),
            "details": doc_eval,
            "summary": f"Documentation completeness rated at {round(doc_s or 0, 1)}/100.",
        },
        "plagiarism_detector": {
            "originality_score": plag_s,
            "detected": ev.plagiarism_detected,
            "risk_level": _get_risk_level(plag_s),
            "details": plagiarism,
            "summary": (
                "Potential plagiarism detected. Similar content found in reference corpus."
                if ev.plagiarism_detected
                else "Submission is substantially original."
            ),
        },
        "report_aligner": {
            "score": align_s,
            "grade": _get_grade(align_s),
            "details": alignment,
            "summary": f"Project report aligns with requirements at {round(align_s or 0, 1)}/100.",
        },
        "comprehensive_scorer": {
            "total_score": total,
            "grade": _get_grade(total),
            "breakdown": {
                "Code Quality (35%)": round((code_q or 0) * 0.35, 1),
                "Documentation (25%)": round((doc_s or 0) * 0.25, 1),
                "Originality (15%)": round((plag_s or 0) * 0.15, 1),
                "Report Alignment (15%)": round((align_s or 0) * 0.15, 1),
                "AI Code Check (10%)": round((ai_s or 0) * 0.10, 1),
            },
            "completed_at": ev.completed_at.isoformat() if ev.completed_at else None,
        },
        "feedback_generator": {
            "ai_feedback": ev.ai_feedback or "No AI feedback generated.",
            "professor_feedback": ev.professor_feedback or None,
            "professor_score_override": ev.professor_score_override,
            "is_finalized": ev.is_finalized,
            "finalized_at": ev.finalized_at.isoformat() if ev.finalized_at else None,
        },
    }


@router.get("/{project_id}/report")
async def get_project_report_data(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive report data as JSON.
    Only accessible when evaluation is completed.
    """
    project = await _fetch_project_with_evaluation(project_id, current_user, db)
    return _build_report_data(project)


@router.get("/{project_id}/report/pdf")
async def download_project_report_pdf(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate and stream a comprehensive PDF report.
    Only accessible when evaluation is completed.
    """
    project = await _fetch_project_with_evaluation(project_id, current_user, db)
    data = _build_report_data(project)

    # Generate PDF in memory
    pdf_buffer = _generate_pdf(data)

    # Sanitize filename
    safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in data["project"]["title"])
    safe_title = safe_title.replace(" ", "_")[:40]
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    filename = f"{safe_title}_AI_Report_{date_str}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_buffer)),
        },
    )


def _generate_pdf(data: dict) -> bytes:
    """Generate PDF bytes from report data using ReportLab."""
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        HRFlowable,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"ASPES Report - {data['project']['title']}",
    )

    # ── Color Palette ──────────────────────────────────────────────
    INDIGO = colors.HexColor("#4F46E5")
    INDIGO_DARK = colors.HexColor("#3730A3")
    INDIGO_LIGHT = colors.HexColor("#EEF2FF")
    SLATE = colors.HexColor("#1E293B")
    SLATE_MED = colors.HexColor("#475569")
    SLATE_LIGHT = colors.HexColor("#F8FAFC")
    EMERALD = colors.HexColor("#059669")
    AMBER = colors.HexColor("#D97706")
    RED = colors.HexColor("#DC2626")
    BORDER = colors.HexColor("#E2E8F0")
    WHITE = colors.white

    styles = getSampleStyleSheet()

    def style(name, **kwargs):
        return ParagraphStyle(name, **kwargs)

    H1 = style("H1", fontSize=22, fontName="Helvetica-Bold", textColor=WHITE, leading=28, spaceAfter=4)
    H2 = style("H2", fontSize=13, fontName="Helvetica-Bold", textColor=INDIGO, leading=18, spaceBefore=16, spaceAfter=6)
    H3 = style("H3", fontSize=10, fontName="Helvetica-Bold", textColor=SLATE, leading=14, spaceBefore=8, spaceAfter=4)
    BODY = style("Body", fontSize=9, fontName="Helvetica", textColor=SLATE_MED, leading=13, spaceAfter=4)
    LABEL = style("Label", fontSize=7.5, fontName="Helvetica-Bold", textColor=SLATE_MED, leading=10)
    VALUE = style("Value", fontSize=9.5, fontName="Helvetica-Bold", textColor=SLATE, leading=13)
    CENTER = style("Center", fontSize=9, fontName="Helvetica", textColor=SLATE_MED, leading=12, alignment=TA_CENTER)
    SCORE_BIG = style("ScoreBig", fontSize=28, fontName="Helvetica-Bold", textColor=INDIGO, leading=32, alignment=TA_CENTER)
    GRADE_BIG = style("GradeBig", fontSize=14, fontName="Helvetica-Bold", textColor=SLATE_MED, alignment=TA_CENTER)
    CAPTION = style("Caption", fontSize=7, fontName="Helvetica", textColor=SLATE_MED, alignment=TA_CENTER, leading=9)
    FLAG_RED = style("FlagRed", fontSize=9, fontName="Helvetica-Bold", textColor=RED, leading=12)
    FLAG_GREEN = style("FlagGreen", fontSize=9, fontName="Helvetica-Bold", textColor=EMERALD, leading=12)

    W = A4[0] - 3.6 * cm  # usable width

    story = []

    # ─────────────────────────────────────────────────────────────
    # HEADER BANNER
    # ─────────────────────────────────────────────────────────────
    header_data = [
        [
            Paragraph("ASPES", style("ASPES", fontSize=10, fontName="Helvetica-Bold", textColor=colors.HexColor("#A5B4FC"), leading=12)),
            "",
        ],
        [
            Paragraph(data["project"]["title"], H1),
            "",
        ],
        [
            Paragraph(
                f"AI Analysis Report &nbsp;·&nbsp; Generated {data['meta']['generated_at'][:10]}",
                style("Sub", fontSize=8.5, fontName="Helvetica", textColor=colors.HexColor("#C7D2FE"), leading=11),
            ),
            Paragraph(
                f"Grade: <b>{data['scores']['grade']}</b>",
                style("Grade", fontSize=10, fontName="Helvetica-Bold", textColor=WHITE, leading=13, alignment=TA_RIGHT),
            ),
        ],
    ]
    header_table = Table(header_data, colWidths=[W * 0.72, W * 0.28])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INDIGO_DARK),
        ("ROUNDEDCORNERS", [8]),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("SPAN", (0, 1), (1, 1)),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 14))

    # ─────────────────────────────────────────────────────────────
    # PROJECT META INFO
    # ─────────────────────────────────────────────────────────────
    def info_row(label, value):
        return [Paragraph(label, LABEL), Paragraph(str(value) if value else "—", VALUE)]

    team = data["team"]
    proj = data["project"]

    meta_rows = [
        info_row("PROJECT TITLE", proj["title"]),
        info_row("COURSE / SUBJECT", proj["course_name"] or "—"),
        info_row("BATCH YEAR", proj["batch_year"] or "—"),
        info_row("ASSIGNED FACULTY", team["faculty_name"]),
        info_row("STUDENT / OWNER", team["student_name"]),
        info_row("TEAM NAME", team["team_name"]),
        info_row("SUBMISSION DATE", proj["submitted_at"][:10] if proj["submitted_at"] else "—"),
        info_row("STATUS", proj["status"].replace("_", " ").upper()),
    ]

    # Team members
    if team["members"]:
        members_str = ", ".join(
            f"{m.get('name', '')} ({m.get('enrollment', '')})" for m in team["members"]
        )
        meta_rows.append(info_row("TEAM MEMBERS", members_str))

    meta_table = Table(meta_rows, colWidths=[W * 0.3, W * 0.7])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SLATE_LIGHT),
        ("BACKGROUND", (0, 0), (0, -1), INDIGO_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [SLATE_LIGHT, WHITE]),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 18))

    # ─────────────────────────────────────────────────────────────
    # SCORE OVERVIEW CARDS
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("Overall Score Summary", H2))
    story.append(HRFlowable(width=W, thickness=1, color=BORDER, spaceAfter=10))

    scores = data["scores"]

    def score_card(label, score, grade=None, color=INDIGO):
        s = round(score, 1) if score is not None else 0
        g = grade or _get_grade(score)
        return [
            Paragraph(label, CAPTION),
            Paragraph(f"{s}", style("SC", fontSize=20, fontName="Helvetica-Bold", textColor=color, leading=24, alignment=TA_CENTER)),
            Paragraph(f"/ 100 &nbsp; {g}", CAPTION),
        ]

    def score_color(score):
        if score is None:
            return SLATE_MED
        if score >= 75:
            return EMERALD
        if score >= 60:
            return AMBER
        return RED

    cards = [
        score_card("TOTAL SCORE", scores["total"], scores["grade"], score_color(scores["total"])),
        score_card("CODE QUALITY", scores["code_quality"], color=score_color(scores["code_quality"])),
        score_card("DOCUMENTATION", scores["documentation"], color=score_color(scores["documentation"])),
        score_card("ORIGINALITY", scores["plagiarism_originality"], color=score_color(scores["plagiarism_originality"])),
        score_card("REPORT ALIGN", scores["report_alignment"], color=score_color(scores["report_alignment"])),
    ]

    card_table = Table([cards], colWidths=[W / 5] * 5, rowHeights=[60])
    card_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (0, -1), INDIGO_LIGHT),
    ]))
    story.append(card_table)
    story.append(Spacer(1, 6))

    # Score breakdown bar chart (table-based)
    breakdown = data["comprehensive_scorer"]["breakdown"]
    bar_rows = [
        [Paragraph("Category", LABEL), Paragraph("Score Contribution", LABEL), Paragraph("Points", LABEL)]
    ]
    for cat, pts in breakdown.items():
        bar_w = max(1, int((pts / 35) * (W * 0.55)))  # normalize to widest bar
        bar_cell = Table(
            [[Paragraph("", BODY)]],
            colWidths=[bar_w],
            rowHeights=[10],
        )
        bar_color = score_color(pts * 3)  # rough mapping
        bar_cell.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), bar_color), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        bar_rows.append([
            Paragraph(cat, BODY),
            bar_cell,
            Paragraph(f"{pts}", style("Pts", fontSize=9, fontName="Helvetica-Bold", textColor=SLATE, leading=11, alignment=TA_RIGHT)),
        ])

    bar_table = Table(bar_rows, colWidths=[W * 0.38, W * 0.5, W * 0.12])
    bar_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SLATE_LIGHT, WHITE]),
    ]))
    story.append(Spacer(1, 10))
    story.append(bar_table)
    story.append(Spacer(1, 18))

    # ─────────────────────────────────────────────────────────────
    # FLAGS
    # ─────────────────────────────────────────────────────────────
    flags = data["flags"]
    flag_rows = [[
        Paragraph(
            "⚠ AI-Generated Code Detected" if flags["ai_code_detected"] else "✓ No AI Code Detected",
            FLAG_RED if flags["ai_code_detected"] else FLAG_GREEN,
        ),
        Paragraph(
            "⚠ Plagiarism Detected" if flags["plagiarism_detected"] else "✓ No Plagiarism Detected",
            FLAG_RED if flags["plagiarism_detected"] else FLAG_GREEN,
        ),
    ]]
    flag_table = Table(flag_rows, colWidths=[W / 2, W / 2])
    flag_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2") if (flags["ai_code_detected"] or flags["plagiarism_detected"]) else colors.HexColor("#F0FDF4")),
        ("BOX", (0, 0), (-1, -1), 0.5, RED if (flags["ai_code_detected"] or flags["plagiarism_detected"]) else EMERALD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(flag_table)
    story.append(Spacer(1, 18))

    # ─────────────────────────────────────────────────────────────
    # DETAILED SECTION HELPER
    # ─────────────────────────────────────────────────────────────
    def section(title, score, grade, summary, details: dict = None, risk_level=None):
        story.append(Paragraph(title, H2))
        story.append(HRFlowable(width=W, thickness=1, color=BORDER, spaceAfter=6))

        # Score + summary row
        score_str = f"{round(score, 1)}/100" if score is not None else "N/A"
        grade_str = grade or "N/A"
        risk_str = f" &nbsp;|&nbsp; Risk: {risk_level}" if risk_level else ""
        pills = [
            [
                Paragraph(f"Score: <b>{score_str}</b> &nbsp; Grade: <b>{grade_str}</b>{risk_str}", BODY),
            ]
        ]
        pill_t = Table(pills, colWidths=[W])
        pill_t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), INDIGO_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ]))
        story.append(pill_t)
        story.append(Spacer(1, 6))
        story.append(Paragraph(summary, BODY))

        if details:
            def fmt_val(v):
                if isinstance(v, bool):
                    return "Yes" if v else "No"
                if isinstance(v, (int, float)):
                    return str(round(v, 2))
                if isinstance(v, list):
                    return ", ".join(str(x) for x in v[:5])
                return str(v)[:200]

            flat = [(k, fmt_val(v)) for k, v in details.items() if not isinstance(v, dict) and not isinstance(v, list)]
            if flat:
                detail_rows = [[Paragraph(k, LABEL), Paragraph(v, BODY)] for k, v in flat[:10]]
                dt = Table(detail_rows, colWidths=[W * 0.35, W * 0.65])
                dt.setStyle(TableStyle([
                    ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                    ("BACKGROUND", (0, 0), (0, -1), SLATE_LIGHT),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, SLATE_LIGHT]),
                ]))
                story.append(Spacer(1, 4))
                story.append(dt)

        story.append(Spacer(1, 12))

    # ─────────────────────────────────────────────────────────────
    # EACH AI COMPONENT SECTION
    # ─────────────────────────────────────────────────────────────
    ai_det = data["ai_code_detector"]
    section(
        "1. AI Code Detector",
        ai_det["score"],
        None,
        ai_det["summary"],
        ai_det["details"],
        risk_level=ai_det["risk_level"],
    )

    ca = data["code_analysis"]
    section("2. Code Analysis", ca["score"], ca["grade"], ca["summary"], ca["details"])

    de = data["doc_evaluator"]
    section("3. Documentation Evaluator", de["score"], de["grade"], de["summary"], de["details"])

    pd_data = data["plagiarism_detector"]
    section(
        "4. Plagiarism Detector",
        pd_data["originality_score"],
        None,
        pd_data["summary"],
        pd_data["details"],
        risk_level=pd_data["risk_level"],
    )

    ra = data["report_aligner"]
    section("5. Report Aligner", ra["score"], ra["grade"], ra["summary"], ra["details"])

    # ─────────────────────────────────────────────────────────────
    # FEEDBACK SECTION
    # ─────────────────────────────────────────────────────────────
    fb = data["feedback_generator"]
    story.append(Paragraph("6. AI Feedback &amp; Recommendations", H2))
    story.append(HRFlowable(width=W, thickness=1, color=BORDER, spaceAfter=6))
    story.append(Paragraph(fb["ai_feedback"], BODY))

    if fb["professor_feedback"]:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Faculty Comments", H3))
        story.append(Paragraph(fb["professor_feedback"], BODY))
        if fb["professor_score_override"] is not None:
            story.append(Paragraph(f"Faculty Score Override: <b>{fb['professor_score_override']}/100</b>", BODY))

    story.append(Spacer(1, 18))

    # ─────────────────────────────────────────────────────────────
    # FOOTER
    # ─────────────────────────────────────────────────────────────
    footer_data = [[
        Paragraph(
            f"ASPES — AI Smart Academic Project Evaluation System &nbsp;|&nbsp; Report ID: {data['meta']['evaluation_id'][:8].upper()}",
            style("Foot", fontSize=7, fontName="Helvetica", textColor=SLATE_MED, leading=9),
        ),
        Paragraph(
            f"Generated: {data['meta']['generated_at'][:19].replace('T', ' ')} UTC",
            style("FootR", fontSize=7, fontName="Helvetica", textColor=SLATE_MED, leading=9, alignment=TA_RIGHT),
        ),
    ]]
    footer_table = Table(footer_data, colWidths=[W * 0.65, W * 0.35])
    footer_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INDIGO_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(footer_table)

    doc.build(story)
    return buffer.getvalue()
