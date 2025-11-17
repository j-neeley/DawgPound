from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Count
from .models import Group, GroupMembership
from .serializers import GroupSerializer, GroupMembershipSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """ViewSet for managing groups."""
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Group.objects.all()
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        
        return queryset.annotate(member_count=Count('members')).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set the creator when creating a group."""
        group = serializer.save(creator=self.request.user)
        # Auto-join creator as member
        GroupMembership.objects.create(user=self.request.user, group=group)
        # Make creator a moderator
        group.moderators.add(self.request.user)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a group."""
        group = self.get_object()
        
        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        GroupMembership.objects.create(user=request.user, group=group)
        return Response({'message': 'Joined group successfully'})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a group."""
        group = self.get_object()
        
        membership = GroupMembership.objects.filter(user=request.user, group=group).first()
        if not membership:
            return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        if group.creator == request.user:
            return Response({'error': 'Creator cannot leave group'}, status=status.HTTP_400_BAD_REQUEST)
        
        membership.delete()
        return Response({'message': 'Left group successfully'})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get group members."""
        group = self.get_object()
        memberships = GroupMembership.objects.filter(group=group).select_related('user')
        serializer = GroupMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

