
import sys
import os
import json

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai_engine.comprehensive_scorer import ComprehensiveScorer

def run_comprehensive_score_demo():
    scorer = ComprehensiveScorer()

    print("\n" + "="*60)
    print("   AI ENGINE: COMPREHENSIVE SCORER DEMO")
    print("="*60)

    # 1. Define Mock Input Data
    # This simulates the dictionary returned by all sub-engines after analysis
    mock_analysis_results = {
        'code_quality': {
            'final_score': 88.5,
            'maintainability': 92.0,
            'complexity': 12.0
        },
        'doc_evaluation': {
            'final_score': 94.0,
            'missing_sections': []
        },
        'alignment': {
            'overall_alignment_score': 96.0,
            'missing_features': []
        },
        'plagiarism': {
            'originality_score': 100.0,
            'flagged': False,
            'max_similarity_percent': 0.0
        },
        'ai_detection': {
            'ai_generated_probability': 0.05,
            'verdict': 'HUMAN_WRITTEN'
        },
        'functionality': {
            'score': 100.0
        }
    }

    print(f"\n[STEP 1] Running Scorer for a High-Quality Project...")
    
    # 2. Calculate Score
    results = scorer.calculate_overall_score(mock_analysis_results)

    # 3. Display Results
    print("\n[STEP 2] Comprehensive Score Results:")
    print(f"Final Score:    {results['final_score']} / 100")
    print(f"Letter Grade:   {results['letter_grade']}")
    print(f"Risk Level:     {results['score_interpretation']}")
    print(f"Percentile:     {results['percentile']}")

    print("\n[STEP 3] Component Breakdown:")
    for comp, score in results['component_scores'].items():
        weight = scorer.weights[comp] * 100
        contribution = results['weighted_contributions'][comp]
        print(f" - {comp:22}: {score:>6.2f} (Weight: {weight:>2.0f}%, Contribution: {contribution:>6.2f})")

    if results['bonuses']:
        print("\n[BONUSES APPLIED]")
        for b in results['bonuses']:
            print(f" + {b['reason']} ({b['amount']:+.1f})")

    if results['penalties']:
        print("\n[PENALTIES APPLIED]")
        for p in results['penalties']:
            print(f" - {p['reason']} ({p['amount']:+.1f})")

    print("\n" + "="*60 + "\n")

    # 4. Another Scenario: Plagiarized/AI-Heavy project
    print("\n" + "="*60)
    print("   SCENARIO 2: LOW QUALITY / SUSPICIOUS PROJECT")
    print("="*60)

    suspicious_results = {
        'code_quality': {'final_score': 45.0},
        'doc_evaluation': {'final_score': 60.0},
        'alignment': {'overall_alignment_score': 35.0, 'missing_features': ['FeatureA', 'FeatureB']},
        'plagiarism': {'originality_score': 20.0, 'flagged': True, 'max_similarity_percent': 85.0},
        'ai_detection': {'ai_generated_probability': 0.9, 'verdict': 'LIKELY_AI'},
        'functionality': {'score': 40.0}
    }

    results_2 = scorer.calculate_overall_score(suspicious_results)

    print(f"Final Score:    {results_2['final_score']} / 100")
    print(f"Letter Grade:   {results_2['letter_grade']}")
    
    print("\n[PENALTIES APPLIED]")
    for p in results_2['penalties']:
        print(f" [!] {p['reason']} ({p['amount']:+.1f})")

    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    run_comprehensive_score_demo()
