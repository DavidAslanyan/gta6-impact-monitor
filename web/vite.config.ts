import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// In dev, serve the local ../data folder (the collector's output) at /data so the site works offline.
function localData(): Plugin {
  const root = resolve(__dirname, '../data')
  return {
    name: 'local-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const file = join(root, decodeURIComponent((req.url || '').split('?')[0]))
        if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'text/plain')
        createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), localData()],
  build: { chunkSizeWarningLimit: 1500 },
})
