import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Default GitHub repository segment for Pages. Override with VITE_BASE=/my-repo/
const defaultProdBase = '/monopolly-bank/'

export default defineConfig(({ mode }) => ({
  base:
    process.env.VITE_BASE ??
    (mode === 'production' ? defaultProdBase : '/'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg'],
      manifest: {
        name: 'Monopoly Bank',
        short_name: 'MonoBank',
        description: 'Monopoly banking — drag, pay, NFC',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
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
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
      },
    }),
  ],
}))
