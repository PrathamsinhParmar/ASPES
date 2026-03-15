
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator

def run_feedback_demo_json():
    with patch('app.ai_engine.feedback_generator.EnhancedFeedbackGenerator._setup_client', return_value=None):
        generator = EnhancedFeedbackGenerator()
        generator.client = None 

        mock_analysis_results = {
            "code_quality": {
                "final_score": 72.5,
                "complexity_score": 65,
                "maintainability_score": 75,
                "details": {"pylint_issues": ["W0611: Unused import"]}
            },
            "doc_evaluation": {
                "final_score": 88.0,
                "completeness": 92,
                "clarity": 85,
                "missing_sections": ["Architecture Diagram"]
            },
            "alignment": {
                "overall_alignment_score": 95.0,
                "mismatches": [],
                "missing_features": []
            },
            "ai_detection": {
                "verdict": "HUMAN_WRITTEN",
                "ai_generated_probability": 0.08,
                "flags": []
            },
            "plagiarism": {
                "originality_score": 100.0,
                "max_similarity_percent": 2.5,
                "risk_level": "LOW"
            }
        }

        results = generator.generate_comprehensive_feedback(mock_analysis_results)
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_feedback_demo_json()
