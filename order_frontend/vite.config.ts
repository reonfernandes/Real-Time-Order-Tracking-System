import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // backend allows http://localhost:3000 by default, so keeping the same port here
    port: 3000,
  },
})
