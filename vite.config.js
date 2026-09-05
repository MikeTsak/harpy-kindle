import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'ie >= 11', 'chrome >= 30', 'safari >= 7'],
      polyfills: true,
      modernPolyfills: true,
      modernTargets: ['chrome >= 61', 'safari >= 10.1']
    })
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      ecma: 5,
      compress: { ecma: 5, arrows: false },
      format: { ecma: 5 },
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
