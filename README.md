# Share App - Aplicación de Transferencia P2P

Una aplicación de transferencia de archivos peer-to-peer (P2P) que funciona en tiempo real usando **WebRTC**. Los archivos se transfieren directamente entre usuarios sin pasar por un servidor central.

## ¿Cómo Funciona?

1. El **remitente** selecciona y carga los archivos que desea compartir
2. El sistema genera automáticamente un código QR, un ID de sala o un enlace para compartir
3. El **receptor** escanea el código QR o accede al enlace compartido
4. La transferencia de archivos comienza automáticamente entre ambos dispositivos
5. Los archivos se reciben directamente sin pasar por un servidor

## Componentes Principales

### Backend (Django + Channels)
- **Servidor de señalización**: Gestiona la conexión inicial entre usuarios mediante WebSockets
- **Gestión de salas**: Cada sala es independiente y agrupa a los usuarios conectados

### Frontend (React + Vite)
- **Interfaz de usuario**: Componentes para crear/unirse a salas
- **Gestión de WebRTC**: Hook personalizado que maneja toda la lógica de conexión P2P
- **Código QR**: Generación automática del código para compartir la sala

## Requisitos

- Python 3.8+
- Node.js 16+
- npm o yarn


## Estructura del Proyecto

```
share-app/
├── backend/
│   ├── core/
│   │   ├── settings.py       # Configuración Django
│   │   ├── urls.py           # Rutas URL
│   │   └── asgi.py           # Configuración ASGI
│   ├── signaling/
│   │   ├── consumers.py      # WebSocket consumers
│   │   ├── routing.py        # Rutas WebSocket
│   │   └── apps.py           # Configuración app
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── main.jsx          # Punto de entrada
│   │   ├── socket.js         # Configuración WebSocket
│   │   ├── hooks/
│   │   │   └── useWebRTC.js  # Hook principal WebRTC
│   │   ├── components/       # Componentes React
│   │   └── assets/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

##  Tecnologías Utilizadas

### Backend
- **Django 6.0**: Framework web
- **Channels 4.3.2**: WebSockets para Django
- **Daphne 4.2.1**: Servidor ASGI para WebSockets
- **Twisted**: Servidor asincrónico

### Frontend
- **React 19.2.0**: Biblioteca UI
- **Vite 7.2.4**: Build tool y dev server
- **react-qr-code 2.0.18**: Generación de códigos QR
- **simple-peer 9.11.1**: Abstracción de WebRTC
- **Tailwind CSS 3.4.19**: Estilos CSS

## Flujo de la Aplicación

### Fase de Carga

1. **Remitente**: Selecciona los archivos a compartir desde su dispositivo
2. **Carga**: Los archivos se preparan en memoria para la transferencia
3. **Generación de acceso**: Se crea un código QR, ID de sala o enlace único

### Fase de Recepción

1. **Receptor**: Escanea el QR o accede al enlace compartido
2. **Conexión automática**: Se establece la conexión P2P mediante WebRTC
3. **Transferencia automática**: Los archivos comienzan a descargarse automáticamente
4. **Descarga**: El receptor recibe los archivos directamente en su dispositivo

## Proceso Técnico

```
Remitente                           Receptor
  │                                  │
  ├─ Carga archivos                  │
  │                                  │
  ├─ Genera QR/Enlace               │
  │                                  │
  │                                  ├─ Escanea QR
  │                                  │
  ├───────── Señalización ──────────→│
  │      (WebSocket)                  │
  │                                  │
  ├─────── offer (SDP) ──────────────→│
  │      (vía WebSocket)              │
  │                                  │
  ←──────── answer (SDP) ────────────┤
  │      (vía WebSocket)              │
  │                                  │
  ├─────── ICE candidates ───────────→│
  │      (vía WebSocket)              │
  │                                  │
  ←─────── ICE candidates ───────────┤
  │      (vía WebSocket)              │
  │                                  │
  ╞════════ Data Channel (P2P) ══════╡
  │     (transferencia automática)    │
```

