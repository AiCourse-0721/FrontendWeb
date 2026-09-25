import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/FrontendWeb/',

  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,

    allowedHosts: ['escapable-hamburger-asparagus.ngrok-free.dev'],

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },

      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})