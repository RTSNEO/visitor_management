import pytest
from app.auth import verify_password, get_password_hash


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password(self):
        """Test that passwords are hashed correctly."""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        # Hash should be different from original
        assert hashed != password
        # Hash should be deterministic in verification
        assert verify_password(password, hashed)
    
    def test_verify_correct_password(self):
        """Test that correct password verifies successfully."""
        password = "mySecurePassword"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Test that incorrect password fails verification."""
        password = "mySecurePassword"
        wrong_password = "wrongPassword"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    def test_login_success(self, client, test_db):
        """Test successful login."""
        from app import models
        from app.auth import get_password_hash
        
        # Create test user
        user = models.User(
            username="testuser",
            hashed_password=get_password_hash("testpass123"),
            role="operator",
        )
        test_db.add(user)
        test_db.commit()
        
        # Test login
        response = client.post(
            "/api/auth/token",
            data={"username": "testuser", "password": "testpass123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_username(self, client):
        """Test login with invalid username."""
        response = client.post(
            "/api/auth/token",
            data={"username": "nonexistent", "password": "password123"}
        )
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_login_invalid_password(self, client, test_db):
        """Test login with invalid password."""
        from app import models
        from app.auth import get_password_hash
        
        # Create test user
        user = models.User(
            username="testuser",
            hashed_password=get_password_hash("correctpass"),
            role="operator",
        )
        test_db.add(user)
        test_db.commit()
        
        # Try to login with wrong password
        response = client.post(
            "/api/auth/token",
            data={"username": "testuser", "password": "wrongpass"}
        )
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_get_current_user(self, client, admin_token):
        """Test getting current user info."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["role"] == "admin"
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
