"""Core configuration module for Feedback Intelligence OS."""
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import yaml
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_analytics_config_path() -> Path:
    """Find the analytics_config.yaml file path."""
    candidates = [
        Path("analytics_config.yaml"),
        Path("backend/analytics_config.yaml"),
        Path(__file__).resolve().parent.parent.parent.parent / "analytics_config.yaml",
        Path(__file__).resolve().parent.parent.parent / "analytics_config.yaml",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return Path("analytics_config.yaml")


def load_yaml_config(path: Path) -> Dict[str, Any]:
    """Load configuration from a YAML file."""
    if path.is_file():
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


class Settings(BaseSettings):
    """Application settings combining env vars and YAML config."""
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    PROJECT_NAME: str = "Feedback Intelligence OS"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database & Redis
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/feedback_os"
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PROTOCOL: int = 2  # Compatible with Redis 5+ on Windows and Redis 7 on Linux

    # LLM Configuration (Track C)
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 1000
    LOCAL_LLM_ENDPOINT: str = "http://localhost:11434/v1"
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_MAX_RETRIES: int = 3
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # ML Model Configuration (Track A)
    SENTIMENT_MODEL_NAME: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    TOPIC_MIN_TOPIC_SIZE: int = 3

    # Storage Backend Configuration (Track C)
    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_PATH: str = "./storage/local"
    S3_BUCKET_NAME: Optional[str] = "feedback-intelligence-uploads"
    S3_ENDPOINT_URL: Optional[str] = "https://s3.amazonaws.com"
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None

    # Ingestion Limits
    UPLOAD_MAX_MB: int = 25
    UPLOAD_MAX_ROWS: int = 100000

    # Security & CORS
    CORS_ORIGINS: Union[List[str], str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    JWT_SECRET: str = "hackathon-dev-secret-key-32-chars-long"

    # Parallel Dev Stub Policy (Track C)
    USE_ANALYTICS_STUB: bool = False

    # Analytics configuration dictionary (loaded from analytics_config.yaml)
    analytics: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                return json.loads(v_str)
            return [orig.strip() for orig in v_str.split(",") if orig.strip()]
        if isinstance(v, (list, tuple, set)):
            return [str(item) for item in v]
        return []

    @property
    def cors_origin_list(self) -> List[str]:
        """Return allowed CORS origins as a list of strings."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]
        return []

    def model_post_init(self, __context: Any) -> None:
        super().model_post_init(__context)
        yaml_path = find_analytics_config_path()
        self.analytics = load_yaml_config(yaml_path)


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


# Singleton instance for direct import across modules
settings = get_settings()
