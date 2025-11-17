"""
Admin configuration for users app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FriendRequest, Friendship


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""
    list_display = ['username', 'email', 'first_name', 'last_name', 'created_at']
    list_filter = ['is_staff', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Info', {
            'fields': ('majors', 'interests_hobbies', 'year_of_study', 'graduation_year')
        }),
    )


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    """Admin for FriendRequest model."""
    list_display = ['from_user', 'to_user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['from_user__username', 'to_user__username']
    ordering = ['-created_at']


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    """Admin for Friendship model."""
    list_display = ['user1', 'user2', 'created_at']
    search_fields = ['user1__username', 'user2__username']
    ordering = ['-created_at']

