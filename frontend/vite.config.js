import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills() // plugin para polyfills de Node.js
  ],
  define: {
    global: 'window', // respalda para algunas librerías que esperan "global" como en Node.js
  },
})
