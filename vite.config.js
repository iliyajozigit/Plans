import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Plans/',
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
