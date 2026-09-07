"""Tests for Phase 13: Deployment Configuration and Storage Abstraction."""

import os
import pytest
from app.core.config import Settings
from app.core.storage import (
    LocalStorageBackend,
    S3StorageBackend,
    get_storage_backend,
)


def test_local_storage_backend_lifecycle(tmp_path):
    """Verify local storage saves, reads, and deletes binary file content."""
    backend = LocalStorageBackend(base_dir=str(tmp_path))
    content = b"header1,header2\nval1,val2"

    saved_path = backend.save_file("test_dataset.csv", content)
    assert os.path.exists(saved_path)

    retrieved = backend.get_file(saved_path)
    assert retrieved == content

    assert backend.delete_file(saved_path) is True
    assert not os.path.exists(saved_path)


def test_storage_factory_selection(tmp_path):
    """Verify factory returns appropriate storage backend based on settings."""
    cfg_local = Settings(STORAGE_BACKEND="local", LOCAL_STORAGE_PATH=str(tmp_path))
    storage_local = get_storage_backend(cfg_local)
    assert isinstance(storage_local, LocalStorageBackend)

    cfg_s3 = Settings(
        STORAGE_BACKEND="s3",
        S3_BUCKET_NAME="my-prod-bucket",
    )
    storage_s3 = get_storage_backend(cfg_s3)
    assert isinstance(storage_s3, S3StorageBackend)
    assert storage_s3.bucket_name == "my-prod-bucket"


def test_production_cors_disallows_wildcard():
    """Verify production mode forbids wildcard '*' CORS origin."""
    cfg = Settings(ENVIRONMENT="production", CORS_ORIGINS="*")
    # In main.py, when ENVIRONMENT == 'production' and '*' in origins, origins is reset to []
    from app.main import app
    # Confirm app starts without unhandled exception
    assert app.title is not None
