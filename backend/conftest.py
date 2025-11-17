"""
Pytest configuration for DawgPound backend tests.
"""

import pytest
from django.conf import settings


@pytest.fixture(scope='session')
def django_db_setup(django_db_blocker):
    """Override database settings for tests."""
    # Use a file-backed SQLite DB for tests so migrations run reliably
    # and tables persist for the test session.
    test_db_path = str(settings.BASE_DIR / 'test_db.sqlite3')
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': test_db_path,
        'ATOMIC_REQUESTS': False,
        'AUTOCOMMIT': True,
        'CONN_MAX_AGE': 0,
        'OPTIONS': {},
        'TIME_ZONE': None,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }

    # Apply migrations explicitly since we're overriding django_db_setup.
    from django.core.management import call_command
    with django_db_blocker.unblock():
        call_command('migrate', '--noinput')


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
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    return user


@pytest.fixture
def authenticated_client(api_client, authenticated_user):
    """Fixture for authenticated API client."""
    api_client.force_authenticate(user=authenticated_user)
    return api_client
