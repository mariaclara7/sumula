import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Em desenvolvimento, /api/salas vai para o Worker do site (npx wrangler dev) e o resto de /api para a
    // api-sumula rodando localmente.
    proxy: {
      '/api/salas': 'http://localhost:8787',
      '/api': 'http://localhost:5080',
    },
  },
})
