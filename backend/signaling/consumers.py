import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Obtenemos el ID de la sala de la URL (ej: ws://.../sala1/)
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Unirse al grupo (sala)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"Conectado a la sala: {self.room_name}")
        print(f"   Channel name: {self.channel_name}")

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Desconectado de: {self.room_name}")

    # Recibir mensaje del WebSocket (Frontend)
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type', 'unknown')
            
            print(f"[{self.room_name}] Recibido {msg_type} de {self.channel_name[:20]}...")
            
            # Enviar a TODOS en el grupo (incluyendo al remitente, lo filtraremos en el handler)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_message',
                    'message': data,
                    'sender_channel': self.channel_name
                }
            )
            print(f"[{self.room_name}] Mensaje reenviado al grupo")
        except Exception as e:
            print(f"[{self.room_name}] Error recibiendo mensaje: {e}")

    # Manejar mensaje enviado desde el grupo
    async def signal_message(self, event):
        message = event['message']
        sender_channel = event['sender_channel']
        msg_type = message.get('type', 'unknown')

        # Anti-eco: no reenviar al remitente
        if self.channel_name == sender_channel:
            print(f"[{self.room_name}] Anti-eco: ignorando mensaje del remitente")
            return

        try:
            print(f"[{self.room_name}] Reenviando {msg_type} a {self.channel_name[:20]}...")
            await self.send(text_data=json.dumps(message))
            print(f"[{self.room_name}] {msg_type} enviado")
        except Exception as e:
            print(f"[{self.room_name}] Error reenviando: {e}")