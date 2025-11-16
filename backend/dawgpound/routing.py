"""
WebSocket URL routing for DawgPound.
"""

from django.urls import re_path

# Import WebSocket consumers from apps
# from messaging.consumers import ChatConsumer
# from forums.consumers import ForumConsumer

websocket_urlpatterns = [
    # WebSocket routes will be added here as consumers are implemented
    # Example:
    # re_path(r'ws/chat/(?P<chat_id>\w+)/$', ChatConsumer.as_asgi()),
    # re_path(r'ws/forum/(?P<group_id>\w+)/$', ForumConsumer.as_asgi()),
]
