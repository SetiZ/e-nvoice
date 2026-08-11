import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/e-nvoice/',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split PDF libraries into separate chunk loaded on demand
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          if (id.includes('pdf-lib')) {
            return 'pdf-lib';
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }
          // Split WebMCP and invoice generation utilities
          if (id.includes('webMcp.ts') || id.includes('facturx.ts')) {
            return 'webmcp-utils';
          }
          // Split PDF generator
          if (id.includes('pdfGenerator.ts') || id.includes('LazyPdfGenerator.tsx')) {
            return 'pdf-generator';
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
