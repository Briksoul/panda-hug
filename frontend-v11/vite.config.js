import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pandahug/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/pandahug/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pandahug\/api/, '/api'),
      },
    },
  },
})
