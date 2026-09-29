"""
AI Engine - Comprehensive Scorer & Evaluator

Orchestrates the entire AI evaluation pipeline, compiling data from
all sub-engines to generate a final weighted score, letter grade,
and comprehensive feedback.
"""
import logging
import os
import shutil
import tempfile
import zipfile
import concurrent.futures
from pathlib import Path
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

    @staticmethod
    def _extract_py_files(zip_path: str, extract_dir: str) -> List[str]:
        """
        Safely extract a zip archive and return a list of absolute paths
        to every .py file inside it (excluding hidden/dunder directories).
        """
        py_files: List[str] = []
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                for member in zf.namelist():
                    # Skip hidden dirs, __pycache__, and zip-slip paths
                    parts = Path(member).parts
                    if any(p.startswith('.') or p == '__pycache__' for p in parts):
                        continue
                    if '..' in member or member.startswith('/') or member.startswith('\\'):
                        continue
                    if member.endswith('.py'):
                        zf.extract(member, extract_dir)
                        py_files.append(os.path.join(extract_dir, member))
        except zipfile.BadZipFile as e:
            logger.warning(f"Bad zip file {zip_path}: {e}")
        except Exception as e:
            logger.warning(f"Zip extraction failed for {zip_path}: {e}")
        return py_files

    @classmethod
    def extract_code_from_path(cls, file_path: str, max_chars: int = 200000) -> str:
        """
        Safely extract readable source code from a file path (.py, .js, .jsx, etc.
        or from inside a .zip archive).
        """
        if not file_path:
            return ""

        # Handle remote Cloudinary URLs
        if file_path.startswith("http://") or file_path.startswith("https://"):
            try:
                import urllib.request
                import tempfile
                clean_url = file_path.split("?")[0]
                ext = os.path.splitext(clean_url)[1].lower() or ".zip"
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
                    temp_name = tf.name
                    with urllib.request.urlopen(file_path, timeout=30) as response:
                        tf.write(response.read())
                try:
                    return cls.extract_code_from_path(temp_name, max_chars=max_chars)
                finally:
                    if os.path.exists(temp_name):
                        try:
                            os.unlink(temp_name)
                        except Exception:
                            pass
            except Exception as remote_err:
                logger.warning(f"Failed to fetch remote code from {file_path}: {remote_err}")
                return ""

        if not os.path.isabs(file_path):
            candidate = os.path.join(os.getcwd(), file_path)
            if os.path.exists(candidate):
                file_path = candidate
            else:
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
                candidate = os.path.join(base_dir, file_path)
                if os.path.exists(candidate):
                    file_path = candidate
        if not os.path.exists(file_path):
            return ""

        if file_path.lower().endswith(".zip") and zipfile.is_zipfile(file_path):
            chunks: List[str] = []
            try:
                with zipfile.ZipFile(file_path, "r") as z:
                    valid_exts = {".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".java", ".cpp", ".c"}
                    for n in z.namelist():
                        parts = n.replace("\\", "/").split("/")
                        if any(p.startswith(".") or p in ("__pycache__", "node_modules", "venv", ".venv", "env", "dist", "build") for p in parts):
                            continue
                        ext = os.path.splitext(n)[1].lower()
                        if ext in valid_exts:
                            try:
                                content = z.read(n).decode("utf-8", errors="ignore").strip()
                                if content:
                                    chunks.append(f"# File: {n}\n{content}")
                            except Exception:
                                pass
                            if sum(len(c) for c in chunks) >= max_chars:
                                break
            except Exception as e:
                logger.warning(f"Failed to read zip archive {file_path}: {e}")
            return "\n\n".join(chunks)[:max_chars]

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()[:max_chars]
        except Exception as e:
            logger.warning(f"Failed to read file {file_path}: {e}")
            return ""

    @classmethod
    def _fetch_existing_projects_from_db(cls, current_project_id: Any) -> List[Dict[str, Any]]:
        """
        Fetch existing projects from database as a fallback when none are passed in project_data.
        """
        existing = []
        try:
            import sqlite3
            db_path = os.path.join(os.getcwd(), "aspes_dev.db")
            if not os.path.exists(db_path):
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
                candidate = os.path.join(base_dir, "aspes_dev.db")
                if os.path.exists(candidate):
                    db_path = candidate

            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                curr_id_str = str(current_project_id) if current_project_id else ""
                cursor.execute(
                    "SELECT id, title, code_file_path FROM projects WHERE code_file_path IS NOT NULL AND id != ?",
                    (curr_id_str,)
                )
                rows = cursor.fetchall()
                conn.close()

                for pid, title, cpath in rows:
                    if cpath:
                        code_text = cls.extract_code_from_path(cpath)
                        if code_text and code_text.strip():
                            existing.append({
                                "id": str(pid),
                                "code": code_text,
                                "student_name": title or f"Project {pid}",
                            })
        except Exception as e:
            logger.warning(f"Failed to auto-fetch existing projects from DB: {e}")
        return existing

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
        
        code_path = project_data.get('code_file_path', '')
        
        # If code_path is a remote URL, download it to a temporary file for analysis
        _temp_remote_code_file = None
        if code_path and (code_path.startswith("http://") or code_path.startswith("https://")):
            try:
                import urllib.request
                clean_url = code_path.split("?")[0]
                ext = os.path.splitext(clean_url)[1].lower() or ".zip"
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
                    _temp_remote_code_file = tf.name
                    with urllib.request.urlopen(code_path, timeout=60) as resp:
                        tf.write(resp.read())
                code_path = _temp_remote_code_file
            except Exception as err:
                logger.warning(f"Failed to fetch remote code archive {code_path}: {err}")

        # Pre-load ML models on the main thread safely to prevent race conditions during parallel execution
        try:
            from app.ai_engine.ai_code_detector import _get_ml_model
            from app.ai_engine.plagiarism_detector import _get_sbert
            from app.ai_engine.report_code_aligner import _get_spacy
            _get_ml_model()
            _get_sbert()
            _get_spacy()
        except Exception as e:
            logger.warning(f"Failed to pre-load ML models: {e}")

        # Resolve code path — handle zip extraction so the analyzer
        # always receives .py files (it only supports Python files).
        _temp_extract_dir = None  # track for cleanup
        try:
            code_path_obj = Path(code_path)
            if code_path_obj.suffix.lower() == ".zip" and zipfile.is_zipfile(code_path):
                _temp_extract_dir = tempfile.mkdtemp(prefix="aspes_code_extract_")
                py_files = self._extract_py_files(code_path, _temp_extract_dir)
                if py_files:
                    _resolved_code_path = py_files[0]   # primary file for text-based analyses
                    _py_file_list = py_files
                else:
                    _resolved_code_path = code_path
                    _py_file_list = []
            elif code_path_obj.suffix.lower() == ".py":
                _resolved_code_path = code_path
                _py_file_list = [code_path]
            else:
                _resolved_code_path = code_path
                _py_file_list = []
        except Exception as _e:
            logger.warning(f"Code path resolution failed: {_e}")
            _resolved_code_path = code_path
            _py_file_list = []

        # Read source code content cleanly (never raw zip bytes)
        code_content = ""
        if _py_file_list:
            py_contents = []
            for p in _py_file_list:
                try:
                    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                        py_contents.append(f.read())
                except Exception:
                    pass
            if py_contents:
                code_content = "\n\n".join(py_contents)
        if not code_content:
            code_content = self.extract_code_from_path(code_path)

        # 3. Run Ensembles concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Submit code analysis — use analyze_project for multi-file zips,
            # analyze for a single .py file.
            if len(_py_file_list) > 1:
                future_code = executor.submit(self.code_analyzer.analyze_project, _py_file_list)
            elif len(_py_file_list) == 1:
                future_code = executor.submit(self.code_analyzer.analyze, _py_file_list[0])
            else:
                future_code = executor.submit(lambda: {
                    'final_score': 50.0,
                    'grade': 'C',
                    'scores': {
                        'quality': 50.0, 'maintainability': 50.0, 'complexity': 50.0,
                        'security': 50.0, 'documentation': 50.0, 'duplication': 50.0,
                        'type_safety': 50.0,
                    },
                    'quality': 50.0,
                    'maintainability': 50.0,
                    'complexity': 50.0,
                    'clean_code_score':      50.0,
                    'maintainability_index': 50.0,
                    'complexity_score':      50.0,
                    'error': 'No Python (.py) files found — code quality scored as neutral',
                    'code_smells': [],
                    'security_issues': [],
                    'diagnostics': ['⚠️ Non-Python submission: code quality analysis skipped'],
                })
            
            doc_path = project_data.get('doc_file_path', '')
            future_doc = executor.submit(self.doc_evaluator.evaluate, doc_path)
            
            future_ai = executor.submit(self.ai_detector.analyze, code_content, _resolved_code_path)
            
            existing_projects = project_data.get('existing_projects', [])
            if not existing_projects:
                existing_projects = self._fetch_existing_projects_from_db(project_data.get('id'))

            future_plag = executor.submit(self.plagiarism_detector.detect, code_content, existing_projects)

            # Wait for document evaluation to finish so we can extract raw_text for alignment
            try:
                results['doc_evaluation'] = future_doc.result()
            except Exception as e:
                logger.error(f"Doc evaluation failed: {e}")
                results['doc_evaluation'] = {}

            doc_text = results.get('doc_evaluation', {}).get('raw_text', '')
            
            # Now submit alignment analysis
            future_align = executor.submit(
                self.aligner.analyze_alignment,
                report_text=doc_text, 
                code_content=code_content,
                file_paths=_py_file_list if _py_file_list else [_resolved_code_path]
            )

            # Gather remaining results
            try:
                results['code_quality'] = future_code.result()
            except Exception as e:
                logger.error(f"Code analysis failed: {e}")
                results['code_quality'] = {}

            try:
                results['ai_detection'] = future_ai.result()
            except Exception as e:
                logger.error(f"AI detection failed: {e}")
                results['ai_detection'] = {}

            try:
                results['plagiarism'] = future_plag.result()
            except Exception as e:
                logger.error(f"Plagiarism detection failed: {e}")
                results['plagiarism'] = {}

            try:
                results['alignment'] = future_align.result()
            except Exception as e:
                logger.error(f"Alignment analysis failed: {e}")
                results['alignment'] = {}

        # 4. Cleanup temp extraction directory and remote temp code file
        if _temp_extract_dir:
            try:
                shutil.rmtree(_temp_extract_dir, ignore_errors=True)
            except Exception:
                pass
        if _temp_remote_code_file and os.path.exists(_temp_remote_code_file):
            try:
                os.unlink(_temp_remote_code_file)
            except Exception:
                pass

        # 5. Compile Master Score
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
