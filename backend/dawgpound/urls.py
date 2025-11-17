"""
URL configuration for dawgpound project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from users.views import test_page, dashboard_page

urlpatterns = [
    # Redirect root to test page
    path('', RedirectView.as_view(url='/test/', permanent=False)),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # Test page
    path('test/', test_page, name='test_page'),
    path('dashboard/', dashboard_page, name='dashboard'),
    
    # App URLs
    path('api/', include('users.urls')),
    path('api/', include('groups.urls')),
    path('api/', include('forums.urls')),
    path('api/', include('messaging.urls')),
    path('api/', include('moderation.urls')),
]
