import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash

# Use in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh test database for each test."""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    
    Base.metadata.create_all(bind=engine)
    
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestingSessionLocal()
    
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_db):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def admin_token(client, test_db):
    """Create an admin user and return access token."""
    from app import models, auth
    
    # Create admin user directly in DB
    admin = models.User(
        username="admin",
        hashed_password=get_password_hash("admin"),
        role="admin",
    )
    test_db.add(admin)
    test_db.commit()
    
    # Login and get token
    response = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "admin"}
    )
    return response.json()["access_token"]


@pytest.fixture
def operator_token(client, test_db):
    """Create an operator user and return access token."""
    from app import models, auth
    
    # Create operator user directly in DB
    operator = models.User(
        username="operator",
        hashed_password=get_password_hash("operator123"),
        role="operator",
    )
    test_db.add(operator)
    test_db.commit()
    
    # Login and get token
    response = client.post(
        "/api/auth/token",
        data={"username": "operator", "password": "operator123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    """Return authorization headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def operator_headers(operator_token):
    """Return authorization headers with operator token."""
    return {"Authorization": f"Bearer {operator_token}"}
