import { useState, useEffect } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  // Detectar si somos Guest (desde QR) o Host (genera sala)
  const [isGuest, setIsGuest] = useState(false);
  const [guestRoomId, setGuestRoomId] = useState(null);

  // Estados para Host
  const [appState, setAppState] = useState('SELECTING_FILES'); // SELECTING_FILES, WAITING_CONNECTION, TRANSFERRING
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [hostRoomId, setHostRoomId] = useState(null);
  const [manualRoomInput, setManualRoomInput] = useState('');

  // URL dinámica
  const BASE_URL = window.location.origin;

  // Determinar si somos Guest o Host
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');

    console.log('Detectando URL:', window.location.href);
    console.log('Parámetro room:', roomFromUrl);
    console.log('isGuest actual:', isGuest);

    // Solo detectar si aún no hemos determinado nuestro rol
    if (!isGuest && !hostRoomId && roomFromUrl) {
      // Somos Guest -> conectar automáticamente
      console.log('Detectado como GUEST, room:', roomFromUrl);
      setIsGuest(true);
      setGuestRoomId(roomFromUrl);
    } else if (!isGuest && !hostRoomId && !roomFromUrl) {
      console.log('Detectado como HOST (sin room en URL)');
    }
  }, []);

  // Hook solo se inicializa si somos Guest O si Host ha generado sala
  const roomId = isGuest ? guestRoomId : hostRoomId;
  const {
    status,
    logs,
    initializeSession,
    queueFilesForSending,
    progress,
    currentFileInfo,
    transferSpeed,
    sendingState,
    pauseSending,
    resumeSending,
    cancelSending,
    sendQueuedFiles
  } = useWebRTC(roomId);

  // Auto-conectar si somos Guest
  useEffect(() => {
    console.log('useEffect auto-conectar:', { isGuest, guestRoomId, appState });

    if (isGuest && guestRoomId && appState === 'SELECTING_FILES') {
      console.log('Iniciando conexión como GUEST con room:', guestRoomId);
      // Conectar automáticamente como Receptor, pasando guestRoomId directamente
      initializeSession(false, guestRoomId);
      setAppState('WAITING_CONNECTION');
    }
  }, [isGuest, guestRoomId, appState]);

  // Cambiar a TRANSFERRING cuando P2P está conectado
  useEffect(() => {
    if (status.includes('P2P')) {
      setAppState('TRANSFERRING');
    }
  }, [status]);

  //HANDLERS PARA HOST

  // Manejar adición de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(prev => {
      const newFiles = [...prev];
      files.forEach(file => {
        // Evitar duplicados
        if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
          newFiles.push(file);
        }
      });
      return newFiles;
    });
  };

  // Eliminar archivo de la cola
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Compartir archivos (generar sala y conectar)
  const handleShareFiles = () => {
    if (selectedFiles.length === 0) return;

    console.log('handleShareFiles ejecutado');
    const newRoomId = uuidv4();
    console.log('Room ID generado:', newRoomId);

    // Agregar archivos a la cola del hook
    queueFilesForSending(selectedFiles);
    console.log('queueFilesForSending ejecutado');

    // Iniciar conexión como initiator, pasando el newRoomId directamente
    initializeSession(true, newRoomId);
    console.log('initializeSession(true, newRoomId) ejecutado');

    // Actualizar estado (después de inicializar conexión)
    setHostRoomId(newRoomId);
    console.log('setHostRoomId ejecutado');

    // Cambiar estado
    setAppState('WAITING_CONNECTION');
    console.log('setAppState WAITING_CONNECTION ejecutado');
  };

  // Permitir agregar más archivos mientras espera conexión
  const handleAddMoreFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const updatedFiles = [...selectedFiles];
    files.forEach(file => {
      if (!updatedFiles.some(f => f.name === file.name && f.size === file.size)) {
        updatedFiles.push(file);
      }
    });

    setSelectedFiles(updatedFiles);
    queueFilesForSending(updatedFiles);
  };

  // Agregar más archivos cuando ya hay conexión P2P activa
  const handleAddMoreWhileConnected = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const updatedFiles = [...selectedFiles];
    files.forEach(file => {
      if (!updatedFiles.some(f => f.name === file.name && f.size === file.size)) {
        updatedFiles.push(file);
      }
    });

    setSelectedFiles(updatedFiles);
    queueFilesForSending(updatedFiles);

    if (!isGuest && status.includes('P2P')) {
      sendQueuedFiles();
      setAppState('TRANSFERRING');
    }
  };

  // Conectar manualmente con un room ID
  const handleManualConnect = (manualRoomId) => {
    if (!manualRoomId || manualRoomId.trim() === '') return;
    console.log('Conectando manualmente a room:', manualRoomId);
    setIsGuest(true);
    setGuestRoomId(manualRoomId.trim());
  };

  // Copiar al portapapeles de forma segura
  const copyToClipboard = (text, label) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`copiado al portapapeles`);
      }).catch(() => {
        // Fallback: copiar manualmente
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert(`copiado al portapapeles`);
      });
    } else {
      // Fallback sin clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert(`copiado al portapapeles`);
    }
  };

  // render principal

  // === VISTA PARA GUEST ===
  if (isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-stone-800 font-sans flex flex-col">
        <Navbar />

        <div className="flex-grow flex flex-col items-center justify-center p-6">
          {/* Estado de Conexión */}
          <div className={`px-4 py-2 rounded-full text-xs font-bold mb-8 backdrop-blur-sm transition-all duration-300
            ${status.includes('P2P')
              ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm'
              : 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'}`}>
            ● {status}
          </div>

          {/* Esperando Conexión */}
          {!status.includes('P2P') && (
            <div className="text-center w-full max-w-md">
              <p className="text-stone-700 font-medium text-lg mb-2">Esperando archivos...</p>
              <p className="text-stone-500 text-sm mb-6">El emisor debe escanear el QR</p>

              {/* Info de conexión */}
              <div className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-lg p-4 text-left text-xs mb-6">
                <div className="mb-2">
                  <p className="text-stone-600 font-medium">Estado de conexión:</p>
                  <p className={`${status.includes('WebSocket') ? 'text-green-600' : 'text-yellow-600'}`}>
                    {status}
                  </p>
                </div>
                <div className="text-[10px] text-stone-500">
                  <p>Room: <code className="bg-stone-100 px-1 rounded">{guestRoomId?.substring(0, 8)}...</code></p>
                  <p>Servidor: <code className="bg-stone-100 px-1 rounded">{window.location.hostname}:8000</code></p>
                </div>
              </div>

              {/* Si el QR falla, opción manual */}
              {!status.includes('WebSocket') && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-700 text-xs font-medium mb-3">¿El QR no funcionó?</p>
                  <p className="text-stone-600 text-xs mb-3">Pide al emisor que copie el código de la sala:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pega el código aquí"
                      value={manualRoomInput}
                      onChange={(e) => setManualRoomInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => {
                        handleManualConnect(manualRoomInput);
                        setManualRoomInput('');
                      }}
                      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Conectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recibiendo Archivos */}
          {status.includes('P2P') && (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <p className="text-stone-700 font-medium text-lg">Recibiendo archivos...</p>
              </div>

              {/* Barra de Progreso */}
              {progress > 0 && (
                <div className="backdrop-blur-sm bg-white/70 border border-orange-200 rounded-3xl overflow-hidden shadow-sm">
                  <div
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <p className="text-center py-3 text-orange-700 font-semibold">{progress}%</p>
                </div>
              )}

              {currentFileInfo && (
                <div className="mt-4 bg-white/80 border border-orange-200 rounded-2xl p-4 text-sm text-stone-700 shadow-sm">
                  <p className="font-semibold mb-1">{currentFileInfo.direction === 'receive' ? 'Recibiendo' : 'Enviando'}: {currentFileInfo.name}</p>
                  <p className="text-xs text-stone-600">
                    {`Velocidad: ${(transferSpeed || 0).toFixed(2)} MB/s`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  }

  // === VISTA PARA HOST ===

  const SHARE_URL = hostRoomId ? `${BASE_URL}/?room=${hostRoomId}` : '';
  const filesReady = selectedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-stone-800 font-sans flex flex-col">
      <Navbar />

      <div className="flex-grow flex flex-col items-center p-6">
        {/* Estado de Conexión (solo si está activo) */}
        {appState !== 'SELECTING_FILES' && (
          <div className={`px-4 py-2 rounded-full text-xs font-bold mb-8 backdrop-blur-sm transition-all duration-300
            ${status.includes('P2P')
              ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm'}`}>
            ● {status}
          </div>
        )}

        {/* ESTADO 1: Seleccionando Archivos */}
        {appState === 'SELECTING_FILES' && (
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-stone-800 mb-2">Selecciona tus Archivos</h1>
              <p className="text-stone-600">Elige qué deseas compartir</p>
            </div>

            {/* Área de Drag & Drop */}
            <label className="block w-full h-56 border-2 border-dashed border-orange-400 rounded-3xl flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm bg-orange-50/70 hover:bg-orange-100/70 hover:border-orange-500 transition-all duration-300 shadow-md hover:shadow-lg">
              <span className="text-stone-700 font-medium">Arrastra archivos aquí</span>
              <span className="text-xs text-stone-500 mt-2">o haz clic para seleccionar</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Lista de Archivos Seleccionados */}
            {filesReady && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
                  Archivos Seleccionados ({selectedFiles.length})
                </h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border border-orange-200 rounded-xl hover:bg-white/90 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-700 truncate">{file.name}</p>
                          <p className="text-xs text-stone-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="flex-shrink-0 ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botón Compartir */}
                <button
                  onClick={handleShareFiles}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-orange-500/30 active:scale-95 text-lg flex items-center justify-center gap-2"
                >
                  Compartir Archivos
                </button>
              </div>
            )}

            {!filesReady && (
              <p className="text-center text-stone-500 text-sm mt-8">
                Selecciona al menos un archivo para continuar
              </p>
            )}
          </div>
        )}

        {/* ESTADO 2: Esperando Conexión (Mostrando QR) */}
        {appState === 'WAITING_CONNECTION' && (
          <div className="w-full max-w-md">
            <div className="backdrop-blur-sm bg-white/70 border border-orange-200/50 p-8 rounded-3xl shadow-xl text-center hover:shadow-2xl transition-all duration-300">
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md mb-6">
                <QRCode value={SHARE_URL} size={220} />
              </div>

              <h2 className="text-xl font-bold text-stone-800 mb-2">Comparte este código</h2>
              <p className="text-stone-700 text-sm font-medium mb-4">
                Escanea con el otro dispositivo
              </p>

              {/* URL alternativa */}
              <div className="bg-amber-100/70 border border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-stone-600 mb-3 font-medium">Opción 1: Escanea el QR arriba</p>

                <p className="text-xs text-stone-600 mb-2 font-medium">Opción 2: Copia el código de la sala:</p>
                <div className="bg-white rounded-lg p-2 mb-3 font-mono text-sm font-bold text-center text-orange-600 break-all">
                  {hostRoomId}
                </div>
                <button
                  onClick={() => copyToClipboard(hostRoomId, 'Código')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors mb-3"
                >
                  Copiar Código
                </button>

                <p className="text-xs text-stone-600 mb-2 font-medium">Opción 3: Copia el enlace completo:</p>
                <p className="text-stone-700 text-xs break-all font-mono bg-stone-100 p-2 rounded mb-2">
                  {SHARE_URL}
                </p>
                <button
                  onClick={() => copyToClipboard(SHARE_URL, 'Enlace')}
                  className="w-full bg-stone-500 hover:bg-stone-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Copiar Enlace
                </button>
              </div>

              {/* Información de archivos */}
              <div className="mb-6 bg-stone-100/50 rounded-lg p-4">
                <p className="text-stone-700 font-semibold">
                  {selectedFiles.length} archivo(s) listos para enviar
                </p>
                <p className="text-stone-600 text-xs mt-2">
                  Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {/* Permitir agregar más archivos */}
              <label className="block w-full mb-4 border border-dashed border-stone-300 rounded-lg p-3 cursor-pointer hover:border-stone-400 transition-colors">
                <span className="text-stone-600 text-xs font-medium">+ Agregar más archivos</span>
                <input
                  type="file"
                  multiple
                  onChange={handleAddMoreFiles}
                  className="hidden"
                />
              </label>

              {/* Botón de cancelar */}
              <button
                onClick={() => {
                  setAppState('SELECTING_FILES');
                  setHostRoomId(null);
                  setSelectedFiles([]);
                }}
                className="w-full bg-stone-300 hover:bg-stone-400 text-stone-800 font-medium py-2 rounded-lg transition-colors text-sm"
              >
                ← Volver
              </button>
            </div>
          </div>
        )}

        {/* ESTADO 3: Transfiriendo */}
        {appState === 'TRANSFERRING' && (
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-stone-800 mb-2">Enviando Archivos</h2>
              <p className="text-stone-600">
                {selectedFiles.length} archivo(s) ·
                {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Barra de Progreso */}
            <div className="backdrop-blur-sm bg-white/70 border border-orange-200 rounded-3xl overflow-hidden shadow-sm mb-4">
              <div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 transition-all duration-200 shadow-md"
                style={{ width: `${progress}%` }}
              ></div>
              <p className="text-center py-4 text-orange-700 font-bold text-lg">{progress}%</p>
            </div>

            {currentFileInfo && (
              <div className="bg-white/85 border border-orange-200 rounded-2xl p-4 shadow-sm mb-4 text-sm text-stone-700">
                <p className="font-semibold mb-1">
                  {currentFileInfo.direction === 'send' ? 'Enviando' : 'Recibiendo'} archivo {currentFileInfo.index}/{currentFileInfo.total}
                </p>
                <p className="text-xs text-stone-600 break-all">{currentFileInfo.name}</p>
                <p className="text-xs text-stone-500 mt-1">
                  {(currentFileInfo.size / 1024 / 1024).toFixed(2)} MB · Velocidad: {(transferSpeed || 0).toFixed(2)} MB/s
                </p>
              </div>
            )}

            {!isGuest && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={sendingState === 'paused' ? resumeSending : pauseSending}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-semibold transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                  disabled={sendingState === 'done' || sendingState === 'cancelled' || progress === 0}
                >
                  {sendingState === 'paused' ? 'Reanudar' : 'Pausar'}
                </button>
                <button
                  onClick={() => {
                    cancelSending();
                    setAppState('SELECTING_FILES');
                    setSelectedFiles([]);
                    setHostRoomId(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-semibold transition-colors bg-red-500 hover:bg-red-600"
                  disabled={progress === 0}
                >
                  Cancelar
                </button>
              </div>
            )}

            {!isGuest && (
              <label className="block w-full mb-4 border border-dashed border-stone-300 rounded-lg p-3 cursor-pointer hover:border-stone-400 transition-colors text-center text-sm font-medium text-stone-700">
                <span>+ Enviar más archivos</span>
                <input
                  type="file"
                  multiple
                  onChange={handleAddMoreWhileConnected}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;