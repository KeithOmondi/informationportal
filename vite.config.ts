import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { 
        enabled: false, // 👈 disable in dev — test PWA with npm run build && npm run preview
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'HC information Portal',
        short_name: 'HC Portal',
        description: 'high court information portal',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        id: '/',
        icons: [
          { src: '/icon/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          {
            src: '/icon/screenshot-desktop.png',
            sizes: '2560x1600',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/icon/screenshot-mobile.png',
            sizes: '780x1688',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    })
  ],
});