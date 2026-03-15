import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

# Clear GEMINI config so it forces the fallback template logic first
os.environ["GEMINI_API_KEY"] = ""

from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator

fb = EnhancedFeedbackGenerator()

sample_results = {
    "code_quality": {
        "final_score": 65.0,
        "complexity_score": 50.0,
        "maintainability_score": 70.0,
    },
    "doc_evaluation": {
        "final_score": 85.0,
        "completeness": 100,
        "clarity": 70,
    },
    "alignment": {
        "overall_alignment_score": 55.0,
        "mismatches": ["Flask mentioned but FastAPI used"],
        "missing_features": ["get_user"]
    },
    "ai_detection": {
        "verdict": "LIKELY_AI_GENERATED",
        "ai_generated_probability": 0.95,
        "flags": ["Perfect comments"]
    },
    "plagiarism": {
        "originality_score": 40.0,
        "max_similarity_percent": 60.0,
        "risk_level": "LOW"
    }
}

result = fb.generate_comprehensive_feedback(sample_results)

print("--- STRUCTURED FEEDBACK ---")
print("Overall   :", result["structured_feedback"]["overall_assessment"])
print("Originality:", result["structured_feedback"]["originality_feedback"])
print("Strengths :", result["structured_feedback"]["strengths"])
print("Improvs   :", result["structured_feedback"]["improvement_suggestions"])
print("\n--- ACTION ITEMS ---")
for a in result["structured_feedback"]["action_items"]:
    print(f"[{a['priority']}] {a['action']} (Est: {a['estimated_time']})")

print("\n--- TIME & PRIORITY ---")
print("Priority Items:", result["priority_items"])
print("Est Time      :", result["estimated_improvement_time"])

print("\n--- FALLBACK NARRATIVE ---")
print(result["narrative_feedback"])

print("\n--- EnhancedFeedbackGenerator OK ---")
