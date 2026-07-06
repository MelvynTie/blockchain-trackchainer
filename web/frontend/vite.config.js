import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'client/static',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'client/common.js'),
      output: {
        entryFileNames: 'js/common.bundle.js',
        format: 'iife'
      }
    }
  }
});
