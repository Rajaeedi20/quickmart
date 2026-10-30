import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/payments': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
    },
  },
})
