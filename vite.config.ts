import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the app from https://<user>.github.io/STGym/
  base: command === 'build' || isPreview ? '/STGym/' : '/',
}))
