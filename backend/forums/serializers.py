"""
Serializers for forums.
"""

from rest_framework import serializers
from .models import Thread, Reply


class ReplySerializer(serializers.ModelSerializer):
    """Serializer for Reply model."""
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = Reply
        fields = ['id', 'thread', 'author', 'author_username', 'content', 
                  'content_type', 'attachments', 'created_at', 'updated_at']
        read_only_fields = ['id', 'thread', 'author', 'created_at', 'updated_at']


class ThreadSerializer(serializers.ModelSerializer):
    """Serializer for Thread model."""
    author_username = serializers.CharField(source='author.username', read_only=True)
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Thread
        fields = ['id', 'group', 'author', 'author_username', 'title', 'content',
                  'content_type', 'attachments', 'pinned', 'locked', 
                  'created_at', 'updated_at', 'reply_count']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
    
    def get_reply_count(self, obj):
        return obj.replies.count()
