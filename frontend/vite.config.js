import { cwd } from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const userServiceUrl = env.VITE_USER_SERVICE_URL || 'http://localhost:8082'
  const productServiceUrl = env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:8081'
  const paymentServiceUrl = env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:8083'
  const userServiceProxy = {
    target: userServiceUrl,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyRequest) => {
        proxyRequest.removeHeader('origin')
      })
    },
  }
  const paymentServiceProxy = {
    target: paymentServiceUrl,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyRequest) => {
        proxyRequest.removeHeader('origin')
      })
    },
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/auth': userServiceProxy,
        '/api/admin': userServiceProxy,
        '/api/products': {
          target: productServiceUrl,
          changeOrigin: true,
        },
        '/api/categories': {
          target: productServiceUrl,
          changeOrigin: true,
        },
        '/uploads/products': {
          target: productServiceUrl,
          changeOrigin: true,
        },
        '/api/payments': paymentServiceProxy,
      },
    },
  }
})
