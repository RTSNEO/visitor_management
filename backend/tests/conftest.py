import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash
from app import models

# Use in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    """Create test database engine (session scope)."""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture
def db_session(engine):
    """Create a new database session for each test with transaction isolation."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session):
    """Create test client with test database session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session: Session):
    """Create and return admin user with default access levels."""
    # Create default access levels if they don't exist
    if db_session.query(models.AccessLevel).count() == 0:
        default_levels = [
            models.AccessLevel(name="Lobby Only", lenel_id="LOBBY_100", description="Access to lobby area"),
            models.AccessLevel(name="Standard Visitor", lenel_id="VISITOR_200", description="Access to meeting rooms"),
            models.AccessLevel(name="VIP", lenel_id="VIP_300", description="Escorted all access"),
        ]
        db_session.add_all(default_levels)
        db_session.commit()
    
    admin = models.User(
        username="admin",
        hashed_password=get_password_hash("admin"),
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def operator_user(db_session: Session):
    """Create and return operator user."""
    operator = models.User(
        username="operator",
        hashed_password=get_password_hash("operator123"),
        role="operator",
    )
    db_session.add(operator)
    db_session.commit()
    db_session.refresh(operator)
    return operator


@pytest.fixture
def admin_token(client: TestClient, admin_user):
    """Get admin auth token."""
    response = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def operator_token(client: TestClient, operator_user):
    """Get operator auth token."""
    response = client.post(
        "/api/auth/token",
        data={"username": "operator", "password": "operator123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    """Return authorization headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def operator_headers(operator_token):
    """Return authorization headers with operator token."""
    return {"Authorization": f"Bearer {operator_token}"}


# Fixtures for direct database access
@pytest.fixture
def test_db(db_session: Session):
    """Alias for db_session for backward compatibility."""
    return db_session
