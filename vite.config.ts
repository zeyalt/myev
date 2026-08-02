import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'myev — EV Insights',
        short_name: 'myev',
        description: 'EV charging analytics & expense tracking',
        theme_color: '#05070d',
        background_color: '#05070d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Neon Data API endpoints look like https://<endpoint>.apirest.<region>.aws.neon.tech/...
            urlPattern: ({ url }: { url: URL }) => url.hostname.includes('.apirest.') && url.hostname.endsWith('.neon.tech'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'neon-data-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.endsWith('frankfurter.app') || url.hostname.endsWith('frankfurter.dev'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fx-rates',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
