"""
Views for user authentication and profile management.
"""

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
import os

from .serializers import (UserSerializer, SignupSerializer, LoginSerializer, 
                          OnboardingSerializer, FriendRequestSerializer, FriendshipSerializer)
from .models import FriendRequest, Friendship
from .taxonomy import get_taxonomy

User = get_user_model()


def test_page(request):
    """Serve the test HTML page"""
    html_path = os.path.join(os.path.dirname(__file__), '..', 'test_frontend.html')
    with open(html_path, 'r') as f:
        return HttpResponse(f.read(), content_type='text/html')


def dashboard_page(request):
    """Serve the dashboard page"""
    html_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'dashboard.html')
    with open(html_path, 'r') as f:
        return HttpResponse(f.read(), content_type='text/html')
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user signup, login, logout, and profile management.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """Use default IsAuthenticated."""
        return [IsAuthenticated()]
    
    def get_permissions(self):
        """Allow anyone to signup or login."""
        if self.action in ['signup', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):
        """Create a new user account."""
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Auto-login after signup
            login(request, user)
            return Response({
                'message': 'Signup successful',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user."""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                return Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data
                })
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Logout user."""
        logout(request)
        return Response({'message': 'Logout successful'})
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile."""
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['post', 'put'])
    def onboarding(self, request):
        """Complete or update user onboarding."""
        serializer = OnboardingSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Onboarding updated successfully',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=(AllowAny,))
    def taxonomy(self, request):
        """Get taxonomy data for majors and interests."""
        return Response(get_taxonomy())
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Get user's friends list."""
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2')
        serializer = FriendshipSerializer(friendships, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def friend_requests(self, request):
        """Get pending friend requests."""
        # Received requests
        received = FriendRequest.objects.filter(
            to_user=request.user, status='pending'
        ).select_related('from_user')
        
        # Sent requests
        sent = FriendRequest.objects.filter(
            from_user=request.user, status='pending'
        ).select_related('to_user')
        
        return Response({
            'received': FriendRequestSerializer(received, many=True).data,
            'sent': FriendRequestSerializer(sent, many=True).data
        })
    
    @action(detail=False, methods=['post'])
    def send_friend_request(self, request):
        """Send a friend request."""
        to_user_id = request.data.get('to_user')
        
        if not to_user_id:
            return Response({'error': 'to_user is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if str(to_user_id) == str(request.user.id):
            return Response({'error': 'Cannot send friend request to yourself'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already friends
        if Friendship.objects.filter(
            Q(user1=request.user, user2=to_user) | Q(user1=to_user, user2=request.user)
        ).exists():
            return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if request already exists
        if FriendRequest.objects.filter(
            Q(from_user=request.user, to_user=to_user) | Q(from_user=to_user, to_user=request.user),
            status='pending'
        ).exists():
            return Response({'error': 'Friend request already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        friend_request = FriendRequest.objects.create(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        )
        
        return Response(FriendRequestSerializer(friend_request).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def accept_friend_request(self, request):
        """Accept a friend request."""
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({'error': 'request_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friend_request = FriendRequest.objects.get(
                id=request_id, to_user=request.user, status='pending'
            )
        except FriendRequest.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update request status
        friend_request.status = 'accepted'
        friend_request.save()
        
        # Create friendship (ensure user1.id < user2.id for consistency)
        user1, user2 = sorted([friend_request.from_user, friend_request.to_user], key=lambda u: u.id)
        Friendship.objects.create(user1=user1, user2=user2)
        
        return Response({'message': 'Friend request accepted'})
    
    @action(detail=False, methods=['post'])
    def decline_friend_request(self, request):
        """Decline a friend request."""
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({'error': 'request_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friend_request = FriendRequest.objects.get(
                id=request_id, to_user=request.user, status='pending'
            )
        except FriendRequest.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        friend_request.status = 'declined'
        friend_request.save()
        
        return Response({'message': 'Friend request declined'})
