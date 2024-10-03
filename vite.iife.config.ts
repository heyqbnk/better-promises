import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      name: 'enhancedPromise',
      entry: 'src/index.ts',
      formats: ['iife'],
      fileName: 'index',
    },
  },
});