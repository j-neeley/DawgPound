from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Thread, Reply
from .serializers import ThreadSerializer, ReplySerializer


class ThreadViewSet(viewsets.ModelViewSet):
    """ViewSet for forum threads."""
    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Thread.objects.select_related('author', 'group')
        
        # Filter by group
        group_id = self.request.query_params.get('group', None)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset.order_by('-pinned', '-created_at')
    
    def perform_create(self, serializer):
        """Set the author when creating a thread."""
        serializer.save(author=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Allow admins or thread authors to delete threads."""
        thread = self.get_object()
        user = request.user
        
        # Check if user is admin (staff or superuser) or the thread author
        if not (user.is_staff or user.is_superuser or thread.author == user):
            return Response(
                {'error': 'You do not have permission to delete this thread'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        thread.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Get all replies for a thread."""
        thread = self.get_object()
        replies = thread.replies.select_related('author').order_by('created_at')
        serializer = ReplySerializer(replies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Add a reply to a thread."""
        thread = self.get_object()
        
        if thread.locked:
            return Response({'error': 'Thread is locked'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ReplySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(thread=thread, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReplyViewSet(viewsets.ModelViewSet):
    """ViewSet for thread replies."""
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Reply.objects.select_related('author', 'thread')
    
    def perform_create(self, serializer):
        """Set the author when creating a reply."""
        serializer.save(author=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Allow admins or reply authors to delete replies."""
        reply = self.get_object()
        user = request.user
        
        # Check if user is admin (staff or superuser) or the reply author
        if not (user.is_staff or user.is_superuser or reply.author == user):
            return Response(
                {'error': 'You do not have permission to delete this reply'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reply.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

