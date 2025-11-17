"""
URLs for the users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .extra_views import taxonomy_view

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('taxonomy/', taxonomy_view, name='taxonomy'),
    path('', include(router.urls)),
]
