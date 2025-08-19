// Importa definição de configuração do Vite
import { defineConfig } from 'vite'

// Importa suporte ao React
import react from '@vitejs/plugin-react'

// Importa o plugin de PWA
import { VitePWA } from 'vite-plugin-pwa'

// Exporta a configuração do Vite
export default defineConfig({
  // Aplica os plugins
  plugins: [
    react(),                 // Ativa plugin React
    VitePWA({                // Ativa PWA com configurações
      registerType: 'autoUpdate',   // Atualiza automaticamente
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'], // Ícones extras
      manifest: {
        name: 'Portal do Professor',              // Nome completo do app
        short_name: 'Professor',                  // Nome curto (exibido na tela do celular)
        description: 'Sistema de gestão de turmas e usuários para professores.',
        theme_color: '#4a148c',                   // Cor do topo do app
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [                                  // Ícones da instalação
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  // Corrige erro de WebSocket (HMR)
  server: {
    host: 'localhost',        // Define o host como localhost
    port: 5173,               // Define a porta fixa do Vite
    strictPort: true,         // Garante que o Vite use essa porta
    hmr: {
      protocol: 'ws',         // Usa WebSocket sem SSL
      host: 'localhost',      // Corrige o destino do HMR
      port: 5173              // Garante que o HMR use a mesma porta do Vite
    }
  },

  // Configuração de testes com Vitest
  test: {
    environment: 'jsdom',
    globals: true
  }
})
