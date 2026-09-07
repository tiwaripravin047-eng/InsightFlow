"""Core configuration module for Feedback Intelligence OS."""
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Union
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

    # Database & Redis
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/feedback_os"
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PROTOCOL: int = 2  # Compatible with Redis 5+ on Windows and Redis 7 on Linux

    # LLM Configuration
    LLM_PROVIDER: str = "local"
    LLM_API_KEY: str = ""
    LOCAL_LLM_ENDPOINT: str = "http://localhost:11434/v1"

    # ML Model Configuration
    SENTIMENT_MODEL_NAME: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    TOPIC_MIN_TOPIC_SIZE: int = 3

    # Ingestion Limits
    UPLOAD_MAX_MB: int = 25
    UPLOAD_MAX_ROWS: int = 100000

    # Security & CORS
    CORS_ORIGINS: Union[List[str], str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    JWT_SECRET: str = "hackathon-dev-secret-key-32-chars-long"

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

    def model_post_init(self, __context: Any) -> None:
        super().model_post_init(__context)
        yaml_path = find_analytics_config_path()
        self.analytics = load_yaml_config(yaml_path)



@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
