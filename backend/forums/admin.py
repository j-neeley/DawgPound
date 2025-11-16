"""
Admin configuration for forums app.
"""

from django.contrib import admin
from .models import Thread, Reply


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    """Admin for Thread model."""
    list_display = ['title', 'group', 'author', 'pinned', 'locked', 'reply_count', 'created_at']
    list_filter = ['pinned', 'locked', 'created_at']
    search_fields = ['title', 'content', 'group__name', 'author__username']
    ordering = ['-pinned', '-created_at']
    
    def reply_count(self, obj):
        """Display reply count."""
        return obj.replies.count()
    reply_count.short_description = 'Replies'


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    """Admin for Reply model."""
    list_display = ['thread', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'thread__title', 'author__username']
    ordering = ['-created_at']
    
    def content_preview(self, obj):
        """Display content preview."""
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'

