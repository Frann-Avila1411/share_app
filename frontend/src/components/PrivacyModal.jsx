import { X, Shield, Lock, Eye, Server, Zap, CheckCircle } from 'lucide-react';

function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200/50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-orange-200/50 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-stone-800">
              Tu Privacidad es lo Primero
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hero Message */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <Lock className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              100% Privado y Seguro
            </h3>
            <p className="text-green-700 text-sm">
              Tus archivos <strong>NUNCA</strong> pasan por los servidores. 
              La transferencia es directa entre tus dispositivos.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/60 border border-orange-200/50 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-1">Peer-to-Peer (P2P)</h4>
                  <p className="text-sm text-stone-600">
                    Conexión directa entre dispositivos usando <strong>WebRTC</strong>. 
                    No hay intermediarios.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 border border-orange-200/50 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-red-100 rounded-lg">
                  <Server className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-1">Sin Almacenamiento</h4>
                  <p className="text-sm text-stone-600">
                    Los archivos <strong>NO se guardan</strong> en ningún servidor. 
                    Viajan directamente de un dispositivo a otro.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 border border-orange-200/50 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-purple-100 rounded-lg">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-1">Cifrado Extremo a Extremo</h4>
                  <p className="text-sm text-stone-600">
                    WebRTC utiliza <strong>DTLS-SRTP</strong> para cifrar 
                    los datos durante la transferencia.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 border border-orange-200/50 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-green-100 rounded-lg">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-1">Sin Rastreo</h4>
                  <p className="text-sm text-stone-600">
                    No recopilamos datos personales, no usamos cookies de seguimiento, 
                    ni compartimos información con terceros.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl p-6">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              ¿Cómo Funciona?
            </h3>
            <ol className="space-y-3 text-sm text-stone-700">
              <li className="flex gap-3">
                <span className="font-bold text-orange-600 min-w-[24px]">1.</span>
                <span>
                  El <strong>host</strong> genera un código QR único para la sala.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-orange-600 min-w-[24px]">2.</span>
                <span>
                  El <strong>invitado</strong> escanea el QR y se conecta a la sala.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-orange-600 min-w-[24px]">3.</span>
                <span>
                  Nuestro servidor solo actúa como <strong>"mensajero"</strong> para coordinar 
                  la conexión inicial (señalización WebRTC).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-orange-600 min-w-[24px]">4.</span>
                <span>
                  Una vez conectados, los archivos fluyen <strong>directamente</strong> entre 
                  los dispositivos sin pasar por servidores.
                </span>
              </li>
            </ol>
          </div>

          {/* Technical Details */}
          <div className="bg-white/60 border border-orange-200/50 rounded-2xl p-6">
            <h3 className="font-bold text-stone-800 mb-3 text-sm uppercase tracking-wider">
              Detalles Técnicos
            </h3>
            <ul className="space-y-2 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Protocolo:</strong> WebRTC Data Channels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Cifrado:</strong> DTLS 1.2 + SRTP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Señalización:</strong> WebSockets (solo para coordinar, no para archivos)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Código Abierto:</strong> Puedes revisar todo el código en GitHub</span>
              </li>
            </ul>
          </div>

          {/* Footer Message */}
          <div className="text-center pt-4">
            <p className="text-xs text-stone-500">
              Desarrollado por <span className="font-mono font-bold text-orange-600">Frann.Dev</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">
              ShareFlow - Transferencia P2P Segura © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyModal;
