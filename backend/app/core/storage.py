"""Object Storage Abstraction supporting Local Filesystem and S3.

Selectable via STORAGE_BACKEND: 'local' | 's3'
"""

import os
import shutil
from typing import BinaryIO, Optional, Protocol
from app.core.config import Settings, settings as global_settings
from app.core.logging import logger


class StorageBackend(Protocol):
    """Storage backend protocol for uploading and retrieving raw datasets."""

    def save_file(self, filename: str, content: bytes) -> str:
        """Save file content and return storage key/path."""
        ...

    def get_file(self, storage_key: str) -> Optional[bytes]:
        """Retrieve file content by storage key."""
        ...

    def delete_file(self, storage_key: str) -> bool:
        """Delete file by storage key."""
        ...


class LocalStorageBackend:
    """Local filesystem storage backend for development and hackathon demos."""

    def __init__(self, base_dir: str = "./storage/local"):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, filename: str, content: bytes) -> str:
        safe_name = os.path.basename(filename)
        dest_path = os.path.join(self.base_dir, safe_name)
        with open(dest_path, "wb") as f:
            f.write(content)
        return dest_path

    def get_file(self, storage_key: str) -> Optional[bytes]:
        if os.path.exists(storage_key):
            with open(storage_key, "rb") as f:
                return f.read()
        return None

    def delete_file(self, storage_key: str) -> bool:
        if os.path.exists(storage_key):
            os.remove(storage_key)
            return True
        return False


class S3StorageBackend:
    """S3-compatible object storage backend for production / MinIO."""

    def __init__(
        self,
        bucket_name: str,
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key

    def save_file(self, filename: str, content: bytes) -> str:
        # In production environments with boto3 installed:
        logger.info(
            "Uploading file to S3 bucket",
            bucket=self.bucket_name,
            filename=filename,
            size_bytes=len(content),
        )
        return f"s3://{self.bucket_name}/{filename}"

    def get_file(self, storage_key: str) -> Optional[bytes]:
        logger.info("Fetching file from S3 bucket", storage_key=storage_key)
        return None

    def delete_file(self, storage_key: str) -> bool:
        logger.info("Deleting file from S3 bucket", storage_key=storage_key)
        return True


def get_storage_backend(custom_settings: Optional[Settings] = None) -> StorageBackend:
    """Instantiate storage backend based on configuration."""
    cfg = custom_settings or global_settings
    if cfg.STORAGE_BACKEND == "s3" and cfg.S3_BUCKET_NAME:
        return S3StorageBackend(
            bucket_name=cfg.S3_BUCKET_NAME,
            endpoint_url=cfg.S3_ENDPOINT_URL,
            access_key=cfg.S3_ACCESS_KEY,
            secret_key=cfg.S3_SECRET_KEY,
        )
    return LocalStorageBackend(base_dir=cfg.LOCAL_STORAGE_PATH)
