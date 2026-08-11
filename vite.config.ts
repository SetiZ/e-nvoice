import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/e-nvoice/',
  build: {
    sourcemap: false,
    // Suppress warning for PDF chunk which is intentionally large
    // (jspdf + pdf-lib = ~895KB, loaded only when generating invoices)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large libraries into separate chunks
          if (id.includes('jspdf') || id.includes('pdf-lib')) {
            return 'pdf';
          }
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    reportCompressedSize: true,
  },
})
