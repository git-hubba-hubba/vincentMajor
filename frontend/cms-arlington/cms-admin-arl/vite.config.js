import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build') {
    let apiUrl
    try { apiUrl = new URL(env.VITE_API_URL) } catch {
      throw new Error('Set VITE_API_URL to the public backend URL ending in /api before building. On Render, set it in the frontend service Environment settings.')
    }
    if (apiUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname) || apiUrl.pathname.replace(/\/$/, '') !== '/api') {
      throw new Error('VITE_API_URL must be a public HTTPS backend URL ending in /api, not localhost.')
    }
  }
  return { plugins: [react()] }
})
