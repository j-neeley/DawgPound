"""
Admin configuration for groups app.
"""

from django.contrib import admin
from .models import Group, GroupMembership


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """Admin for Group model."""
    list_display = ['name', 'category', 'creator', 'member_count', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description', 'tags']
    filter_horizontal = ['moderators']
    ordering = ['-created_at']
    
    def member_count(self, obj):
        """Display member count."""
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    """Admin for GroupMembership model."""
    list_display = ['user', 'group', 'joined_at']
    list_filter = ['joined_at']
    search_fields = ['user__username', 'group__name']
    ordering = ['-joined_at']

