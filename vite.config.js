// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../www',
    emptyOutDir: true
  }
});
