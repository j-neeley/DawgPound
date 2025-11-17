"""
URLs for the groups app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupViewSet

# Router will be configured when views are created
router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')

urlpatterns = [
    path('', include(router.urls)),
]
