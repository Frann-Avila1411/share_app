import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

export const useWebRTC = (roomId) => {
    const [status, setStatus] = useState('Desconectado');
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0); // 0 a 100%
    const [currentFileInfo, setCurrentFileInfo] = useState(null); // Datos del archivo activo
    const [transferSpeed, setTransferSpeed] = useState(0); // MB/s aproximados
    const [sendingState, setSendingState] = useState('idle'); // idle | sending | paused | cancelled | done

    const ws = useRef(null);
    const peer = useRef(null);
    const isInitiatorRef = useRef(false);
    const pendingFilesRef = useRef([]);
    const isSendingRef = useRef(false);
    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);
    const bytesTransferredRef = useRef(0);
    const currentFileStartRef = useRef(0);
    const lastChunkTimeRef = useRef(0);

    // Variables para recepciion de archivos
    const incomingFile = useRef(null); // Guardará nombre y tamaño
    const receivedChunks = useRef([]); // Array donde acumulamos los bytes
    const receivedBytes = useRef(0);   // Contador de bytes recibidos

    const log = (msg) => setLogs(prev => [...prev, msg]);

    // NO conectar automáticamente: esperar a que initializeSession sea llamado
    useEffect(() => {
        return () => {
            if (ws.current) ws.current.close();
            if (peer.current) peer.current.destroy();
        };
    }, []);

    const startConnection = (isInitiator) => {
        setStatus(isInitiator ? 'Conectando como Ofertante...' : 'Conectando como Receptor...');

        if (!peer.current) {
            log(`Iniciando SimplePeer (${isInitiator ? 'Ofertante' : 'Receptor'})`);

            peer.current = new SimplePeer({
                initiator: isInitiator,
                trickle: false,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            // Configurar event listeners
            peer.current.on('signal', (data) => {
                log(`Enviando señal (${isInitiator ? 'Oferta' : 'Respuesta'})`);
                try {
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send(JSON.stringify(data));
                        log('Señal enviada al servidor');
                    } else {
                        log('WebSocket no está abierto, no se puede enviar señal');
                    }
                } catch (err) {
                    log(`Error enviando señal: ${err.message}`);
                }
            });

            peer.current.on('connect', () => {
                setStatus('P2P CONECTADO');
                log('Canal de datos abierto');

                // Si soy initiator y hay archivos pendientes, comenzar a enviar
                if (isInitiator && pendingFilesRef.current.length > 0) {
                    log(`Cola de ${pendingFilesRef.current.length} archivo(s) - Iniciando envío automático`);
                    autoSendFiles();
                }
            });

            // --- logica de recepción de archivos ---
            peer.current.on('data', (data) => {
                // 1. Intentamos ver si es un mensaje de texto (JSON Header)
                try {
                    const text = new TextDecoder().decode(data);
                    const json = JSON.parse(text);

                    if (json.type === 'file-header') {
                        // Es el inicio de un archivo nuevo
                        log(`Recibiendo archivo: ${json.name} (${(json.size / 1024).toFixed(2)} KB)`);
                        incomingFile.current = json;
                        receivedChunks.current = [];
                        receivedBytes.current = 0;
                        bytesTransferredRef.current = 0;
                        currentFileStartRef.current = Date.now();
                        lastChunkTimeRef.current = Date.now();
                        setProgress(0);
                        setTransferSpeed(0);
                        setCurrentFileInfo({
                            name: json.name,
                            size: json.size,
                            index: 1,
                            total: 1,
                            direction: 'receive'
                        });
                        return; // Terminamos, no es un chunk
                    }
                } catch (e) {
                    // Si falla el JSON.parse, es que son datos binarios (un chunk del archivo)
                }

                // 2. Si no es JSON, asumimos que es un CHUNK del archivo
                if (incomingFile.current) {
                    receivedChunks.current.push(data);
                    receivedBytes.current += data.byteLength;
                    bytesTransferredRef.current += data.byteLength;

                    const now = Date.now();
                    const deltaMs = now - lastChunkTimeRef.current || 1;
                    const chunkSpeed = (data.byteLength * 1000) / deltaMs; // bytes/seg
                    setTransferSpeed(Number((chunkSpeed / 1024 / 1024).toFixed(2)));
                    lastChunkTimeRef.current = now;

                    // Calcular progreso
                    const percentage = Math.round((receivedBytes.current / incomingFile.current.size) * 100);
                    setProgress(percentage);

                    // 3. ¿Terminamos?
                    if (receivedBytes.current >= incomingFile.current.size) {
                        log('Archivo completado. Generando descarga...');
                        downloadFile();
                    }
                }
            });

            peer.current.on('error', (err) => {
                log(`Error en SimplePeer: ${err.message}`);
                setStatus('Error: ' + err.message);
            });

            peer.current.on('close', () => {
                log('Conexión P2P cerrada');
                setStatus('Desconectado');
                setSendingState('idle');
                setCurrentFileInfo(null);
                setTransferSpeed(0);
                setProgress(0);
            });
        }
    };

    // Función para enviar automáticamente la cola de archivos
    const autoSendFiles = async () => {
        if (isSendingRef.current) return;
        isSendingRef.current = true;
        isCancelledRef.current = false;
        isPausedRef.current = false;
        setSendingState('sending');
        setTransferSpeed(0);
        setCurrentFileInfo(null);

        const filesToSend = [...pendingFilesRef.current];
        const totalFiles = filesToSend.length;

        for (let i = 0; i < filesToSend.length; i++) {
            const file = filesToSend[i];
            try {
                log(`Enviando archivo ${i + 1}/${totalFiles}: ${file.name}`);
                await sendFile(file, i + 1, totalFiles);
                if (isCancelledRef.current) break;
            } catch (err) {
                log(`Error enviando ${file.name}: ${err}`);
                break;
            }
        }

        pendingFilesRef.current = [];
        isSendingRef.current = false;

        if (isCancelledRef.current) {
            log('Envío cancelado');
        } else {
            log('Todos los archivos enviados');
            setSendingState('done');
        }
    };

    // Función auxiliar para descargar el archivo en el navegador
    const downloadFile = () => {
        const blob = new Blob(receivedChunks.current);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = incomingFile.current.name; // Usar nombre original
        document.body.appendChild(a);
        a.click();

        // Limpieza
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        incomingFile.current = null;
        receivedChunks.current = [];
        setCurrentFileInfo(null);
        setTransferSpeed(0);
        setProgress(0);
    };

    // --- logica de envio de archivos ---
    const sendFile = (file, position = 1, totalFiles = 1) => {
        return new Promise((resolve, reject) => {
            if (!peer.current) return reject("No hay conexión P2P");

            log(`Iniciando envío de: ${file.name}`);
            setCurrentFileInfo({
                name: file.name,
                size: file.size,
                index: position,
                total: totalFiles,
                direction: 'send'
            });
            setProgress(0);
            setTransferSpeed(0);
            bytesTransferredRef.current = 0;
            currentFileStartRef.current = Date.now();
            lastChunkTimeRef.current = Date.now();
            setSendingState('sending');

            // 1. Enviar Header
            const header = JSON.stringify({
                type: 'file-header',
                name: file.name,
                size: file.size,
                index: position,
                total: totalFiles
            });
            peer.current.send(header);

            // 2. Cortar y Enviar Chunks
            const CHUNK_SIZE = 16 * 1024;
            let offset = 0;
            const reader = new FileReader();

            const readSlice = (start) => {
                const slice = file.slice(start, start + CHUNK_SIZE);
                reader.readAsArrayBuffer(slice);
            };

            const scheduleNext = (start) => {
                if (isCancelledRef.current) {
                    setSendingState('cancelled');
                    pendingFilesRef.current = [];
                    isSendingRef.current = false;
                    return reject('cancelled');
                }
                if (isPausedRef.current) {
                    setSendingState('paused');
                    return setTimeout(() => scheduleNext(start), 200);
                }
                readSlice(start);
            };

            reader.onerror = () => reject("Error leyendo archivo");

            reader.onload = (e) => {
                const chunk = e.target.result;

                const sendChunk = () => {
                    if (!peer.current) return reject('Conexión P2P cerrada');
                    if (isCancelledRef.current) {
                        setSendingState('cancelled');
                        pendingFilesRef.current = [];
                        isSendingRef.current = false;
                        return reject('cancelled');
                    }

                    peer.current.send(chunk);
                    offset += chunk.byteLength;
                    bytesTransferredRef.current += chunk.byteLength;

                    const now = Date.now();
                    const deltaMs = now - lastChunkTimeRef.current || 1;
                    const chunkSpeed = (chunk.byteLength * 1000) / deltaMs; // bytes/seg
                    setTransferSpeed(Number((chunkSpeed / 1024 / 1024).toFixed(2)));
                    lastChunkTimeRef.current = now;

                    const percentage = Math.round((offset / file.size) * 100);
                    setProgress(percentage);

                    if (offset < file.size) {
                        scheduleNext(offset);
                    } else {
                        log(`${file.name} enviado con éxito`);
                        setCurrentFileInfo(null);
                        setTransferSpeed(0);
                        resolve();
                    }
                };

                if (isPausedRef.current) {
                    setTimeout(sendChunk, 200);
                } else {
                    sendChunk();
                }
            };

            // Arrancar
            scheduleNext(0);
        });
    };

    // Función pública para iniciar la sesión manualmente
    const initializeSession = (isInitiator, customRoomId = null) => {
        // Usar customRoomId si se proporciona, sino usar roomId del hook
        const actualRoomId = customRoomId || roomId;

        console.log('initializeSession ejecutado:', { isInitiator, customRoomId, roomId, actualRoomId });

        if (!actualRoomId) {
            log('No hay roomId');
            console.error('initializeSession: No hay roomId');
            return;
        }

        isInitiatorRef.current = isInitiator;
        log(`initializeSession: isInitiator=${isInitiator}, roomId=${actualRoomId}`);

        // Conectar al WebSocket
        let backendUrl = import.meta.env.VITE_BACKEND_URL;

        if (!backendUrl) {
            // Detectar automáticamente la URL del backend
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const host = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';

            // Si estamos en localhost, intentar con el servidor local
            if (host === 'localhost' || host === '127.0.0.1') {
                backendUrl = `${protocol}://localhost:8000`;
            } else {
                // Si es desde otro dispositivo, usar la misma IP pero puerto 8000
                backendUrl = `${protocol}://${host}:8000`;
            }
        }

        const wsUrl = `${backendUrl}/ws/${actualRoomId}/`;
        log(`Conectando a: ${wsUrl}`);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            // console.log('🔌🔌🔌 WebSocket.onopen EJECUTADO');
            setStatus('WS Conectado (Esperando par...)');
            log('🔌 WebSocket conectado');
            // console.log(`Rol: ${isInitiatorRef.current ? 'HOST (Emisor)' : 'GUEST (Receptor)'}`);
            log(`Rol: ${isInitiatorRef.current ? 'HOST (Emisor)' : 'GUEST (Receptor)'}`);

            if (isInitiatorRef.current) {
                // HOST: Esperar a que el Guest envíe guest-ready
                // console.log('Host esperando guest-ready...');
                log('Host esperando a que Guest se conecte y envíe guest-ready...');
            } else {
                // GUEST: Enviar guest-ready y esperar un poco antes de crear SimplePeer
                // console.log('Guest enviando guest-ready...');
                log('Guest enviando "guest-ready" al Host...');
                const guestReadyMsg = {
                    type: 'guest-ready',
                    timestamp: new Date().toISOString()
                };
                // console.log(`Mensaje a enviar: ${JSON.stringify(guestReadyMsg)}`);
                log(`ensaje a enviar: ${JSON.stringify(guestReadyMsg)}`);
                ws.current.send(JSON.stringify(guestReadyMsg));
                // console.log('guest-ready enviado al WebSocket');
                log('guest-ready enviado');

                // Guest crea SimplePeer INMEDIATAMENTE para estar listo cuando llegue la Oferta
                // console.log('Guest iniciando SimplePeer AHORA (sin delay)...');
                log('Guest iniciando SimplePeer inmediatamente...');
                startConnection(false);
            }
        };

        ws.current.onmessage = (event) => {
            // console.log('WebSocket.onmessage EJECUTADO');
            // console.log('Raw data:', event.data);
            try {
                log(`WebSocket recibió mensaje (raw): ${event.data.substring(0, 100)}...`);
                const data = JSON.parse(event.data);
                const msgType = data.type || 'unknown';
                // console.log(`Tipo: ${msgType}, isInitiator: ${isInitiatorRef.current}, peer: ${!!peer.current}`);
                log(`Mensaje parseado - tipo: ${msgType}, isInitiator: ${isInitiatorRef.current}, peer existe: ${!!peer.current}`);

                // Manejo especial para guest-ready
                if (msgType === 'guest-ready') {
                    log(`Host recibió guest-ready (${data.timestamp}), iniciando SimplePeer...`);
                    if (isInitiatorRef.current) {
                        if (peer.current) {
                            log('♻️ Guest-ready recibido: reiniciando SimplePeer para reenviar la Oferta');
                            try { peer.current.destroy(); } catch (e) { }
                            peer.current = null;
                        }
                        log('Host iniciando SimplePeer como Ofertante...');
                        startConnection(true);
                    } else {
                        log('guest-ready recibido pero NO soy initiator (¿soy Guest?)');
                    }
                    return;
                }

                log(`Señal recibida (${msgType})`);
                if (peer.current) {
                    peer.current.signal(data);
                    log('Señal procesada por SimplePeer');
                } else {
                    log('SimplePeer no está inicializado aún');
                }
            } catch (err) {
                log(`Error procesando mensaje: ${err.message}`);
                console.error('Error completo:', err);
            }
        };

        ws.current.onerror = () => {
            setStatus('Error: WebSocket desconectado');
            log('Error en WebSocket');
        };

        ws.current.onclose = () => {
            if (!status.includes('P2P')) {
                setStatus('Desconectado');
                log('🔌 WebSocket cerrado');
            }
        };
    };

    // Función para agregar archivos a la cola (llamar antes de initializeSession)
    const queueFilesForSending = (files) => {
        pendingFilesRef.current = [...files];
        log(`${files.length} archivo(s) añadidos a la cola`);
        setSendingState('idle');
    };

    // Control de envío
    const pauseSending = () => {
        if (!isInitiatorRef.current) return;
        isPausedRef.current = true;
        setSendingState('paused');
        log('Envío en pausa');
    };

    const resumeSending = () => {
        if (!isInitiatorRef.current) return;
        if (!isPausedRef.current) return;
        isPausedRef.current = false;
        setSendingState('sending');
        log('Reanudando envío');
    };

    const cancelSending = () => {
        if (!isInitiatorRef.current) return;
        isCancelledRef.current = true;
        isPausedRef.current = false;
        pendingFilesRef.current = [];
        setSendingState('cancelled');
        setCurrentFileInfo(null);
        setTransferSpeed(0);
        setProgress(0);
    };

    const sendQueuedFiles = () => {
        if (!isInitiatorRef.current) {
            return;
        }
        if (!peer.current) {
            log('No hay conexión P2P');
            return;
        }
        if (pendingFilesRef.current.length === 0) {
            log('No hay archivos en cola');
            return;
        }
        autoSendFiles();
    };

    return {
        status,
        logs,
        progress,
        currentFileInfo,
        transferSpeed,
        sendingState,
        startConnection,
        sendFile,
        initializeSession,
        queueFilesForSending,
        pauseSending,
        resumeSending,
        cancelSending,
        sendQueuedFiles
    };
};