import { useState } from 'react';
import { Share2, Shield } from 'lucide-react';
import PrivacyModal from './PrivacyModal';

function Navbar() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-amber-50/80 border-b border-amber-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition cursor-pointer"></div>
            </div>
            <Share2 className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="font-mono font-bold text-lg bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Frann.Dev
            </span>
          </div>

          {/* Center Title */}
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-stone-800">
              Share<span className="text-orange-600">Flow</span>
            </h1>
            <p className="text-xs text-stone-500 font-light">P2P File Transfer</p>
          </div>

          {/* Privacy Button */}
          <button
            onClick={() => setShowPrivacy(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 border border-orange-200/50 hover:border-orange-300 transition-all duration-200 group"
            title="Privacidad y Seguridad"
          >
            <Shield className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-stone-700 hidden md:inline">Privacidad</span>
          </button>
        </div>
      </nav>

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
}

export default Navbar;
