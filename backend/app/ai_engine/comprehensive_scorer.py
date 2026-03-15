"""
AI Engine - Comprehensive Scorer & Evaluator

Orchestrates the entire AI evaluation pipeline, compiling data from
all sub-engines to generate a final weighted score, letter grade,
and comprehensive feedback.
"""
import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)

class ComprehensiveScorer:
    """
    Calculates overall project score with weighted components,
    penalties, bonuses, and standard letter grading.
    """

    def __init__(self):
        # Component weights (must sum to 1.0)
        self.weights = {
            'code_quality': 0.25,
            'documentation_quality': 0.15,
            'report_alignment': 0.15,
            'originality': 0.20,
            'ai_authenticity': 0.15,
            'functionality': 0.10
        }

        # Letter grade scale (min_score, max_score)
        self.grade_scale = [
            ('A+', 97.0, 100.0),
            ('A', 93.0, 96.99),
            ('A-', 90.0, 92.99),
            ('B+', 87.0, 89.99),
            ('B', 83.0, 86.99),
            ('B-', 80.0, 82.99),
            ('C+', 77.0, 79.99),
            ('C', 73.0, 76.99),
            ('C-', 70.0, 72.99),
            ('D+', 67.0, 69.99),
            ('D', 63.0, 66.99),
            ('D-', 60.0, 62.99),
            ('F', 0.0, 59.99)
        ]

    def calculate_overall_score(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive score with detailed breakdown.
        """
        # Extract base scores
        code_score = analysis_results.get('code_quality', {}).get('final_score', 0.0)
        doc_score = analysis_results.get('doc_evaluation', {}).get('final_score', 0.0)
        align_score = analysis_results.get('alignment', {}).get('overall_alignment_score', 0.0)
        orig_score = analysis_results.get('plagiarism', {}).get('originality_score', 100.0)
        
        # Calculate AI authenticity from probability
        ai_prob = analysis_results.get('ai_detection', {}).get('ai_generated_probability', 0.0)
        auth_score = self._calculate_authenticity_score(ai_prob)
        
        # Functionality acts as a placeholder or external test runner score
        func_score = analysis_results.get('functionality', {}).get('score', 100.0)

        # Baseline weighted score
        # Using raw sum of weights instead of pure 1.0 assumption to handle missing dimensions safely
        raw_components = {
            'code_quality': code_score * self.weights['code_quality'],
            'documentation_quality': doc_score * self.weights['documentation_quality'],
            'report_alignment': align_score * self.weights['report_alignment'],
            'originality': orig_score * self.weights['originality'],
            'ai_authenticity': auth_score * self.weights['ai_authenticity'],
            'functionality': func_score * self.weights['functionality']
        }
        
        base_score = sum(raw_components.values())

        # Apply Modifiers
        penalized_score, penalties = self._apply_penalties(base_score, analysis_results)
        final_score, bonuses = self._apply_bonuses(penalized_score, analysis_results)
        
        # Clamp between 0 and 100
        final_score = max(0.0, min(100.0, float(round(final_score, 2))))

        return {
            'final_score': final_score,
            'base_score': float(round(base_score, 2)),
            'letter_grade': self._get_letter_grade(final_score),
            'component_scores': {
                'code_quality': float(round(code_score, 2)),
                'documentation_quality': float(round(doc_score, 2)),
                'report_alignment': float(round(align_score, 2)),
                'originality': float(round(orig_score, 2)),
                'ai_authenticity': float(round(auth_score, 2)),
                'functionality': float(round(func_score, 2))
            },
            'weighted_contributions': {k: float(round(v, 2)) for k, v in raw_components.items()},
            'penalties': penalties,
            'bonuses': bonuses,
            'score_interpretation': self._interpret_score(final_score),
            'percentile': self._calculate_percentile(final_score)
        }

    def _calculate_authenticity_score(self, ai_probability: float) -> float:
        """Convert AI probability (0-1) to an authenticity score (0-100)."""
        # If 90% AI (0.9), authenticity is 10
        return float(round((1.0 - ai_probability) * 100.0, 2))

    def _apply_penalties(self, score: float, results: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]]]:
        """Apply penalties for serious academic/structural issues."""
        penalties = []
        current_score = score
        
        plag = results.get('plagiarism', {})
        ai = results.get('ai_detection', {})
        align = results.get('alignment', {})

        # 1. Plagiarism flagged
        if plag.get('flagged', False) or plag.get('max_similarity_percent', 0.0) >= 80.0:
            penalties.append({'reason': 'High Plagiarism overlap detected', 'amount': -20.0})
            current_score -= 20.0

        # 2. & 3. AI Generation
        verdict = ai.get('verdict', '')
        if 'LIKELY_AI' in verdict:
            penalties.append({'reason': 'Highly likely AI-generated code', 'amount': -15.0})
            current_score -= 15.0
        elif verdict == 'POSSIBLY_AI_ASSISTED':
            penalties.append({'reason': 'Signs of AI assistance in code structure', 'amount': -5.0})
            current_score -= 5.0

        # 4. Poor Alignment
        if align.get('overall_alignment_score', 100.0) < 40.0:
            penalties.append({'reason': 'Poor alignment between report and actual code', 'amount': -10.0})
            current_score -= 10.0

        # 5. Missing features
        missing = align.get('missing_features', [])
        if missing:
            penalty_val = min(15.0, len(missing) * 2.0)
            penalties.append({'reason': f'Missing documented features ({len(missing)} items)', 'amount': -penalty_val})
            current_score -= penalty_val

        return current_score, penalties

    def _apply_bonuses(self, score: float, results: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]]]:
        """Apply bonuses for exceptional work (Max +5 total)."""
        bonuses = []
        total_bonus = 0.0

        code_score = results.get('code_quality', {}).get('final_score', 0.0)
        align_score = results.get('alignment', {}).get('overall_alignment_score', 0.0)
        orig_score = results.get('plagiarism', {}).get('originality_score', 0.0)
        doc_score = results.get('doc_evaluation', {}).get('final_score', 0.0)

        if code_score >= 95.0:
            bonuses.append({'reason': 'Exceptional code maintainability and structure', 'amount': 3.0})
            total_bonus += 3.0
            
        if align_score >= 95.0:
            bonuses.append({'reason': 'Perfect documentation alignment', 'amount': 2.0})
            total_bonus += 2.0

        if orig_score >= 95.0:
            bonuses.append({'reason': 'High logical originality', 'amount': 2.0})
            total_bonus += 2.0

        if doc_score >= 90.0:
            bonuses.append({'reason': 'Comprehensive documentation', 'amount': 2.0})
            total_bonus += 2.0

        # Cap bonuses at +5.0
        applied_bonus = min(5.0, total_bonus)
        
        # If capped, adjust the visual array so it makes sense in UI
        if total_bonus > 5.0:
            bonuses.append({'reason': 'Bonus capping applied (Max +5 limit)', 'amount': -(total_bonus - 5.0)})

        return score + applied_bonus, bonuses

    def _get_letter_grade(self, score: float) -> str:
        """Convert final numerical score to standard letter grade."""
        for grade, min_s, max_s in self.grade_scale:
            if min_s <= score <= max_s or (grade == 'A+' and score >= 100.0):
                return grade
        return 'F'

    def _interpret_score(self, score: float) -> str:
        """Provide a textual interpretation of the grade bracket."""
        if score >= 93: return "Outstanding work demonstrating mastery"
        if score >= 85: return "Excellent work with minor areas for improvement"
        if score >= 75: return "Good work meeting most requirements"
        if score >= 65: return "Satisfactory work with significant room for improvement"
        if score >= 55: return "Below expectations, needs substantial revision"
        return "Does not meet minimum standards"

    def _calculate_percentile(self, score: float) -> str:
        """Static percentile assignment based on standard academic distribution heuristics."""
        if score >= 95: return "Top 5%"
        if score >= 90: return "Top 10%"
        if score >= 85: return "Top 20%"
        if score >= 80: return "Top 30%"
        if score >= 75: return "Top 50%"
        return "Below average"


# ---------------------------------------------------------------------------
# Master Integration Class
# ---------------------------------------------------------------------------
class EnhancedProjectEvaluator:
    """
    Main evaluator integrating all AI components. Orchestrates file
    reading, parsing, ML scoring, and LLM feedback generation.
    """

    def __init__(self):
        from app.ai_engine.code_analyzer import CodeAnalyzer
        from app.ai_engine.doc_evaluator import DocumentationEvaluator
        from app.ai_engine.ai_code_detector import AICodeDetector
        from app.ai_engine.report_code_aligner import ReportCodeAligner
        from app.ai_engine.plagiarism_detector import PlagiarismDetectorWithCache
        from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator

        # Instantiate all sub-engines
        self.code_analyzer = CodeAnalyzer()
        self.doc_evaluator = DocumentationEvaluator()
        self.ai_detector = AICodeDetector()
        self.aligner = ReportCodeAligner()
        self.plagiarism_detector = PlagiarismDetectorWithCache()
        self.scorer = ComprehensiveScorer()
        self.feedback_generator = EnhancedFeedbackGenerator()

    def evaluate_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete AI evaluation pipeline.

        Args:
            project_data: {
                'id': int,
                'title': str,
                'code_file_path': str,   # Path to uploaded main code / zip (extracted)
                'doc_file_path': str,    # Path to uploaded PDF/Docx
                'existing_projects': List[dict] # For plagiarism check
            }
        """
        logger.info(f"Starting full evaluation for project ID {project_data.get('id')}")
        results = {}
        
        # 1. Read source code
        code_path = project_data.get('code_file_path', '')
        code_content = ""
        try:
            with open(code_path, 'r', encoding='utf-8', errors='ignore') as f:
                code_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read code file {code_path}: {e}")
            
        # 2. Run Ensembles
        # a) Code Quality
        try:
            results['code_quality'] = self.code_analyzer.analyze(code_path)
        except Exception as e:
            logger.error(f"Code analysis failed: {e}")
            results['code_quality'] = {}

        # b) Document Quality
        doc_path = project_data.get('doc_file_path', '')
        try:
            results['doc_evaluation'] = self.doc_evaluator.evaluate(doc_path)
        except Exception as e:
            logger.error(f"Doc evaluation failed: {e}")
            results['doc_evaluation'] = {}

        # c) AI Detection
        try:
            results['ai_detection'] = self.ai_detector.analyze(code_content, code_path)
        except Exception as e:
            logger.error(f"AI detection failed: {e}")
            results['ai_detection'] = {}

        # d) Report-Code Alignment
        try:
            doc_text = results.get('doc_evaluation', {}).get('raw_text', '')
            results['alignment'] = self.aligner.analyze_alignment(
                report_text=doc_text, 
                code_content=code_content,
                file_paths=[code_path]
            )
        except Exception as e:
            logger.error(f"Alignment analysis failed: {e}")
            results['alignment'] = {}

        # e) Plagiarism Check
        try:
            existing_projects = project_data.get('existing_projects', [])
            results['plagiarism'] = self.plagiarism_detector.detect(
                current_code=code_content, 
                existing_projects=existing_projects
            )
        except Exception as e:
            logger.error(f"Plagiarism detection failed: {e}")
            results['plagiarism'] = {}

        # 3. Compile Master Score
        scoring_breakdown = self.scorer.calculate_overall_score(results)
        results['scoring'] = scoring_breakdown

        # 4. Generate LLM Feedback
        try:
            feedback = self.feedback_generator.generate_comprehensive_feedback(results)
            results['feedback'] = feedback
        except Exception as e:
            logger.error(f"Feedback generation failed: {e}")
            results['feedback'] = {}

        # Clean payload (remove massive raw strings before returning to API)
        if 'doc_evaluation' in results and 'raw_text' in results['doc_evaluation']:
            del results['doc_evaluation']['raw_text']
            
        logger.info(f"Evaluation complete for project ID {project_data.get('id')}. Final Score: {scoring_breakdown.get('final_score')}")
        return results
