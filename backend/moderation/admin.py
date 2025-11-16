"""
Admin configuration for moderation app.
"""

from django.contrib import admin
from .models import ModerationLog, UserBan


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    """Admin for ModerationLog model."""
    list_display = ['moderator', 'action', 'group', 'thread', 'target_user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['moderator__username', 'reason', 'target_user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(UserBan)
class UserBanAdmin(admin.ModelAdmin):
    """Admin for UserBan model."""
    list_display = ['user', 'group', 'is_global', 'banned_by', 'expires_at', 'created_at']
    list_filter = ['is_global', 'created_at']
    search_fields = ['user__username', 'reason', 'banned_by__username']
    ordering = ['-created_at']

