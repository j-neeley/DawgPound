"""
User models for DawgPound.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Stores user profile and onboarding information.
    """
    # University email verification
    university_email = models.EmailField(unique=True, db_index=True)
    verification_token = models.CharField(max_length=255, blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    
    # Onboarding fields
    onboarding_completed = models.BooleanField(default=False)
    majors = models.JSONField(default=list, blank=True)  # List of majors
    interests_hobbies = models.JSONField(default=list, blank=True)  # List of interests
    year_of_study = models.CharField(max_length=50, blank=True)
    graduation_year = models.IntegerField(blank=True, null=True)
    
    # Privacy settings
    privacy_settings = models.JSONField(default=dict, blank=True)
    
    # Social connections
    blocked_users = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='blocked_by',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['university_email']),
            models.Index(fields=['verification_token']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.university_email})"
    
    def is_verified(self):
        """Check if user has verified their email."""
        return self.verified_at is not None


class FriendRequest(models.Model):
    """
    Friend request model for managing friend connections.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    
    from_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_friend_requests'
    )
    to_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_friend_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'friend_requests'
        unique_together = [['from_user', 'to_user']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"


class Friendship(models.Model):
    """
    Friendship model for managing accepted friend connections.
    """
    user1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friendships_as_user1'
    )
    user2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friendships_as_user2'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'friendships'
        unique_together = [['user1', 'user2']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user1']),
            models.Index(fields=['user2']),
        ]
    
    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"

