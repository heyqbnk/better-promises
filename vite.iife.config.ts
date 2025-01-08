import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      name: 'betterPromises',
      entry: 'src/index.ts',
      formats: ['iife'],
      fileName: 'index',
    },
  },
});