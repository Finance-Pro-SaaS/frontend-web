import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Electron production loads the compiled app through file://.
  // Relative asset URLs are required so JS/CSS/service-worker files are
  // resolved from the packaged frontend-web/dist directory.
  // Chemin absolu ('/') pour le web (Vercel) — indispensable pour que les
  // liens profonds (invitations, réinitialisation de mot de passe...)
  // trouvent les bons fichiers JS/CSS, peu importe le chemin de l'URL
  // depuis laquelle la page a été ouverte. Chemin relatif ('./') UNIQUEMENT
  // pour le build desktop (Electron, chargé via file:// sans serveur, qui
  // a besoin d'un chemin relatif pour trouver ses fichiers).
  base: process.env.VITE_BUILD_TARGET === 'electron' ? './' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finance Pro',
        short_name: 'Finance Pro',
        description:
          "Gestion financière offline-first pour ONG au Bénin et en Afrique de l'Ouest — projets, dépenses, recettes, caisse, banque, budgets, rapports.",
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0f172a',
        theme_color: '#1e40af',
        categories: ['finance', 'business', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: './index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})