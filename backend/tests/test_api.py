import pytest
from datetime import datetime, timedelta
from app import models


class TestUserManagement:
    """Test user management endpoints."""
    
    def test_list_users_admin(self, client, auth_headers, test_db):
        """Test listing users as admin."""
        response = client.get("/api/users", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least admin user
    
    def test_list_users_forbidden_for_operator(self, client, operator_headers):
        """Test that operators cannot list users."""
        response = client.get("/api/users", headers=operator_headers)
        
        assert response.status_code == 403
    
    def test_create_user(self, client, auth_headers, test_db):
        """Test creating a new user as admin."""
        new_user = {
            "username": "newoperator",
            "password": "newpass123",
            "role": "operator"
        }
        
        response = client.post(
            "/api/users",
            json=new_user,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newoperator"
        assert data["role"] == "operator"
    
    def test_create_duplicate_user(self, client, auth_headers, test_db):
        """Test creating duplicate user fails."""
        new_user = {
            "username": "admin",
            "password": "admin123",
            "role": "operator"
        }
        
        response = client.post(
            "/api/users",
            json=new_user,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_create_user_forbidden_for_operator(self, client, operator_headers):
        """Test that operators cannot create users."""
        new_user = {
            "username": "newuser",
            "password": "pass123",
            "role": "operator"
        }
        
        response = client.post(
            "/api/users",
            json=new_user,
            headers=operator_headers
        )
        
        assert response.status_code == 403
    
    def test_update_user(self, client, auth_headers, test_db):
        """Test updating a user as admin."""
        # Create a user first
        from app.auth import get_password_hash
        
        user = models.User(
            username="updatetest",
            hashed_password=get_password_hash("oldpass"),
            role="operator",
        )
        test_db.add(user)
        test_db.commit()
        user_id = user.id
        
        # Update the user
        update_data = {
            "username": "updatetest_renamed",
            "password": "newpass123"
        }
        
        response = client.put(
            f"/api/users/{user_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updatetest_renamed"
    
    def test_delete_user(self, client, auth_headers, test_db):
        """Test deleting a user as admin."""
        from app.auth import get_password_hash
        
        user = models.User(
            username="deletetest",
            hashed_password=get_password_hash("pass"),
            role="operator",
        )
        test_db.add(user)
        test_db.commit()
        user_id = user.id
        
        # Delete the user
        response = client.delete(
            f"/api/users/{user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        # Verify deletion
        deleted_user = test_db.query(models.User).filter(
            models.User.id == user_id
        ).first()
        assert deleted_user is None
    
    def test_cannot_delete_default_admin(self, client, auth_headers, test_db):
        """Test that the default admin user cannot be deleted."""
        admin = test_db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        response = client.delete(
            f"/api/users/{admin.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Cannot delete default admin user" in response.json()["detail"]


class TestAccessLevels:
    """Test access level endpoints."""
    
    def test_get_access_levels(self, client, admin_token):
        """Test getting access levels."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/access-levels", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have default access levels
        assert len(data) > 0
    
    def test_add_access_level(self, client, auth_headers, test_db):
        """Test adding a new access level."""
        new_level = {
            "lenel_id": "CUSTOM_400",
            "name": "Custom Level",
            "description": "A custom access level"
        }
        
        response = client.post(
            "/api/admin/access-levels",
            json=new_level,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["lenel_id"] == "CUSTOM_400"
        assert data["name"] == "Custom Level"
    
    def test_add_duplicate_access_level(self, client, auth_headers):
        """Test adding duplicate access level fails."""
        level = {
            "lenel_id": "DUPLICATE_500",
            "name": "First Level",
            "description": "First"
        }
        
        # Add first time
        response1 = client.post(
            "/api/admin/access-levels",
            json=level,
            headers=auth_headers
        )
        assert response1.status_code == 200
        
        # Try to add duplicate
        response2 = client.post(
            "/api/admin/access-levels",
            json=level,
            headers=auth_headers
        )
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"]


class TestDatabaseModels:
    """Test database models."""
    
    def test_user_model(self, test_db):
        """Test User model."""
        from app.auth import get_password_hash
        
        user = models.User(
            username="testuser",
            hashed_password=get_password_hash("password"),
            role="operator",
            is_active=True
        )
        test_db.add(user)
        test_db.commit()
        
        queried_user = test_db.query(models.User).filter(
            models.User.username == "testuser"
        ).first()
        
        assert queried_user is not None
        assert queried_user.username == "testuser"
        assert queried_user.role == "operator"
        assert queried_user.is_active is True
    
    def test_visitor_model(self, test_db):
        """Test Visitor model."""
        start = datetime.utcnow()
        end = start + timedelta(hours=2)
        
        visitor = models.Visitor(
            name="John Doe",
            guest_of="Jane Smith",
            national_id="123456789",
            office_branch="Main Office",
            start_time=start,
            end_time=end,
            address="123 Main St",
            nationality="USA",
            car_plate="ABC-123",
            purpose_of_visit="Meeting"
        )
        test_db.add(visitor)
        test_db.commit()
        
        queried_visitor = test_db.query(models.Visitor).filter(
            models.Visitor.national_id == "123456789"
        ).first()
        
        assert queried_visitor is not None
        assert queried_visitor.name == "John Doe"
        assert queried_visitor.guest_of == "Jane Smith"
        assert queried_visitor.is_synchronized is False
    
    def test_access_level_model(self, test_db):
        """Test AccessLevel model."""
        level = models.AccessLevel(
            lenel_id="TEST_100",
            name="Test Access",
            description="Test access level"
        )
        test_db.add(level)
        test_db.commit()
        
        queried_level = test_db.query(models.AccessLevel).filter(
            models.AccessLevel.lenel_id == "TEST_100"
        ).first()
        
        assert queried_level is not None
        assert queried_level.name == "Test Access"
