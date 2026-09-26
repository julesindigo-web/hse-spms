import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'brand/pa-logo.png'],
      manifest: {
        name: 'Safety Patrol — PT Sifang Mining Indonesia',
        short_name: 'Safety Patrol',
        description: 'Offline-first safety patrol management (Blueprint v2.0). Product Design by Priastama Adiyoga.',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'id-ID',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'brand/pa-logo.png', sizes: '1536x1024', type: 'image/png', purpose: 'any' },
          { src: 'brand/pa-logo-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
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
