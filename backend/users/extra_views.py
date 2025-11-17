"""
Additional views for users app.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .taxonomy import get_taxonomy


@api_view(['GET'])
@permission_classes([AllowAny])
def taxonomy_view(request):
    """Get taxonomy data for majors and interests."""
    return Response(get_taxonomy())
