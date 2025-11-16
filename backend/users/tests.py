"""
Tests for user models and authentication.
"""

import pytest
from django.contrib.auth import get_user_model
from users.models import FriendRequest, Friendship


User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Test User model functionality."""
    
    def test_create_user(self):
        """Test creating a basic user."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            university_email='test@university.edu',
            password='testpass123'
        )
        assert user.username == 'testuser'
        assert user.university_email == 'test@university.edu'
        assert not user.is_verified()
    
    def test_user_verification(self):
        """Test user email verification."""
        from django.utils import timezone
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            university_email='test@university.edu',
            password='testpass123'
        )
        user.verified_at = timezone.now()
        user.save()
        assert user.is_verified()
    
    def test_onboarding_completion(self):
        """Test user onboarding."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            university_email='test@university.edu',
            password='testpass123'
        )
        user.majors = ['Computer Science']
        user.interests_hobbies = ['Coding', 'Music', 'Gaming']
        user.year_of_study = 'Junior'
        user.graduation_year = 2025
        user.onboarding_completed = True
        user.save()
        
        assert user.onboarding_completed
        assert len(user.majors) >= 1
        assert len(user.interests_hobbies) >= 3


@pytest.mark.django_db
class TestFriendship:
    """Test friendship functionality."""
    
    def test_friend_request_creation(self):
        """Test creating a friend request."""
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            university_email='user1@university.edu',
            password='pass123'
        )
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            university_email='user2@university.edu',
            password='pass123'
        )
        
        friend_request = FriendRequest.objects.create(
            from_user=user1,
            to_user=user2,
            status='pending'
        )
        
        assert friend_request.status == 'pending'
        assert friend_request.from_user == user1
        assert friend_request.to_user == user2
    
    def test_accept_friend_request(self):
        """Test accepting a friend request."""
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            university_email='user1@university.edu',
            password='pass123'
        )
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            university_email='user2@university.edu',
            password='pass123'
        )
        
        friend_request = FriendRequest.objects.create(
            from_user=user1,
            to_user=user2,
            status='pending'
        )
        
        # Accept request
        friend_request.status = 'accepted'
        friend_request.save()
        
        # Create friendship
        Friendship.objects.create(user1=user1, user2=user2)
        
        assert friend_request.status == 'accepted'
        assert Friendship.objects.filter(user1=user1, user2=user2).exists()

