"""
Custom authentication classes for testing backend.
"""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication without CSRF validation.
    For testing-only backend where CSRF protection is not needed.
    """
    
    def enforce_csrf(self, request):
        """
        Skip CSRF validation for API endpoints.
        """
        return  # Do nothing, effectively disabling CSRF
