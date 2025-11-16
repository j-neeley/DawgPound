"""
Pytest configuration for DawgPound backend tests.
"""

import pytest
from django.conf import settings


@pytest.fixture(scope='session')
def django_db_setup():
    """Override database settings for tests."""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }


@pytest.fixture
def api_client():
    """Fixture for API client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_user(db):
    """Fixture for creating an authenticated user."""
    from users.models import User
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        university_email='test@university.edu',
        password='testpass123',
        verified_at='2024-01-01T00:00:00Z'
    )
    return user


@pytest.fixture
def authenticated_client(api_client, authenticated_user):
    """Fixture for authenticated API client."""
    api_client.force_authenticate(user=authenticated_user)
    return api_client
