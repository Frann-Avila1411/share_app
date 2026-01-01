from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # CAMBIO: Agregamos el guion '-' dentro de los corchetes [\w-]
    re_path(r'ws/(?P<room_name>[\w-]+)/$', consumers.SignalingConsumer.as_asgi()),
]