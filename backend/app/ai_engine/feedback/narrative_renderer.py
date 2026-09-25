"""
feedback/narrative_renderer.py
==============================
Deterministic Markdown renderer for FeedbackResponse.

Design principles
-----------------
- Uses ONLY the structured data from FeedbackResponse.
- instructor_notes is EXPLICITLY EXCLUDED.  It must never appear in this
  student-facing output.
- Formatting is consistent across all provider outputs.
"""

from __future__ import annotations

import logging
from typing import Any

from .models import FeedbackResponse

logger = logging.getLogger(__name__)


def render_narrative(response: FeedbackResponse) -> str:
    """
    Render a FeedbackResponse object into a student-facing Markdown string.
    """
    sections: list[str] = []

    # --- 1. Executive Summary ---
    sections.append(f"# {response.executive_summary.one_line_verdict}")
    sections.append(f"**Overall Assessment**: {response.executive_summary.overall_assessment}")

    if response.meta.generated_by == "heuristic_fallback":
        sections.append(
            "> ⚠️ **Note**: This feedback was generated using automated heuristics "
            "because the AI feedback service was unavailable. The analysis is based "
            "on static code metrics rather than deep semantic review."
        )

    # --- 2. Scores Table ---
    sections.append("\n## Score Breakdown")
    sections.append("| Category | Score |")
    sections.append("|---|---|")
    sections.append(f"| Code Quality | {response.scores.code_quality}/100 |")
    sections.append(f"| Documentation | {response.scores.documentation_quality}/100 |")
    sections.append(f"| Report-Code Alignment | {response.scores.report_code_alignment}% |")
    sections.append(f"| **Overall Project Grade** | **{response.scores.overall}/100** |")

    # --- 3. Top Strengths & Areas for Improvement ---
    if response.strengths:
        sections.append("\n## Top Strengths")
        for s in response.strengths:
            sections.append(f"- {s}")

    if response.areas_for_improvement:
        sections.append("\n## Key Areas for Improvement")
        for a in response.areas_for_improvement:
            sections.append(f"- {a}")

    # --- 4. Code Quality Details ---
    sections.append("\n## Code Quality")
    sections.append(response.code_quality_feedback.summary)

    if response.code_quality_feedback.complexity_notes:
        sections.append(f"\n**Complexity**: {response.code_quality_feedback.complexity_notes}")
    if response.code_quality_feedback.security_notes:
        sections.append(f"**Security**: {response.code_quality_feedback.security_notes}")

    issues = response.code_quality_feedback.issues
    if issues:
        sections.append("\n### Specific Code Issues")
        for idx, issue in enumerate(issues, 1):
            sev_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🔵"}.get(
                issue.severity, "⚪"
            )
            line_ref = f"line {issue.line}" if issue.line > 0 else "general"
            sections.append(
                f"{idx}. {sev_icon} **{issue.severity}** in `{issue.file}` ({line_ref})"
            )
            sections.append(f"   - **Issue**: {issue.description}")
            sections.append(f"   - **Suggestion**: {issue.suggestion}")

    # --- 5. Documentation ---
    sections.append("\n## Documentation")
    sections.append(response.documentation_feedback.summary)
    if response.documentation_feedback.missing_sections:
        sections.append(
            "\n**Missing Sections**: "
            + ", ".join(response.documentation_feedback.missing_sections)
        )
    if response.documentation_feedback.suggestions:
        sections.append("\n**Suggestions for improvement**:")
        for s in response.documentation_feedback.suggestions:
            sections.append(f"- {s}")

    # --- 6. Report-Code Alignment ---
    sections.append("\n## Report-Code Alignment")
    sections.append(response.alignment_feedback.summary)

    mismatches = response.alignment_feedback.features_claimed_not_implemented
    if mismatches:
        sections.append("\n**Features claimed in report but not found in code:**")
        for m in mismatches:
            sections.append(f"- {m}")

    undocumented = response.alignment_feedback.features_implemented_not_documented
    if undocumented:
        sections.append("\n**Features found in code but not mentioned in report:**")
        for u in undocumented:
            sections.append(f"- {u}")

    # --- 7. Originality & Integrity ---
    # We only show this section to the student if there are low-level issues
    # or general notes. High-risk plagiarism cases are handled by the instructor,
    # but the system provides a hedged summary here.
    if response.originality_feedback.risk_level != "LOW":
        sections.append("\n## Originality Notes")
        sections.append(
            f"> {response.originality_feedback.summary} "
            "Please ensure all external sources and AI assistance are properly "
            "cited according to course policy."
        )

    # --- 8. Action Plan ---
    recs = response.actionable_recommendations
    if recs:
        sections.append("\n## Actionable Recommendations")
        sections.append(
            f"*(Estimated total time: {response.estimated_total_improvement_time})*"
        )
        sections.append("\n| Priority | Action | Rationale | Est. Time |")
        sections.append("|---|---|---|---|")
        for r in recs:
            sev_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🔵"}.get(
                r.priority, "⚪"
            )
            sections.append(
                f"| {sev_icon} {r.priority} | {r.action} | {r.rationale} | {r.estimated_time_hours} |"
            )

    # --- 9. Learning Resources ---
    if response.learning_resources:
        sections.append("\n## Recommended Learning Topics")
        for lr in response.learning_resources:
            sections.append(f"- **{lr.topic}**: {lr.suggestion}")

    # --- Footer ---
    sections.append("\n---")
    sections.append(
        f"*Generated on {response.meta.generated_at[:10]} | "
        f"Model: {response.meta.model_name}*"
    )

    return "\n".join(sections)
