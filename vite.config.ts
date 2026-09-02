import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8086',
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        app: './app.html',
        luxe: './luxe.html',
        'auth-callback': './auth-callback.html',
      }
    }
  }
})
