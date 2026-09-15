import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // MV3 pages cannot load ES module chunks from a relative path reliably,
    // so keep the popup as a single self-contained bundle.
    rollupOptions: {
      input: { popup: 'popup.html' },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
