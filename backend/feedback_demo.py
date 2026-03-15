
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator

def run_feedback_demo():
    # 1. Initialize generator with mocks for the LLM API
    # This ensures the demo runs instantly and shows the structured fallback logic
    with patch('app.ai_engine.feedback_generator.EnhancedFeedbackGenerator._setup_client', return_value=None):
        generator = EnhancedFeedbackGenerator()
        generator.client = None # Force fallback mode for the demo

        print("\n" + "="*60)
        print("   AI ENGINE: ENHANCED FEEDBACK GENERATOR DEMO")
        print("="*60)

        # 2. Define Mock Analysis Data (Simulating a real evaluation payload)
        mock_analysis_results = {
            "code_quality": {
                "final_score": 72.5,
                "complexity_score": 65,
                "maintainability_score": 75,
                "details": {"pylint_issues": ["W0611: Unused import", "C0103: Invalid name"]}
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

        print(f"\n[STEP 1] Generating Feedback for Analysis Profile...")
        
        # 3. Execute Analysis
        results = generator.generate_comprehensive_feedback(mock_analysis_results)

        # 4. Display Narrative Results
        print("\n[STEP 2] Narrative Feedback (Professor Style):")
        print("-" * 50)
        print(results['narrative_feedback'])
        print("-" * 50)

        # 5. Display Structured Components
        print("\n[STEP 3] Structured Assessment Details:")
        sf = results['structured_feedback']
        print(f"Overall Summary: {sf['overall_assessment']}")
        print(f"Code Quality:    {sf['code_quality_feedback']}")
        print(f"Documentation:   {sf['documentation_feedback']}")
        print(f"Originality:     {sf['originality_feedback']}")

        # 6. Action Items & Timeline
        print("\n[STEP 4] Action Plan & Recommended Roadmap:")
        print(f"Estimated Time to Fix: {results['estimated_improvement_time']}")
        for item in results['priority_items']:
            print(f" - {item}")

        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    run_feedback_demo()
