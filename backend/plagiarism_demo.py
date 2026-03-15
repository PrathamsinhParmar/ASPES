
import sys
import os
import json
from unittest.mock import MagicMock, patch

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai_engine.plagiarism_detector import PlagiarismDetector

def run_plagiarism_demo():
    # 1. Initialize detector
    # We will patch _get_sbert to return None so the demo runs 
    # anywhere using the heuristic fallback (Jaccard similarity).
    with patch('app.ai_engine.plagiarism_detector._get_sbert', return_value=None):
        detector = PlagiarismDetector()

        print("\n" + "="*50)
        print("   AI ENGINE: PLAGIARISM DETECTION DEMO")
        print("="*50)

        # 2. Define Mock Data
        
        # Current submission being evaluated
        current_submission = """
def calculate_area(radius):
    import math
    # Calculate the area of a circle
    pi_val = math.pi
    area = pi_val * (radius ** 2)
    print(f"The area is: {area}")
    return area
"""

        # Database of existing projects (Mock Data)
        existing_projects = [
            {
                "id": 101,
                "student_name": "John Doe",
                "code": """
# Simple function to get circle area
def get_circle_area(r):
    import math
    res = 3.14159 * r * r
    return res
"""  
            },
            {
                "id": 102,
                "student_name": "Jane Smith",
                "code": """
def calculate_area(radius):
    import math
    # Calculate the area of a circle
    pi_val = math.pi
    area = pi_val * (radius ** 2)
    return area
"""  
            },
            {
                "id": 103,
                "student_name": "Alice Wonderland",
                "code": """
def process_user_data(user_list):
    for user in user_list:
        print(user.name)
"""  
            }
        ]

        print(f"\n[STEP 1] Running detection for new submission...")
        print(f"Target Code snippet (truncated): {current_submission.strip()[:60]}...")
        
        # 3. Execute Detection
        results = detector.detect(current_submission, existing_projects)

        # 4. Show JSON Results
        print("\n[STEP 2] Raw JSON Results:")
        print(json.dumps(results, indent=2))

        # 5. Show Generated Report
        print("\n[STEP 3] Human-Readable Report:")
        report = detector.generate_detailed_report(results)
        print(report)
        print("="*50 + "\n")

if __name__ == "__main__":
    run_plagiarism_demo()
