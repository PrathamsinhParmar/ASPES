"""
feedback/fallback.py
====================
Heuristic feedback generator — same JSON shape as the LLM path, but built
entirely from pre-computed numeric metrics.

When to use
-----------
ONLY when both LLM providers (Gemini and Groq) are unavailable or
quota-exhausted.  This path is clearly labeled in the output:
  meta.generated_by = "heuristic_fallback"
  meta.confidence   = "LOW"

Guarantee
---------
``generate_heuristic_feedback`` ALWAYS returns a fully valid ``FeedbackResponse``
that passes Pydantic validation — even when ``metrics`` is empty.

What this module does NOT do
-----------------------------
- It never invents file paths or line numbers.  ``code_quality_feedback.issues``
  is always empty because we have no real code content to reference.
- It never sets ``meta.generated_by = "llm"``.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from .models import (
    ActionableRecommendation,
    AlignmentFeedback,
    CodeQualityFeedback,
    DocumentationFeedback,
    ExecutiveSummary,
    FeedbackMeta,
    FeedbackResponse,
    LearningResource,
    OriginalityFeedback,
    ScoresBlock,
)
from .prompt_builder import PROMPT_VERSION

logger = logging.getLogger(__name__)


def generate_heuristic_feedback(
    metrics: dict[str, Any] | None = None,
) -> FeedbackResponse:
    """
    Build a ``FeedbackResponse`` from numeric metrics using threshold rules.

    Parameters
    ----------
    metrics:
        Dictionary of upstream analysis results (same shape as
        ``analysis_results`` in evaluation_tasks.py).  May be empty or None.

    Returns
    -------
    FeedbackResponse
        Always schema-valid; ``meta.generated_by == "heuristic_fallback"``.
    """
    metrics = metrics or {}
    code_res = metrics.get("code_quality", {}) or {}
    doc_res = metrics.get("doc_evaluation", {}) or {}
    align_res = metrics.get("alignment", {}) or {}
    ai_res = metrics.get("ai_detection", {}) or {}
    plag_res = metrics.get("plagiarism", {}) or {}
    scoring = metrics.get("scoring", {}) or {}

    # --- Extract numeric scores ---
    code_score = float(code_res.get("final_score", 0))
    doc_score = float(doc_res.get("final_score", 0))
    align_score = float(align_res.get("overall_alignment_score", 0))
    plag_score = float(plag_res.get("originality_score", 100))
    ai_prob = float(ai_res.get("ai_generated_probability", 0))
    overall = float(scoring.get("final_score", 0))
    if overall == 0:
        # Compute simple average when comprehensive scorer unavailable
        divisors = [s for s in [code_score, doc_score, align_score, plag_score] if s > 0]
        overall = sum(divisors) / len(divisors) if divisors else 0

    # --- Meta ---
    meta = FeedbackMeta(
        generated_at=datetime.now(timezone.utc).isoformat(),
        generated_by="heuristic_fallback",
        model_name="heuristic_fallback",
        confidence="LOW",
        prompt_version=PROMPT_VERSION,
    )

    # --- Executive summary ---
    grade, verdict, assessment = _grade_and_assessment(overall)
    executive_summary = ExecutiveSummary(
        one_line_verdict=verdict,
        overall_grade_suggestion=grade,
        overall_assessment=assessment,
    )

    # --- Scores (use deterministic values from analyzers) ---
    scores = ScoresBlock(
        code_quality=round(code_score, 1),
        documentation_quality=round(doc_score, 1),
        report_code_alignment=round(align_score, 1),
        originality=round(plag_score, 1),
        overall=round(overall, 1),
    )

    # --- Code quality feedback (no file/line refs) ---
    code_strengths: list[str] = []
    code_summary_parts: list[str] = []

    complexity = code_res.get("complexity", 0) or code_res.get("scores", {}).get("complexity", 0)
    maintainability = code_res.get("maintainability", 0) or code_res.get("scores", {}).get("maintainability", 0)

    if code_score >= 80:
        code_summary_parts.append("Code is clean and well-structured.")
        code_strengths.append("High code maintainability and low complexity.")
    elif code_score >= 60:
        code_summary_parts.append(
            "Code structure is acceptable but could benefit from refactoring."
        )
    else:
        code_summary_parts.append(
            "Code quality needs significant improvement — see diagnostics for details."
        )

    security_issues = code_res.get("security_issues", [])
    security_note = (
        f"{len(security_issues)} security pattern(s) flagged by static analysis."
        if security_issues
        else "No obvious security patterns flagged by static analysis."
    )
    smells = code_res.get("code_smells", [])
    testing_note = (
        "No test files were detected in the submission."
        if not _has_tests(metrics)
        else "Some test structure was detected."
    )

    code_quality_feedback = CodeQualityFeedback(
        summary=" ".join(code_summary_parts),
        strengths=code_strengths,
        issues=[],  # Heuristic path never invents file/line references
        complexity_notes=(
            f"Average cyclomatic complexity score: {round(float(complexity), 1)}/100."
        ),
        maintainability_notes=(
            f"Maintainability index score: {round(float(maintainability), 1)}/100."
        ),
        best_practices_notes=(
            "Review pylint diagnostics in the detailed analysis for specific warnings."
        ),
        security_notes=security_note,
        testing_notes=testing_note,
    )

    # --- Documentation feedback ---
    missing = doc_res.get("missing_sections", [])
    doc_suggestions: list[str] = []
    if missing:
        doc_suggestions.append(f"Add missing sections: {', '.join(missing)}.")
    if doc_score < 60:
        doc_suggestions.append(
            "Ensure the report includes: Introduction, Installation, Usage, and Examples."
        )

    doc_summary = (
        "Documentation is comprehensive and well-structured."
        if doc_score >= 80
        else (
            "Documentation is present but missing some key sections."
            if doc_score >= 55
            else "Documentation is incomplete or poorly structured."
        )
    )
    documentation_feedback = DocumentationFeedback(
        summary=doc_summary,
        missing_sections=missing,
        clarity_notes=f"Clarity score: {round(float(doc_res.get('clarity', 0)), 1)}/100.",
        completeness_percent=round(float(doc_res.get("completeness", 0)), 1),
        suggestions=doc_suggestions,
    )

    # --- Alignment feedback ---
    align_summary = (
        "Report and code are well-aligned."
        if align_score >= 80
        else (
            "Some mismatches detected between report claims and implementation."
            if align_score >= 55
            else "Significant mismatches between report and code. Review carefully."
        )
    )
    align_mismatches = align_res.get("mismatches", [])
    alignment_feedback = AlignmentFeedback(
        summary=align_summary,
        features_claimed_not_implemented=[
            str(m) for m in align_mismatches[:3]
        ],
        features_implemented_not_documented=[],
        alignment_score=round(align_score, 1),
    )

    # --- Originality feedback ---
    ai_verdict_str = ai_res.get("verdict", "UNKNOWN")
    max_sim = float(plag_res.get("max_similarity_percent", 0))
    flagged = plag_res.get("flagged", False)
    risk_level = plag_res.get("risk_level", "LOW")
    if risk_level not in ("LOW", "MEDIUM", "HIGH"):
        risk_level = "LOW"

    requires_review = flagged or ai_prob >= 0.75
    orig_summary = (
        "No significant originality concerns detected."
        if not requires_review
        else "Originality concerns detected — see instructor notes for details."
    )
    originality_feedback = OriginalityFeedback(
        ai_detection_verdict=ai_verdict_str,
        ai_detection_probability_percent=round(ai_prob * 100, 1),
        plagiarism_similarity_percent=round(max_sim, 1),
        risk_level=risk_level,  # type: ignore[arg-type]
        summary=orig_summary,
        requires_manual_review=requires_review,
    )

    # --- Top-level strengths ---
    strengths: list[str] = []
    if code_score >= 80:
        strengths.append("Strong code quality and low complexity.")
    if doc_score >= 80:
        strengths.append("Comprehensive and well-structured documentation.")
    if align_score >= 80:
        strengths.append("Good alignment between report claims and implementation.")
    if plag_score >= 95:
        strengths.append("Highly original implementation.")
    if not strengths:
        strengths.append("Project demonstrates a genuine attempt at the specification.")

    # --- Areas for improvement ---
    improvements: list[str] = []
    if code_score < 70:
        improvements.append("Refactor complex functions to improve maintainability.")
    if missing:
        improvements.append(f"Add missing report sections: {', '.join(missing[:3])}.")
    if align_score < 70:
        improvements.append(
            "Ensure the report accurately reflects the implemented features."
        )
    if security_issues:
        improvements.append("Address flagged security patterns in the codebase.")
    if not improvements:
        improvements.append(
            "Continue refining code quality and documentation completeness."
        )

    # --- Actionable recommendations ---
    recommendations: list[ActionableRecommendation] = []
    if security_issues:
        recommendations.append(
            ActionableRecommendation(
                priority="HIGH",
                action="Review and resolve security pattern warnings flagged by static analysis.",
                rationale="Security issues can lead to vulnerabilities in production.",
                estimated_time_hours="1-2",
            )
        )
    if plag_res.get("risk_level") in ("HIGH", "MEDIUM"):
        recommendations.append(
            ActionableRecommendation(
                priority="HIGH",
                action="Review flagged similarity with other submissions.",
                rationale="High structural similarity may indicate policy violations.",
                estimated_time_hours="2-4",
            )
        )
    if code_score < 60:
        recommendations.append(
            ActionableRecommendation(
                priority="MEDIUM",
                action="Refactor large functions into smaller, single-responsibility units.",
                rationale="Improves readability, testability, and maintainability.",
                estimated_time_hours="3-5",
            )
        )
    if missing:
        recommendations.append(
            ActionableRecommendation(
                priority="MEDIUM",
                action=f"Add missing documentation sections: {', '.join(missing[:3])}.",
                rationale="Complete documentation aids reproducibility and grading.",
                estimated_time_hours="1-2",
            )
        )
    if not recommendations:
        recommendations.append(
            ActionableRecommendation(
                priority="LOW",
                action="Review all pylint diagnostics and address remaining warnings.",
                rationale="Clean code quality metrics improve maintainability.",
                estimated_time_hours="1-2",
            )
        )

    # --- Learning resources ---
    learning_resources: list[LearningResource] = [
        LearningResource(
            topic="Code Quality",
            suggestion="Review PEP 8 style guide and Python best practices for clean code.",
        ),
        LearningResource(
            topic="Documentation",
            suggestion=(
                "Study how to write effective README files and API documentation "
                "following the Divio documentation system."
            ),
        ),
    ]

    # --- Instructor notes ---
    instructor_parts: list[str] = []
    if requires_review:
        if ai_prob >= 0.75:
            instructor_parts.append(
                f"AI detection: {ai_verdict_str} ({ai_prob*100:.1f}% probability). "
                "Review flagged patterns with student."
            )
        if max_sim >= 75:
            instructor_parts.append(
                f"Plagiarism: {max_sim:.1f}% max similarity to existing submissions. "
                f"Risk level: {risk_level}. Manual review recommended."
            )
    instructor_notes = " | ".join(instructor_parts) if instructor_parts else None

    return FeedbackResponse(
        meta=meta,
        executive_summary=executive_summary,
        scores=scores,
        code_quality_feedback=code_quality_feedback,
        documentation_feedback=documentation_feedback,
        alignment_feedback=alignment_feedback,
        originality_feedback=originality_feedback,
        strengths=strengths[:4],
        areas_for_improvement=improvements[:4],
        actionable_recommendations=recommendations,
        estimated_total_improvement_time=_estimate_time(recommendations),
        learning_resources=learning_resources,
        instructor_notes=instructor_notes,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _grade_and_assessment(overall: float) -> tuple[str, str, str]:
    """Return (grade_letter, one_line_verdict, overall_assessment)."""
    if overall >= 85:
        return (
            "A",
            "Excellent project — strong code quality and comprehensive documentation.",
            (
                "This project demonstrates excellent technical execution. The codebase is "
                "well-structured and the documentation provides clear coverage of the "
                "implementation. A few minor refinements would make this submission exemplary."
            ),
        )
    elif overall >= 70:
        return (
            "B",
            "Good project with moderate areas for improvement.",
            (
                "The project shows solid effort and a good grasp of the core requirements. "
                "Several areas of the codebase and documentation could be refined to reach "
                "a higher standard. Addressing the listed recommendations would significantly "
                "improve the overall quality."
            ),
        )
    elif overall >= 55:
        return (
            "C",
            "Fair project — foundational work present but significant gaps remain.",
            (
                "The submission demonstrates a genuine attempt at the specification, but "
                "substantial improvements are needed in code quality and/or documentation. "
                "Focus on the high-priority recommendations below to address the most "
                "critical gaps before resubmission."
            ),
        )
    elif overall >= 40:
        return (
            "D",
            "Below expectations — core requirements partially met.",
            (
                "The project partially addresses the specification but has significant "
                "deficiencies in implementation quality or documentation completeness. "
                "A thorough revision addressing all actionable items below is recommended."
            ),
        )
    else:
        return (
            "F",
            "Project requires major revision before it can be accepted.",
            (
                "The current submission does not meet the minimum requirements. "
                "Fundamental issues with code quality and/or completeness must be resolved. "
                "Please review the full requirements specification and resubmit."
            ),
        )


def _has_tests(metrics: dict[str, Any]) -> bool:
    """Heuristic: check if any test-related keys appear in metrics."""
    code = metrics.get("code_quality", {})
    diagnostics = code.get("diagnostics", [])
    return any("test" in str(d).lower() for d in diagnostics)


def _estimate_time(
    recommendations: list[ActionableRecommendation],
) -> str:
    """Sum the upper bounds of estimated_time_hours ranges."""
    import re

    total = 0
    for rec in recommendations:
        nums = re.findall(r"\d+", rec.estimated_time_hours)
        if nums:
            total += max(int(n) for n in nums)
    if total == 0:
        return "Less than 1 hour"
    if total <= 5:
        return f"{total} hours or less"
    if total <= 10:
        return "5–10 hours"
    return "10+ hours"
