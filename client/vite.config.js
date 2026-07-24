import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Transportation API Proxy
      '/api/students': { target: 'http://localhost:5001', changeOrigin: true },
      '/api/routes': { target: 'http://localhost:5001', changeOrigin: true },
      '/api/fee': { target: 'http://localhost:5001', changeOrigin: true },
      
      // AOB API Proxy
      '/api/alumni': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/milestones': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/meetings': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/communications': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/analytics': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/audit': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/gmail': { target: 'http://localhost:5002', changeOrigin: true },
    }
  }
})
