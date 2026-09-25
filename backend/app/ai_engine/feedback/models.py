"""
feedback/models.py
==================
Pydantic v2 models for the AI feedback generation pipeline.

Every LLM response (Gemini or Groq) and every heuristic-fallback response is
validated against FeedbackResponse.  FeedbackResult is the final envelope
returned to callers.

Design notes
------------
- Literal types are used for all enums; Union/Optional avoided where Gemini's
  structured-output has known $ref/$defs incompatibilities.
- Nullable string fields use ``str | None`` with ``default=None`` rather than
  ``Optional[str]`` to stay compatible with both providers.
- All numeric score fields are ``float`` (0–100) to accept both int and float
  from the LLM.
"""

from __future__ import annotations

import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
class FeedbackMeta(BaseModel):
    generated_at: str = Field(description="ISO-8601 timestamp of generation")
    generated_by: Literal["llm", "heuristic_fallback"] = Field(
        description="Whether this was LLM-generated or a heuristic fallback"
    )
    model_name: str = Field(description="Provider:model string, e.g. gemini:gemini-2.5-flash")
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = Field(
        description="Overall confidence in the feedback quality"
    )
    prompt_version: str = Field(description="Prompt template version identifier")


# ---------------------------------------------------------------------------
# Executive Summary
# ---------------------------------------------------------------------------
class ExecutiveSummary(BaseModel):
    one_line_verdict: str = Field(
        description="Single sentence plain-language summary"
    )
    overall_grade_suggestion: Literal["A", "B", "C", "D", "F"] = Field(
        description="Advisory grade suggestion — not the final grade"
    )
    overall_assessment: str = Field(
        description="2–4 sentences, warm but honest overall assessment"
    )


# ---------------------------------------------------------------------------
# Scores
# ---------------------------------------------------------------------------
class ScoresBlock(BaseModel):
    code_quality: float = Field(ge=0, le=100)
    documentation_quality: float = Field(ge=0, le=100)
    report_code_alignment: float = Field(ge=0, le=100)
    originality: float = Field(ge=0, le=100)
    overall: float = Field(ge=0, le=100)


# ---------------------------------------------------------------------------
# Code Quality
# ---------------------------------------------------------------------------
class CodeIssue(BaseModel):
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    file: str = Field(description="Relative file path within the submission")
    line: int = Field(ge=0, description="Line number (0 if unknown)")
    description: str = Field(description="What is wrong")
    suggestion: str = Field(description="How to fix it")


class CodeQualityFeedback(BaseModel):
    summary: str
    strengths: list[str] = Field(default_factory=list)
    issues: list[CodeIssue] = Field(default_factory=list)
    complexity_notes: str = ""
    maintainability_notes: str = ""
    best_practices_notes: str = ""
    security_notes: str = ""
    testing_notes: str = ""


# ---------------------------------------------------------------------------
# Documentation
# ---------------------------------------------------------------------------
class DocumentationFeedback(BaseModel):
    summary: str
    missing_sections: list[str] = Field(default_factory=list)
    clarity_notes: str = ""
    completeness_percent: float = Field(ge=0, le=100, default=0)
    suggestions: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Alignment
# ---------------------------------------------------------------------------
class AlignmentFeedback(BaseModel):
    summary: str
    features_claimed_not_implemented: list[str] = Field(default_factory=list)
    features_implemented_not_documented: list[str] = Field(default_factory=list)
    alignment_score: float = Field(ge=0, le=100, default=0)


# ---------------------------------------------------------------------------
# Originality
# ---------------------------------------------------------------------------
class OriginalityFeedback(BaseModel):
    ai_detection_verdict: str
    ai_detection_probability_percent: float = Field(ge=0, le=100, default=0)
    plagiarism_similarity_percent: float = Field(ge=0, le=100, default=0)
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    summary: str
    requires_manual_review: bool = False


# ---------------------------------------------------------------------------
# Recommendations & Resources
# ---------------------------------------------------------------------------
class ActionableRecommendation(BaseModel):
    priority: Literal["HIGH", "MEDIUM", "LOW"]
    action: str = Field(description="Concrete next step")
    rationale: str = Field(description="Why this matters")
    estimated_time_hours: str = Field(
        description="e.g. '1-2'", default="1-2"
    )


class LearningResource(BaseModel):
    topic: str
    suggestion: str = Field(
        description="A concept to review — no external links unless verified"
    )


# ---------------------------------------------------------------------------
# Top-level FeedbackResponse (validated directly from LLM output)
# ---------------------------------------------------------------------------
class FeedbackResponse(BaseModel):
    """
    Full structured feedback exactly matching the spec schema.
    This model is passed as ``response_schema`` to Gemini native structured
    output and used to validate Groq JSON responses.
    """

    meta: FeedbackMeta
    executive_summary: ExecutiveSummary
    scores: ScoresBlock
    code_quality_feedback: CodeQualityFeedback
    documentation_feedback: DocumentationFeedback
    alignment_feedback: AlignmentFeedback
    originality_feedback: OriginalityFeedback
    strengths: list[str] = Field(
        default_factory=list,
        description="Consolidated top-level list, 2–4 items",
    )
    areas_for_improvement: list[str] = Field(
        default_factory=list,
        description="Consolidated top-level list, 2–4 items",
    )
    actionable_recommendations: list[ActionableRecommendation] = Field(
        default_factory=list
    )
    estimated_total_improvement_time: str = ""
    learning_resources: list[LearningResource] = Field(default_factory=list)
    instructor_notes: str | None = Field(
        default=None,
        description=(
            "Private notes for graders only — MUST NEVER appear in the "
            "student-facing narrative (narrative_renderer.py explicitly excludes this)"
        ),
    )


# ---------------------------------------------------------------------------
# FeedbackResult — final envelope returned to callers
# ---------------------------------------------------------------------------
class FeedbackResult(BaseModel):
    """
    Envelope wrapping the validated FeedbackResponse together with runtime
    metadata (cache status, latency, provider used).
    """

    structured_json: FeedbackResponse
    narrative_md: str = Field(
        description="Deterministic student-facing Markdown (instructor_notes excluded)"
    )
    cache_hit: bool = False
    provider_used: str = Field(
        description="e.g. 'gemini:gemini-2.5-flash' or 'heuristic_fallback'"
    )
    latency_ms: float = 0.0
    correlation_id: str | None = None
