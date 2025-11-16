"""
Admin configuration for messaging app.
"""

from django.contrib import admin
from .models import PrivateChat, ChatParticipant, Message


@admin.register(PrivateChat)
class PrivateChatAdmin(admin.ModelAdmin):
    """Admin for PrivateChat model."""
    list_display = ['name', 'participant_count', 'message_count', 'created_at']
    search_fields = ['name']
    ordering = ['-created_at']
    
    def participant_count(self, obj):
        """Display participant count."""
        return obj.participants.count()
    participant_count.short_description = 'Participants'
    
    def message_count(self, obj):
        """Display message count."""
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(ChatParticipant)
class ChatParticipantAdmin(admin.ModelAdmin):
    """Admin for ChatParticipant model."""
    list_display = ['user', 'chat', 'muted', 'joined_at']
    list_filter = ['muted', 'joined_at']
    search_fields = ['user__username', 'chat__name']
    ordering = ['-joined_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin for Message model."""
    list_display = ['chat', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'chat__name', 'author__username']
    ordering = ['-created_at']
    
    def content_preview(self, obj):
        """Display content preview."""
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'

