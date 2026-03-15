"""
AI Engine - Enhanced Feedback Generator

Generates comprehensive, human-readable feedback using LLMs (GPT-4/3.5)
with robust structural fallbacks when the API is unavailable or rate-limited.
Includes caching to reduce API costs for identical analysis profiles.
"""
import hashlib
import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

FEEDBACK_PROMPT_TEMPLATE = """
You are an experienced computer science professor providing detailed feedback on a student project.

PROJECT METRICS:
- Code Quality: {code_score}/100 (Complexity: {complexity}, Maintainability: {maintainability})
- Documentation: {doc_score}/100 (Completeness: {completeness}%, Clarity: {clarity})
- Report-Code Alignment: {alignment_score}%
- Originality: {originality_score}/100
- AI Detection: {ai_verdict} ({ai_probability}% AI-generated probability)

SPECIFIC FINDINGS:
{findings}

Please provide comprehensive feedback with:

1. OVERALL ASSESSMENT (2-3 sentences)
   - Acknowledge the student's effort
   - Summarize the project's quality level
   - Set a constructive tone

2. STRENGTHS (2-3 specific points)
   - What did the student do well?
   - Be specific with examples

3. AREAS FOR IMPROVEMENT (2-3 specific points)
   - What needs work?
   - Provide actionable suggestions
   - Include specific examples

4. ACTIONABLE RECOMMENDATIONS (2-3 items)
   - Concrete steps to improve
   - Prioritize the most important changes

Keep the tone:
- Professional yet warm
- Honest but encouraging
- Specific and actionable
- Supportive of learning

Word count: ~250-300 words
"""


class EnhancedFeedbackGenerator:
    """
    Generates comprehensive feedback using LLMs (OpenAI) with structured fallback.
    Caches identical payloads to save on recurring API requests.
    """

    def __init__(self):
        self._setup_client()
        self.max_retries = 3
        # Simple memory cache: SHA256(metrics) -> LLM string response
        self._cache: Dict[str, str] = {}

    def _setup_client(self):
        """Initialize the Gemini client if API key is available."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    self.model_name,
                    system_instruction="You are a constructive, professional computer science professor."
                )
                self.client = True  # Used as a flag to indicate successful setup
                logger.info(f"Gemini client initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to init Gemini client: {e}")
                self.client = None
        else:
            logger.warning("GEMINI_API_KEY not found. Operating in fallback mode.")
            self.client = None

    def generate_comprehensive_feedback(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate feedback based on all analysis components.

        Args:
            analysis_results: Complete results from all analyzers
                - code_quality: {...}
                - doc_evaluation: {...}
                - alignment: {...}
                - ai_detection: {...}
                - plagiarism: {...}

        Returns:
            Dict containing structured feedback, narrative, priority items, and estimated time.
        """
        code_res = analysis_results.get("code_quality", {})
        doc_res = analysis_results.get("doc_evaluation", {})
        align_res = analysis_results.get("alignment", {})
        ai_res = analysis_results.get("ai_detection", {})
        plag_res = analysis_results.get("plagiarism", {})

        # Generate structural components via heuristics
        strengths = self._identify_strengths(analysis_results)
        improvements = self._generate_improvements(analysis_results)
        action_items = self._create_action_items(analysis_results)
        priority_items = self._get_priority_items(analysis_results)
        estimated_time = self._estimate_improvement_time(action_items)

        structured_feedback = {
            "overall_assessment": self._generate_overall_assessment(analysis_results),
            "code_quality_feedback": self._generate_code_feedback(code_res),
            "documentation_feedback": self._generate_doc_feedback(doc_res),
            "originality_feedback": self._generate_originality_feedback(ai_res, plag_res),
            "improvement_suggestions": improvements,
            "strengths": strengths,
            "action_items": action_items,
        }

        # Attempt to get LLM narrative
        narrative = self._generate_narrative_feedback(analysis_results)

        return {
            "structured_feedback": structured_feedback,
            "narrative_feedback": narrative,
            "priority_items": priority_items,
            "estimated_improvement_time": estimated_time,
        }

    # ------------------------------------------------------------------
    # LLM Integration
    # ------------------------------------------------------------------
    def _generate_narrative_feedback(self, results: Dict[str, Any]) -> str:
        """
        Generate comprehensive narrative using OpenAI API.
        Falls back to template if client isn't configured or API fails.
        """
        if not self.client:
            return self._fallback_narrative_feedback(results)

        # Assemble metrics
        code = results.get("code_quality", {})
        doc = results.get("doc_evaluation", {})
        align = results.get("alignment", {})
        ai = results.get("ai_detection", {})
        plag = results.get("plagiarism", {})

        # Build prompt
        prompt = FEEDBACK_PROMPT_TEMPLATE.format(
            code_score=code.get("final_score", 0),
            complexity=code.get("complexity_score", 0),
            maintainability=code.get("maintainability_score", 0),
            doc_score=doc.get("final_score", 0),
            completeness=doc.get("completeness", 0),
            clarity=doc.get("clarity", 0),
            alignment_score=align.get("overall_alignment_score", 0),
            originality_score=plag.get("originality_score", 100),
            ai_verdict=ai.get("verdict", "UNKNOWN"),
            ai_probability=ai.get("ai_generated_probability", 0) * 100,
            findings="\n".join(self._compile_raw_findings(results)),
        )

        # Cache check
        prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
        if prompt_hash in self._cache:
            logger.info("Feedback narrative served from cache.")
            return self._cache[prompt_hash]

        # API Call with exponential backoff
        delay = 1.0
        for attempt in range(self.max_retries):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        "max_output_tokens": 600,
                        "temperature": 0.7,
                    }
                )
                content = response.text
                if content:
                    self._cache[prompt_hash] = content.strip()
                    logger.info("Successfully generated feedback via Gemini.")
                    return content.strip()
            except Exception as e:
                logger.warning(f"Gemini API call failed on attempt {attempt+1}: {e}")
                time.sleep(delay)
                delay *= 2

        logger.error("All Gemini API attempts failed. Using fallback template.")
        return self._fallback_narrative_feedback(results)

    def _fallback_narrative_feedback(self, results: Dict[str, Any]) -> str:
        """Structured template builder when LLM is unavailable."""
        strengths = self._identify_strengths(results)
        improvements = self._generate_improvements(results)

        lines = [
            "We have reviewed your project submission based on multiple code quality and structural metrics.",
            "Overall, your project demonstrates solid effort." if strengths else "Your project has been analyzed.",
            "\n### Key Strengths:",
        ]
        
        if strengths:
            lines.extend(f"- {s}" for s in strengths)
        else:
            lines.append("- Attempted implementation of the specification.")

        lines.append("\n### Areas for Improvement:")
        if improvements:
            lines.extend(f"- {i}" for i in improvements[:3])
        else:
            lines.append("- Review the detailed metrics for specific code quality warnings.")

        lines.append("\nPlease review the detailed actionable items below to guide your next revision. Keep up the hard work!")
        
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Heuristic Generators (Structured Data)
    # ------------------------------------------------------------------
    def _generate_overall_assessment(self, results: Dict[str, Any]) -> str:
        """Generate a short 1-line heuristic assessment."""
        code_score = results.get("code_quality", {}).get("final_score", 0)
        align_score = results.get("alignment", {}).get("overall_alignment_score", 0)
        
        avg = (code_score + align_score) / 2
        
        if avg >= 85:
            return "Excellent work. The project is highly robust, well-aligned with its documentation, and structurally sound."
        elif avg >= 70:
            return "Good effort. The core functionality is present, though there are moderate areas for structural refinement."
        elif avg >= 50:
            return "Fair execution. Several aspects of the codebase or documentation require substantial improvement to meet professional standards."
        else:
            return "This project needs significant revision. Please focus on fundamental code quality and ensuring the code matches its report."

    def _generate_code_feedback(self, code: Dict[str, Any]) -> str:
        score = code.get("final_score", 0)
        if score >= 80:
            return "Code is clean, highly maintainable, and mostly free of complex bottlenecks."
        elif score >= 60:
            return "Code structure is acceptable, but some functions have high cyclomatic complexity and should be refactored."
        else:
            return "Code quality is poor. There are widespread maintainability issues, syntax warnings, or excessively complex methods."

    def _generate_doc_feedback(self, doc: Dict[str, Any]) -> str:
        score = doc.get("final_score", 0)
        if score >= 80:
            return "Outstanding documentation. All required sections are present and the writing is clear and structured."
        elif score >= 60:
            return "Documentation is fair, but lacks sufficient code examples or misses some required architectural sections."
        else:
            return "Documentation is either missing or severely incomplete. Ensure you include Usage, Installation, and architectural overview."

    def _generate_originality_feedback(self, ai: Dict[str, Any], plag: Dict[str, Any]) -> str:
        verdict = ai.get("verdict", "UNKNOWN")
        sim_pct = plag.get("max_similarity_percent", 0.0)

        issues = []
        if "LIKELY_AI" in verdict or verdict == "POSSIBLY_AI_ASSISTED":
            issues.append(f"AI generation detected ({verdict}).")
        if sim_pct >= 75.0:
            issues.append(f"High similarity to existing projects ({sim_pct}% overlap).")

        if len(issues) == 2:
            return "CRITICAL: The codebase exhibits strong signs of both AI-generation and high structural plagiarism. This requires an immediate academic review."
        elif "AI generation" in "\n".join(issues):
            return "WARNING: Strong indicators of AI-assisted generation were detected. Ensure code is originally authored."
        elif "High similarity" in "\n".join(issues):
            return "WARNING: Extreme overlap with past projects detected. Please ensure your implementation logic is original."
        else:
            return "Clear. Code appears originally authored and free of major duplication."

    def _identify_strengths(self, results: Dict[str, Any]) -> List[str]:
        strengths = []
        code_score = results.get("code_quality", {}).get("final_score", 0)
        doc_score = results.get("doc_evaluation", {}).get("final_score", 0)
        align_score = results.get("alignment", {}).get("overall_alignment_score", 0)
        plag_score = results.get("plagiarism", {}).get("originality_score", 100.0)

        if code_score >= 80:
            strengths.append("High code maintainability and low complexity.")
        if doc_score >= 80:
            strengths.append("Comprehensive and well-structured documentation.")
        if align_score >= 80:
            strengths.append("Excellent alignment between the written report and actual codebase.")
        if plag_score >= 95.0:
            strengths.append("Highly original implementation with unique structural patterns.")

        return strengths

    def _generate_improvements(self, results: Dict[str, Any]) -> List[str]:
        improvements = []
        code = results.get("code_quality", {})
        doc = results.get("doc_evaluation", {})
        align = results.get("alignment", {})

        if code.get("complexity_score", 100) < 70:
            improvements.append("Refactor complex functions to reduce cyclomatic complexity (aim for smaller, distinct tasks).")
        if doc.get("missing_sections"):
            sects = ", ".join(doc["missing_sections"])
            improvements.append(f"Add missing documentation sections: {sects}.")
        if align.get("missing_features", []):
            feats = ", ".join(align["missing_features"][:2])
            improvements.append(f"Ensure features mentioned in the report ({feats}) are actually implemented in the code.")
        
        return improvements

    def _create_action_items(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        actions = []
        code = results.get("code_quality", {})
        plag = results.get("plagiarism", {})
        align = results.get("alignment", {})
        ai = results.get("ai_detection", {})

        # Security / Academic Integrity
        if plag.get("risk_level") in ["HIGH", "MEDIUM"]:
            actions.append({"priority": "HIGH", "action": "Rewrite copied structural logic to ensure originality.", "estimated_time": "2-4 hours"})
        if "LIKELY_AI" in ai.get("verdict", ""):
            actions.append({"priority": "HIGH", "action": "Defend AI-flagged code blocks during evaluation or rewrite manually.", "estimated_time": "1-3 hours"})

        # Code & Architecture
        if code.get("maintainability_score", 100) < 60:
            actions.append({"priority": "MEDIUM", "action": "Refactor monolithic classes/functions into smaller modules.", "estimated_time": "3-5 hours"})
        if align.get("overall_alignment_score", 100) < 60:
            actions.append({"priority": "MEDIUM", "action": "Update the project report to accurately reflect the current API and technologies used.", "estimated_time": "1-2 hours"})

        return actions

    def _get_priority_items(self, results: Dict[str, Any]) -> List[str]:
        items = self._create_action_items(results)
        # Sort by priority string HIGH -> MEDIUM -> LOW
        items.sort(key=lambda x: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(x["priority"], 3))
        return [f"[{i['priority']}] {i['action']}" for i in items[:3]]

    def _estimate_improvement_time(self, action_items: List[Dict[str, str]]) -> str:
        """Estimate total hours based on action item substrings."""
        total_hours = 0
        for item in action_items:
            time_str = item.get("estimated_time", "")
            nums = [int(s) for s in re.findall(r'\d+', time_str)]
            if nums:
                total_hours += max(nums)  # Take upper bound

        if total_hours == 0:
            return "Less than 1 hour"
        elif total_hours <= 5:
            return "5 hours or less"
        elif total_hours <= 10:
            return "5-10 hours"
        else:
            return "10+ hours"

    def _compile_raw_findings(self, results: Dict[str, Any]) -> List[str]:
        """Flatten dictionaries into bullet points for the LLM prompt."""
        findings = []
        if code_issues := results.get("code_quality", {}).get("details", {}).get("pylint_issues"):
            findings.append(f"- Found {len(code_issues)} linter warnings/errors.")
        if align_mismatches := results.get("alignment", {}).get("mismatches"):
            findings.append(f"- Architecture mismatches: {', '.join(align_mismatches[:3])}")
        if ai_flags := results.get("ai_detection", {}).get("flags"):
            findings.append(f"- AI specific flags: {', '.join(ai_flags)}")
        
        if not findings:
            findings.append("- No specific major findings were flagged.")
        return findings
