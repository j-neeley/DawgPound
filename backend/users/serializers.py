"""
Serializers for user authentication and profile.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import FriendRequest, Friendship

User = get_user_model()


class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for friend requests."""
    from_user_username = serializers.CharField(source='from_user.username', read_only=True)
    to_user_username = serializers.CharField(source='to_user.username', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'from_user_username', 'to_user', 
                  'to_user_username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'from_user', 'status', 'created_at', 'updated_at']


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for friendships."""
    friend = serializers.SerializerMethodField()
    
    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_friend(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        # Return the other user in the friendship
        if obj.user1 == request.user:
            return UserSerializer(obj.user2).data
        return UserSerializer(obj.user1).data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    onboarding_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'majors', 'interests_hobbies', 'year_of_study', 'graduation_year',
                  'created_at', 'onboarding_completed', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'created_at', 'is_staff', 'is_superuser']
    
    def get_onboarding_completed(self, obj):
        """Check if user has completed onboarding."""
        return bool(obj.majors and len(obj.majors) > 0 and 
                   obj.interests_hobbies and len(obj.interests_hobbies) >= 3)


class OnboardingSerializer(serializers.ModelSerializer):
    """Serializer for onboarding wizard."""
    
    class Meta:
        model = User
        fields = ['majors', 'interests_hobbies', 'year_of_study', 'graduation_year']
    
    def validate_majors(self, value):
        """Validate at least one major."""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one major is required")
        return value
    
    def validate_interests_hobbies(self, value):
        """Validate at least three interests."""
        if not value or len(value) < 3:
            raise serializers.ValidationError("At least three interests/hobbies are required")
        return value


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user signup."""
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        """Create a new user with encrypted password."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
