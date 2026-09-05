import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800, // Lower threshold to catch large chunks
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split WebMCP utilities
          if (id.includes('webMcp.ts')) {
            return 'webmcp-utils';
          }
          // Split React icons
          if (id.includes('lucide-react')) {
            return 'lucide-icons';
          }
          // Let Vite handle PDF libraries via natural code splitting
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },

    },
    reportCompressedSize: true,
  },
})
