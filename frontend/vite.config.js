import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // chunk size limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // W dev mode proxuj API do backendu (tylko dev)
    proxy: {
      '/api': 'http://localhost:8001',
    },
  },
})
