"""
URLs for the forums app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThreadViewSet, ReplyViewSet

# Router will be configured when views are created
router = DefaultRouter()
router.register(r'threads', ThreadViewSet, basename='thread')
router.register(r'replies', ReplyViewSet, basename='reply')

urlpatterns = [
    path('', include(router.urls)),
]
