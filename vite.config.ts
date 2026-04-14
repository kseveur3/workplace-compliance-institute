import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/ceu-access': { target: 'http://localhost:3000', changeOrigin: true },
      '/ceu-complete': { target: 'http://localhost:3000', changeOrigin: true },
      '/my-certification': { target: 'http://localhost:3000', changeOrigin: true },
      '/payment-status': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
