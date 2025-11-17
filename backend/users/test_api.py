"""
Tests for authentication API endpoints.
"""

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestAuthAPI:
    """Test authentication API endpoints."""
    
    def test_signup(self, api_client):
        """Test user signup endpoint."""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post('/api/users/signup/', data)
        
        assert response.status_code == 201
        assert 'user' in response.data
        assert response.data['user']['username'] == 'newuser'
        assert User.objects.filter(username='newuser').exists()
    
    def test_login(self, api_client, authenticated_user):
        """Test user login endpoint."""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = api_client.post('/api/users/login/', data)
        
        assert response.status_code == 200
        assert 'user' in response.data
        assert response.data['user']['username'] == 'testuser'
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials."""
        data = {
            'username': 'wronguser',
            'password': 'wrongpass'
        }
        response = api_client.post('/api/users/login/', data)
        
        assert response.status_code == 401
        assert 'error' in response.data
    
    def test_logout(self, authenticated_client):
        """Test user logout endpoint."""
        response = authenticated_client.post('/api/users/logout/')
        
        assert response.status_code == 200
        assert response.data['message'] == 'Logout successful'
    
    def test_get_current_user(self, authenticated_client, authenticated_user):
        """Test getting current user profile."""
        response = authenticated_client.get('/api/users/me/')
        
        assert response.status_code == 200
        assert response.data['username'] == 'testuser'
