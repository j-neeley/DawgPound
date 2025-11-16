"""
Forum models for DawgPound.
"""

from django.db import models
from django.conf import settings


class Thread(models.Model):
    """
    Forum thread model within a group.
    """
    CONTENT_TYPE_CHOICES = [
        ('plain', 'Plain Text'),
        ('markdown', 'Markdown'),
        ('html', 'HTML'),
    ]
    
    group = models.ForeignKey(
        'groups.Group',
        on_delete=models.CASCADE,
        related_name='threads'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_threads'
    )
    
    title = models.CharField(max_length=500)
    content = models.TextField()
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default='plain'
    )
    
    # Attachments stored as JSON array
    attachments = models.JSONField(default=list, blank=True)
    
    # Moderation flags
    pinned = models.BooleanField(default=False)
    locked = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'threads'
        ordering = ['-pinned', '-created_at']
        indexes = [
            models.Index(fields=['group', '-pinned', '-created_at']),
            models.Index(fields=['author']),
        ]
    
    def __str__(self):
        return f"{self.title} in {self.group.name}"


class Reply(models.Model):
    """
    Reply model for forum threads.
    """
    CONTENT_TYPE_CHOICES = [
        ('plain', 'Plain Text'),
        ('markdown', 'Markdown'),
        ('html', 'HTML'),
    ]
    
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_replies'
    )
    
    content = models.TextField()
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default='plain'
    )
    
    # Attachments stored as JSON array
    attachments = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'replies'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread', 'created_at']),
            models.Index(fields=['author']),
        ]
    
    def __str__(self):
        return f"Reply by {self.author.username if self.author else 'Unknown'} on {self.thread.title}"

