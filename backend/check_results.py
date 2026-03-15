"""Quick DB verification script - run after populate_and_test.py"""
import asyncio
import sys, os
from pathlib import Path

BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

from app.database.connection import AsyncSessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.evaluation import Evaluation, EvaluationStatus
from sqlalchemy import select

GRADE_SCALE = [
    ('A+', 97.0), ('A', 93.0), ('A-', 90.0),
    ('B+', 87.0), ('B', 83.0), ('B-', 80.0),
    ('C+', 77.0), ('C', 73.0), ('C-', 70.0),
    ('D+', 67.0), ('D', 63.0), ('D-', 60.0), ('F', 0.0)
]

def get_grade(score):
    if score is None:
        return "N/A"
    for g, threshold in GRADE_SCALE:
        if score >= threshold:
            return g
    return "F"

async def report():
    async with AsyncSessionLocal() as db:
        users    = (await db.execute(select(User))).scalars().all()
        projects = (await db.execute(select(Project))).scalars().all()
        evals    = (await db.execute(select(Evaluation))).scalars().all()

        proj_map = {str(p.id): p for p in projects}

        print("\n" + "="*65)
        print("  USERS IN DATABASE")
        print("="*65)
        for u in users:
            print(f"  [{u.role.value:<10}] {u.full_name:<30} {u.email}")

        print("\n" + "="*65)
        print("  PROJECTS IN DATABASE")
        print("="*65)
        for p in projects:
            print(f"  [{p.status.value:<20}] {p.title}")
            print(f"    Course: {p.course_name}  |  Batch: {p.batch_year}")

        print("\n" + "="*65)
        print("  EVALUATION RESULTS")
        print("="*65)
        scores = []
        for e in evals:
            proj = proj_map.get(str(e.project_id))
            proj_title = proj.title if proj else "Unknown Project"
            grade = get_grade(e.total_score)
            score_s = f"{e.total_score:.2f}" if e.total_score else "N/A"
            print(f"\n  Project : {proj_title}")
            print(f"  Status  : {e.status.value}  |  Score: {score_s}/100  |  Grade: {grade}")
            print(f"  Scores  -> Code: {e.code_quality_score or 0:.1f}  "
                  f"Doc: {e.documentation_score or 0:.1f}  "
                  f"Plagiarism-Orig: {e.plagiarism_score or 0:.1f}  "
                  f"Alignment: {e.report_alignment_score or 0:.1f}  "
                  f"AI-Auth: {e.ai_code_score or 0:.1f}")
            print(f"  Flags   -> AI Detected: {'YES [!]' if e.ai_code_detected else 'No [OK]'}  "
                  f"| Plagiarism: {'YES [!]' if e.plagiarism_detected else 'No [OK]'}")
            if e.total_score:
                scores.append(e.total_score)

        print("\n" + "="*65)
        print("  SUMMARY")
        print("="*65)
        print(f"  Total Users       : {len(users)}")
        print(f"  Total Projects    : {len(projects)}")
        print(f"  Total Evaluations : {len(evals)}")
        completed = [e for e in evals if e.status == EvaluationStatus.COMPLETED]
        print(f"  Completed Evals   : {len(completed)}")
        if scores:
            print(f"  Average Score     : {sum(scores)/len(scores):.2f}/100")
            print(f"  Highest Score     : {max(scores):.2f}/100   ({get_grade(max(scores))})")
            print(f"  Lowest Score      : {min(scores):.2f}/100   ({get_grade(min(scores))})")

        print("\n  LOGIN CREDENTIALS")
        print(f"  Admin   : prathamsinhparmar0@gmail.com / Pratham@123")
        print(f"  Faculty : prof.mehta@aspes.edu / Faculty@123")
        print(f"  Student : arjun.kumar@student.edu / Student@123")
        print(f"  Student : priya.patel@student.edu / Student@123")
        print(f"  Student : rahul.sharma@student.edu / Student@123")
        print(f"  Student : sneha.joshi@student.edu / Student@123")
        print("="*65 + "\n")

asyncio.run(report())
