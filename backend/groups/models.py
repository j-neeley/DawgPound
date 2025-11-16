"""
Group models for DawgPound.
"""

from django.db import models
from django.conf import settings


class Group(models.Model):
    """
    Public group model for forums and communities.
    """
    CATEGORY_CHOICES = [
        ('class_year', 'Class Year'),
        ('major', 'Major'),
        ('interests_activities', 'Interests & Activities'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    tags = models.JSONField(default=list, blank=True)  # List of tag strings
    
    # Group creator and moderators
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_groups'
    )
    moderators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='moderated_groups',
        blank=True
    )
    
    # Group members
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='GroupMembership',
        related_name='joined_groups',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'groups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['creator']),
        ]
    
    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    """
    Through model for Group members with additional metadata.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'group_memberships'
        unique_together = [['user', 'group']]
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['group']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

