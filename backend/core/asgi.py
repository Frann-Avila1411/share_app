import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
# Borramos AuthMiddlewareStack porque no usaremos base de datos ni usuarios
import signaling.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    # Peticiones HTTP normales:
    "http": get_asgi_application(),
    
    # Peticiones WebSocket:
    # Al quitar AuthMiddlewareStack, el socket es puramente anónimo y no toca la BD.
    "websocket": URLRouter(
        signaling.routing.websocket_urlpatterns
    ),
})