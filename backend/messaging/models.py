"""
Messaging models for DawgPound.
"""

from django.db import models
from django.conf import settings


class PrivateChat(models.Model):
    """
    Private chat/group chat model.
    """
    name = models.CharField(max_length=255, blank=True)
    avatar = models.URLField(blank=True)
    
    # Participants
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ChatParticipant',
        related_name='private_chats'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'private_chats'
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.name or f"Chat {self.id}"


class ChatParticipant(models.Model):
    """
    Through model for chat participants with mute settings.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    chat = models.ForeignKey(
        PrivateChat,
        on_delete=models.CASCADE
    )
    muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_participants'
        unique_together = [['user', 'chat']]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['chat']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.chat}"


class Message(models.Model):
    """
    Message model for private chats.
    """
    chat = models.ForeignKey(
        PrivateChat,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_messages'
    )
    content = models.TextField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
            models.Index(fields=['author']),
        ]
    
    def __str__(self):
        author_name = self.author.username if self.author else 'Unknown'
        return f"Message by {author_name} in {self.chat}"

