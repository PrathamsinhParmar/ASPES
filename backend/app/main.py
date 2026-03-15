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

from app.config import settings
from app.api import auth, projects, evaluations, users
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
    async with engine.begin() as conn:
        # In production, use alembic upgrade head
        # For dev, we ensure tables exist
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables synced")
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
# Middleware & CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support."},
    )

from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": "Validation Error", "errors": exc.errors()},
    )

# ---------------------------------------------------------------------------
# API Routers
# ---------------------------------------------------------------------------
API_V1_STR = "/api/v1"

app.include_router(auth.router,        prefix=f"{API_V1_STR}/auth",        tags=["Authentication"])
app.include_router(users.router,       prefix=f"{API_V1_STR}/users",       tags=["Users"])
app.include_router(projects.router,    prefix=f"{API_V1_STR}/projects",    tags=["Projects"])
app.include_router(evaluations.router, prefix=f"{API_V1_STR}/evaluations", tags=["Evaluations"])

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
