import asyncio
import logging
import uuid
import sys
import random
from pathlib import Path
from datetime import datetime, timezone

BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("populate_10")

from populate_and_test import PROJECT_CODE, PROJECT_REPORTS

async def main():
    from app.database.connection import engine, Base, AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.models.project import Project, ProjectStatus
    from app.models.evaluation import Evaluation, EvaluationStatus
    from app.utils.security import get_password_hash
    from sqlalchemy import select
    
    # Ensure tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    uploads_dir = Path("uploads/sample_projects")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    code_files = {}
    for proj_key, code in PROJECT_CODE.items():
        fpath = uploads_dir / f"{proj_key}.py"
        fpath.write_text(code, encoding="utf-8")
        code_files[proj_key] = str(fpath)

    report_files = {}
    for proj_key, report_text in PROJECT_REPORTS.items():
        fpath = uploads_dir / f"{proj_key}_report.txt"
        fpath.write_text(report_text, encoding="utf-8")
        report_files[proj_key] = str(fpath)
        
    async with AsyncSessionLocal() as db:
        # Check for user
        email = "prathamsinhparmar0@gmail.com"
        stmt = select(User).where(User.email == email)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                username="prathamsinh",
                full_name="Pratham",
                hashed_password=get_password_hash("Pratham@123"),
                role=UserRole.STUDENT, # Give Student role so it shows up neatly in Student dashboard
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
            logger.info("Created user prathamsinhparmar0@gmail.com")
        else:
            # Update user full name if requested
            user.full_name = "Pratham"
            # Ensure password is correct
            user.hashed_password = get_password_hash("Pratham@123")
            await db.flush()
            logger.info("Updated existing user prathamsinhparmar0@gmail.com")
            
        await db.commit()
    
    
    base_projects = [
        {"title": "Student Management System", "proj_key": "student_management", "course": "DBMS"},
        {"title": "Digital Library Catalog", "proj_key": "library_catalog", "course": "OOP"},
        {"title": "Retail Inventory Manager", "proj_key": "inventory_manager", "course": "SE"},
        {"title": "Historical Weather Data Analyzer", "proj_key": "weather_analyzer", "course": "DSA"},
        {"title": "Personal Expense Tracker", "proj_key": "expense_tracker", "course": "Python"}
    ]
    
    project_defs = []
    for i in range(10):
        base = base_projects[i % 5]
        project_defs.append({
            "title": f"{base['title']}",
            "description": f"Mock data project number {i+1} based on {base['title']}. Automatically generated for testing layout and analytics.",
            "course_name": base["course"],
            "batch_year": "2024",
            "proj_key": base["proj_key"],
            "owner_email": "prathamsinhparmar0@gmail.com",
        })
        
    created_projects = {}
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.email == "prathamsinhparmar0@gmail.com")
        user = (await db.execute(stmt)).scalar_one_or_none()

        for pd in project_defs:
            stmt = select(Project).where(Project.title == pd["title"], Project.owner_id == user.id)
            existing_proj = (await db.execute(stmt)).scalar_one_or_none()
            if existing_proj:
                created_projects[pd["title"]] = existing_proj
                logger.info(f"Project already exists: {pd['title']}")
            else:
                proj = Project(
                    title=pd["title"],
                    description=pd["description"],
                    course_name=pd["course_name"],
                    batch_year=pd["batch_year"],
                    owner_id=user.id,
                    status=ProjectStatus.SUBMITTED,
                    code_file_path=code_files[pd["proj_key"]],
                    report_file_path=report_files[pd["proj_key"]],
                    submitted_at=datetime.now(timezone.utc),
                )
                db.add(proj)
                await db.flush()
                await db.refresh(proj)
                created_projects[pd["title"]] = proj
                logger.info(f"Created project: {pd['title']}")
        await db.commit()
        
    logger.info("Starting evaluations for mock data...")
    from app.ai_engine.comprehensive_scorer import ComprehensiveScorer
    from app.ai_engine.code_analyzer import CodeAnalyzer
    from app.ai_engine.doc_evaluator import DocumentationEvaluator
    from app.ai_engine.ai_code_detector import AICodeDetector
    from app.ai_engine.report_code_aligner import ReportCodeAligner
    from app.ai_engine.plagiarism_detector import PlagiarismDetectorWithCache
    from app.models.project import ProjectStatus

    scorer = ComprehensiveScorer()
    code_analyzer = CodeAnalyzer()
    doc_evaluator = DocumentationEvaluator()
    ai_detector = AICodeDetector()
    aligner = ReportCodeAligner()
    plagiarism_detector = PlagiarismDetectorWithCache()
    
    for pd in project_defs:
        project = created_projects[pd["title"]]
        proj_key = pd["proj_key"]
        
        logger.info(f"Evaluating: {project.title}")
        
        code_path = code_files[proj_key]
        report_path = report_files[proj_key]

        try:
            code_content = Path(code_path).read_text(encoding="utf-8", errors="ignore")
        except Exception:
            code_content = ""

        results = {}
        try:
            results["code_quality"] = code_analyzer.analyze(code_path)
            # Add some randomness to score
            results["code_quality"]["final_score"] = random.uniform(65.0, 95.0)
        except Exception:
            results["code_quality"] = {"final_score": random.uniform(65.0, 95.0)}

        # Doc evaluation
        results["doc_evaluation"] = {
            "final_score": random.uniform(60.0, 98.0),
            "structure_score": random.uniform(60.0, 100.0),
            "clarity_score": random.uniform(60.0, 100.0),
            "completeness_score": random.uniform(60.0, 100.0)
        }

        # AI detection - let's make some clearly AI generated so flags show up
        ai_score = random.choice([random.uniform(0.05, 0.2), random.uniform(0.7, 0.95)])
        results["ai_detection"] = {
            "verdict": "LIKELY_AI" if ai_score > 0.75 else "HUMAN_WRITTEN", 
            "ai_generated_probability": ai_score,
            "findings": ["Signatures match known AI generation patterns"] if ai_score > 0.75 else ["Code structure appears organic"]
        }
            
        results["alignment"] = {
            "overall_alignment_score": random.uniform(70.0, 99.0), 
            "missing_features": []
        }

        # Plagiarism
        plag_score = random.uniform(60.0, 100.0)
        results["plagiarism"] = {
            "originality_score": plag_score, 
            "flagged": plag_score < 75.0, 
            "max_similarity_percent": 100.0 - plag_score
        }
        
        scoring = scorer.calculate_overall_score(results)
        
        async with AsyncSessionLocal() as db:
            stmt = select(Evaluation).where(Evaluation.project_id == project.id)
            existing_eval = (await db.execute(stmt)).scalar_one_or_none()

            code_q = results.get("code_quality", {})
            doc_q = results.get("doc_evaluation", {})
            plag = results.get("plagiarism", {})
            align = results.get("alignment", {})
            ai_det = results.get("ai_detection", {})
            doc_q_clean = doc_q
            
            ai_feedback_text = (
                f"## AI Evaluation Feedback\n\n"
                f"**Project**: {project.title}\n"
                f"**Final Score**: {scoring['final_score']}/100 ({scoring['letter_grade']})\n"
                f"**Interpretation**: {scoring['score_interpretation']}\n"
                f"**Percentile**: {scoring['percentile']}\n\n"
                f"### Component Breakdown\n"
                + "\n".join([f"- **{k.replace('_', ' ').title()}**: {v:.1f}/100" 
                             for k, v in scoring["component_scores"].items()])
            )

            # fetch user again to safely get their ID
            user_stmt = select(User).where(User.email == "prathamsinhparmar0@gmail.com")
            eval_user = (await db.execute(user_stmt)).scalar_one_or_none()

            if existing_eval:
                existing_eval.status = EvaluationStatus.COMPLETED
                existing_eval.total_score = scoring["final_score"]
                existing_eval.code_quality_score = code_q.get("final_score", 0.0)
                existing_eval.documentation_score = doc_q.get("final_score", 0.0)
                existing_eval.plagiarism_score = plag.get("originality_score", 100.0)
                existing_eval.report_alignment_score = align.get("overall_alignment_score", 0.0)
                existing_eval.ai_code_score = (1.0 - ai_det.get("ai_generated_probability", 0.0)) * 100
                existing_eval.ai_code_detected = ai_det.get("ai_generated_probability", 0.0) > 0.75
                existing_eval.plagiarism_detected = plag.get("flagged", False)
                existing_eval.code_analysis_result = code_q
                existing_eval.doc_evaluation_result = doc_q_clean
                existing_eval.plagiarism_result = plag
                existing_eval.alignment_result = align
                existing_eval.ai_detection_result = ai_det
                existing_eval.ai_feedback = ai_feedback_text
                existing_eval.completed_at = datetime.now(timezone.utc)
            else:
                new_eval = Evaluation(
                    project_id=project.id,
                    evaluator_id=eval_user.id,
                    status=EvaluationStatus.COMPLETED,
                    total_score=scoring["final_score"],
                    code_quality_score=code_q.get("final_score", 0.0),
                    documentation_score=doc_q.get("final_score", 0.0),
                    plagiarism_score=plag.get("originality_score", 100.0),
                    report_alignment_score=align.get("overall_alignment_score", 0.0),
                    ai_code_score=(1.0 - ai_det.get("ai_generated_probability", 0.0)) * 100,
                    ai_code_detected=ai_det.get("ai_generated_probability", 0.0) > 0.75,
                    plagiarism_detected=plag.get("flagged", False),
                    code_analysis_result=code_q,
                    doc_evaluation_result=doc_q_clean,
                    plagiarism_result=plag,
                    alignment_result=align,
                    ai_detection_result=ai_det,
                    ai_feedback=ai_feedback_text,
                    started_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc),
                )
                db.add(new_eval)

            stmt = select(Project).where(Project.id == project.id)
            proj_obj = (await db.execute(stmt)).scalar_one_or_none()
            if proj_obj:
                proj_obj.status = ProjectStatus.EVALUATED

            await db.commit()

        logger.info(f"Finished evaluating: {project.title}")

if __name__ == "__main__":
    asyncio.run(main())
