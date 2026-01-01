import { Github, Linkedin, Globe, Zap, Lock, Code2 } from 'lucide-react';

function Footer() {
  return (
    <footer className="backdrop-blur-md bg-amber-50/80 border-t border-orange-200/50 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5 text-orange-600" />
              <span className="font-mono font-bold text-orange-600">Frann.Dev</span>
            </div>
            <p className="text-sm text-stone-600">
              Transferencia de archivos P2P segura y rápida
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-stone-800 mb-4 text-sm uppercase tracking-wider">Enlaces</h3>
            <ul className="space-y-3 text-sm text-stone-600">
              <li>
                <a 
                  href="https://github.com/Frann-Avila1411" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/in/franklin-avila-dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://avila-frann-dev.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Portfolio</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-stone-800 mb-4 text-sm uppercase tracking-wider">Acerca de</h3>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" /> WebRTC P2P
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" /> Conexión Segura
              </li>
              <li className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-600" /> Open Source
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-orange-200/50 my-6"></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-stone-500">
          <p>
            Desarrollado por 
            <span className="font-mono font-bold text-orange-600 ml-1">Frann.Dev</span>
          </p>
          <p className="mt-4 md:mt-0">
            © 2026 ShareFlow. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
