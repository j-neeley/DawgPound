"""
Moderation models for DawgPound.
"""

from django.db import models
from django.conf import settings


class ModerationLog(models.Model):
    """
    Log of moderation actions taken.
    """
    ACTION_CHOICES = [
        ('pin_thread', 'Pin Thread'),
        ('unpin_thread', 'Unpin Thread'),
        ('lock_thread', 'Lock Thread'),
        ('unlock_thread', 'Unlock Thread'),
        ('delete_thread', 'Delete Thread'),
        ('delete_reply', 'Delete Reply'),
        ('add_moderator', 'Add Moderator'),
        ('remove_moderator', 'Remove Moderator'),
        ('ban_user', 'Ban User'),
        ('unban_user', 'Unban User'),
    ]
    
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='moderation_actions'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    
    # Target references
    group = models.ForeignKey(
        'groups.Group',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    thread = models.ForeignKey(
        'forums.Thread',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    reply = models.ForeignKey(
        'forums.Reply',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs_as_target'
    )
    
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'moderation_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['moderator', '-created_at']),
            models.Index(fields=['group', '-created_at']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        moderator_name = self.moderator.username if self.moderator else 'System'
        return f"{moderator_name} - {self.action} at {self.created_at}"


class UserBan(models.Model):
    """
    User ban model for managing banned users.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bans'
    )
    group = models.ForeignKey(
        'groups.Group',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='banned_users'
    )
    banned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='issued_bans'
    )
    
    reason = models.TextField(blank=True)
    is_global = models.BooleanField(default=False)  # Platform-wide ban
    expires_at = models.DateTimeField(null=True, blank=True)  # Null for permanent
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_bans'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_global']),
            models.Index(fields=['group']),
        ]
    
    def __str__(self):
        scope = "Global" if self.is_global else f"in {self.group.name}"
        return f"{self.user.username} banned {scope}"

