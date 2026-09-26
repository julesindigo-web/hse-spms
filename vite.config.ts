import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Safety Patrol — PT Sifang Mining Indonesia',
        short_name: 'Safety Patrol',
        description: 'Offline-first safety patrol management (Blueprint v2.0). Product Design by Priastama Adiyoga.',
        theme_color: '#0b3b39',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'id-ID',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        // §24 cache versioning: checklist master dibedakan via revision+content_hash di runtime (lihat src/services/sync.ts),
        // workbox hanya untuk app-shell. Jangan cache Firestore/Apps Script.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: { outDir: 'dist', sourcemap: false }
});
