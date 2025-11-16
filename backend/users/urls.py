"""
URLs for the users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Router will be configured when views are created
router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
