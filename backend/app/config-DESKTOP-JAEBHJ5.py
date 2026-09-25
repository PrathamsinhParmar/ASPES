"""
Application configuration - reads from environment variables using pydantic-settings.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "ASPES - AI Smart Academic Project Evaluation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_TASK_TIMEOUT: int = 3600
    CELERY_WORKER_CONCURRENCY: int = 4

    # Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_MAX_TOKENS: int = 2000
    GEMINI_TEMPERATURE: float = 0.7

    # Feedback LLM — provider chain
    FEEDBACK_LLM_PRIMARY_PROVIDER: str = "gemini"
    FEEDBACK_LLM_FALLBACK_PROVIDER: str = "groq"
    
    # Gemini free tier
    GEMINI_FREE_TIER_RPM: int = 10
    GEMINI_FREE_TIER_RPD: int = 1500
    
    # Groq free tier
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FREE_TIER_RPM: int = 30
    GROQ_FREE_TIER_RPD: int = 1000
    
    # Generation
    FEEDBACK_MAX_OUTPUT_TOKENS: int = 8192
    FEEDBACK_PROMPT_VERSION: str = "v2.0"
    
    # Content budgets
    FEEDBACK_CODE_BUDGET_CHARS: int = 32_000
    FEEDBACK_REPORT_BUDGET_CHARS: int = 8_000
    
    # Cache
    FEEDBACK_CACHE_TTL_SECONDS: int = 604_800  # 7 days
    
    # Upload limits specific to feedback
    FEEDBACK_MAX_ZIP_SIZE_BYTES: int = 104_857_600   # 100 MB
    FEEDBACK_MAX_ZIP_FILES: int = 500
    FEEDBACK_MAX_REPORT_SIZE_BYTES: int = 10_485_760  # 10 MB

    # Sentence-BERT
    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"
    SBERT_CACHE_DIR: str = "./models/sbert"

    # Thresholds
    AI_CODE_DETECTION_THRESHOLD: float = 0.75
    PLAGIARISM_THRESHOLD: float = 0.80

    # File uploads
    MAX_UPLOAD_SIZE: int = 52_428_800  # 50 MB
    ALLOWED_EXTENSIONS: str = "pdf,docx,py,java,cpp,c,js,ts,zip"
    UPLOAD_DIR: str = "./uploads"
    TEMP_DIR: str = "./uploads/temp"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    FROM_EMAIL: str = "noreply@aspes.edu"
    FROM_NAME: str = "ASPES System"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_FILE: str = "./logs/aspes.log"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
