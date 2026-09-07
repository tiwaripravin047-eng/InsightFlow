"""Pytest configuration and shared fixtures."""
import pytest
from app.db.session import engine, Base


@pytest.fixture(autouse=True, scope="session")
def setup_test_tables():
    """Ensure database tables exist for test suite execution."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield
