// Importa definição de configuração do Vite
import { defineConfig } from 'vite'

// Importa suporte ao React
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { fileURLToPath, URL } from 'node:url'

// Permite definir o base path via variável de ambiente para suportar subdiretórios
const base = process.env.VITE_BASE_PATH || '/'

// Exporta a configuração do Vite
export default defineConfig({
  // Garante que os caminhos sejam resolvidos a partir da raiz ou sub-path configurado
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Aplica os plugins
  plugins: [
    react(),                 // Ativa plugin React
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 12', 'Safari >= 12'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],

  // Corrige erro de WebSocket (HMR)
  server: {
    host: '0.0.0.0',          // Permite acesso externo (ex.: dispositivos móveis)
    port: 5173,               // Define a porta fixa do Vite
    strictPort: true,         // Garante que o Vite use essa porta
    hmr: {
      protocol: 'ws',         // Usa WebSocket sem SSL
      host: '0.0.0.0',        // Garante que o HMR esteja acessível externamente
      port: 5173              // Garante que o HMR use a mesma porta do Vite
    }
  },

  // Configuração de testes com Vitest
  test: {
    environment: 'jsdom',
    globals: true
  }
})
