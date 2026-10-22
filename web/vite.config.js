import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' = works on GitHub Pages under /repo-name/ without extra config
export default defineConfig({
  base: './',
  plugins: [react()],
})
