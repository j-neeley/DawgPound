"""
Serializers for groups.
"""

from rest_framework import serializers
from .models import Group, GroupMembership


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group model."""
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'category', 'tags', 
                  'creator', 'created_at', 'updated_at', 'member_count', 'is_member']
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for GroupMembership."""
    user_username = serializers.CharField(source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'user_username', 'group', 'group_name', 'joined_at']
        read_only_fields = ['id', 'joined_at']
