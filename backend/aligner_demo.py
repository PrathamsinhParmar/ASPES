
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai_engine.report_code_aligner import ReportCodeAligner

def run_aligner_demo():
    # 1. Initialize aligner with mocks for heavy models
    # We patch _get_sbert and _get_spacy to avoid environment issues during demo
    with patch('app.ai_engine.report_code_aligner._get_sbert', return_value=None), \
         patch('app.ai_engine.report_code_aligner._get_spacy', return_value=None):
        
        aligner = ReportCodeAligner()

        print("\n" + "="*60)
        print("   AI ENGINE: REPORT-CODE ALIGNMENT DEMO")
        print("="*60)

        # 2. Define Mock Data
        
        # A realistic project report
        mock_report = """
        # AI-Powered Health Tracker
        This project is a health monitoring system built with FastAPI and PostgreSQL.
        We implemented a user_authentication module and a data_analysis function.
        The architecture follows a Clean Architecture pattern with a dedicated service layer.
        We use NumPy for processing health metrics.
        """

        # Realistic source code that matches the report
        mock_code = """
import fastapi
import numpy as np

# Database models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)

def user_authentication(email, password):
    \"\"\"Verifies user credentials.\"\"\"
    return True

def data_analysis(metrics):
    \"\"\"Processes health metrics using numpy.\"\"\"
    arr = np.array(metrics)
    return arr.mean()

@app.get("/health")
def health_endpoint():
    return {"status": "ok"}
"""

        print(f"\n[STEP 1] Input Report Data:")
        print("-" * 30)
        print(mock_report.strip())
        print("-" * 30)

        print(f"\n[STEP 2] Running Alignment Analysis...")
        
        # 3. Execute Analysis
        results = aligner.analyze_alignment(mock_report, mock_code)

        # 4. Display Results
        print("\n[STEP 3] Alignment Analysis Results:")
        print(f"Overall Alignment Score: {results['overall_alignment_score']}%")
        print(f"Alignment Level:         {results['alignment_level']}")
        
        print("\n--- Feature Alignment ---")
        fa = results['detailed_results']['feature_alignment']
        print(f"Match Rate: {fa['match_rate']}")
        print(f"Matched:    {fa['matched_features']}")
        if fa['unmatched_features']:
            print(f"Unmatched:  {fa['unmatched_features']}")

        print("\n--- Technology Alignment ---")
        ta = results['detailed_results']['technology_alignment']
        print(f"Verified Tech: {ta['verified_technologies']}")
        if ta['unverified_technologies']:
            print(f"Missing Tech:  {ta['unverified_technologies']}")

        print("\n--- Architectural Findings ---")
        for finding in results['detailed_results']['architecture_alignment']['findings']:
            print(f" - {finding}")

        if results['mismatches']:
            print("\n!!! MISMATCHES DETECTED !!!")
            for m in results['mismatches']:
                print(f" [!] {m}")

        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    run_aligner_demo()
