"""
ASPES - AI Smart Academic Project Evaluation System
FastAPI Application Entry Point - Final Integrated Version
"""
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import auth, projects, evaluations, users, groups, faculty, reports, notifications
from app.database.connection import engine, Base

# Configure Logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("aspes")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup & shutdown events."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Ensure upload directories exist
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.TEMP_DIR).mkdir(parents=True, exist_ok=True)

    # 1. Database Setup
    import app.models  # Registers all models (User, Project, etc.) in Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        from app.database.connection import IS_SQLITE
        if IS_SQLITE:
            def migrate_sqlite_columns(sync_conn):
                try:
                    cursor = sync_conn.connection.cursor()
                    cursor.execute("PRAGMA table_info(evaluations)")
                    existing_cols = [row[1] for row in cursor.fetchall()]
                    if "evaluation_file_url" not in existing_cols:
                        cursor.execute("ALTER TABLE evaluations ADD COLUMN evaluation_file_url VARCHAR(1024)")
                    if "evaluation_file_name" not in existing_cols:
                        cursor.execute("ALTER TABLE evaluations ADD COLUMN evaluation_file_name VARCHAR(255)")
                    if "status_label" not in existing_cols:
                        cursor.execute("ALTER TABLE evaluations ADD COLUMN status_label VARCHAR(100)")
                except Exception as e:
                    logger.warning(f"Column migration check note: {e}")
            await conn.run_sync(migrate_sqlite_columns)
    logger.info("✅ Database tables synced")

    # 2. Seed initial admin and faculty users if not present
    try:
        from app.seed_data import seed_data
        await seed_data()
        logger.info("✅ Database default seed verified")
    except Exception as e:
        logger.warning(f"Seeding note: {e}")

    # 3. Clean up any evaluations left in 'processing' before restart
    try:
        from app.database.connection import AsyncSessionLocal
        from app.models.evaluation import Evaluation, EvaluationStatus
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            stuck_evals = (await db.execute(
                select(Evaluation).where(Evaluation.status == EvaluationStatus.PROCESSING)
            )).scalars().all()

            for ev in stuck_evals:
                logger.info(f"Marking interrupted evaluation {ev.id} as failed (ready for retry)")
                ev.status = EvaluationStatus.FAILED
            if stuck_evals:
                await db.commit()
    except Exception as recover_err:
        logger.warning(f"Orphaned evaluation cleanup note: {recover_err}")

    logger.info(f"CORS Allowed Origins ({type(settings.ALLOWED_ORIGINS)}): {settings.ALLOWED_ORIGINS}")

    # Most heavy work is in Celery. Loading models in API can cause slow startup and high memory.
    # try:
    #     from sentence_transformers import SentenceTransformer
    #     logger.info(f"⏳ Loading SBERT model: {settings.SBERT_MODEL_NAME}...")
    #     _ = SentenceTransformer(settings.SBERT_MODEL_NAME)
    #     logger.info("✅ AI Models warmed up and ready")
    # except Exception as e:
    #     logger.warning(f"⚠️ Failed to warm up AI models: {e}. If this is an API-only node, it might be fine.")

    yield
    
    logger.info("👋 Shutting down ASPES...")
    await engine.dispose()


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered academic project evaluation system with automated code analysis, "
        "plagiarism detection, and Multi-modal AI feedback generation."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ---------------------------------------------------------------------------
# Static Files with Safe Path & Remote Redirect Handler
# ---------------------------------------------------------------------------
class SafeStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        # Intercept accidental remote URL path prefixes (e.g. uploads/https:/... or uploads/https://...)
        clean_path = path.replace("\\", "/")
        if "res.cloudinary.com" in clean_path or clean_path.startswith("http:/") or clean_path.startswith("https:/") or clean_path.startswith("http://") or clean_path.startswith("https://"):
            if "res.cloudinary.com" in clean_path:
                idx = clean_path.find("res.cloudinary.com")
                target_url = "https://" + clean_path[idx:]
            elif clean_path.startswith("https:/") and not clean_path.startswith("https://"):
                target_url = "https://" + clean_path[7:].lstrip("/")
            elif clean_path.startswith("http:/") and not clean_path.startswith("http://"):
                target_url = "http://" + clean_path[6:].lstrip("/")
            else:
                target_url = clean_path

            from app.services.cloudinary_service import CloudinaryService
            cs = CloudinaryService()
            if cs.is_configured() and "cloudinary.com" in target_url:
                target_url = cs.get_download_url(target_url, attachment=False)

            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=target_url, status_code=307)

        try:
            return await super().get_response(path, scope)
        except (OSError, ValueError) as exc:
            logger.warning(f"Static file access error for {path}: {exc}")
            return JSONResponse(
                status_code=404,
                content={"detail": f"File '{path}' not found on server"}
            )

app.mount("/uploads", SafeStaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ---------------------------------------------------------------------------
# Middleware & CORS
# ---------------------------------------------------------------------------
# Configure CORS origins dynamically
cors_origins = (
    list(settings.ALLOWED_ORIGINS)
    if isinstance(settings.ALLOWED_ORIGINS, list)
    else [o.strip() for o in str(settings.ALLOWED_ORIGINS).split(",") if o.strip()]
)
for dev_origin in [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]:
    if dev_origin not in cors_origins:
        cors_origins.append(dev_origin)

if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📥 Request: {request.method} {request.url.path}")
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"📤 Response: {response.status_code} (took {process_time:.4f}s)")
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------
def _get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin and ("vercel.app" in origin or "localhost" in origin or origin in cors_origins):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        }
    return {}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support."},
        headers=_get_cors_headers(request),
    )

from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": "Validation Error", "errors": exc.errors()},
        headers=_get_cors_headers(request),
    )

# ---------------------------------------------------------------------------
# API Routers
# ---------------------------------------------------------------------------
API_V1_STR = "/api/v1"

app.include_router(auth.router,        prefix=f"{API_V1_STR}/auth",        tags=["Authentication"])
app.include_router(users.router,       prefix=f"{API_V1_STR}/users",       tags=["Users"])
app.include_router(projects.router,    prefix=f"{API_V1_STR}/projects",    tags=["Projects"])
app.include_router(evaluations.router, prefix=f"{API_V1_STR}/evaluations", tags=["Evaluations"])
app.include_router(groups.router,      prefix=f"{API_V1_STR}/groups",      tags=["Groups"])
app.include_router(faculty.router,     prefix=f"{API_V1_STR}/faculty-list", tags=["Faculty"])
app.include_router(reports.router,     prefix=f"{API_V1_STR}/projects",      tags=["Reports"])
app.include_router(notifications.router, prefix=f"{API_V1_STR}/notifications", tags=["Notifications"])

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "documentation": "/api/docs",
        "version": settings.APP_VERSION
    }
