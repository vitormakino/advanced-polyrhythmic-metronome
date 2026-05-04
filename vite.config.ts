import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/advanced-polyrhythmic-metronome/',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'Advanced Polyrhythmic Metronome',
          short_name: 'Metronome',
          description: 'A professional-grade metronome and polyrhythm study tool.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          icons: [
            {
              src: 'images/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'images/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'monochrome'
            }
          ],
          screenshots: [
            {
              src: 'images/screenshot-wide.jpg',
              sizes: '1280x720',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Polyrhythm Metronome Desktop'
            },
            {
              src: 'images/screenshot-narrow.jpg',
              sizes: '720x1280',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Polyrhythm Metronome Mobile'
            }
          ]
        }
      })
    ],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
