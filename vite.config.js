import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** @param {string} b */
function normalizeBase(b) {
  if (!b || b === '/') return '/'
  const left = b.startsWith('/') ? b : `/${b}`
  return left.endsWith('/') ? left : `${left}/`
}

/**
 * GitHub Pages project URL is /<repo>/.
 * Prefer VITE_BASE, then GITHUB_REPOSITORY (set automatically in GitHub Actions),
 * then this local default — wrong base = blank page (JS bundle 404).
 */
function productionBase() {
  if (process.env.VITE_BASE) return normalizeBase(process.env.VITE_BASE)
  const gh = process.env.GITHUB_REPOSITORY
  if (gh) {
    const name = gh.split('/')[1]
    if (name) return normalizeBase(`/${name}`)
  }
  return normalizeBase('/monopolly-bank')
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? productionBase() : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg'],
      manifest: {
        name: 'Банк Монополии',
        short_name: 'Монобанк',
        description: 'Банк Монополии — жесты, NFC, переводы',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-192.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2,webmanifest}'],
      },
    }),
  ],
}))
