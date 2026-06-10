import { defineConfig } from 'vite';

// Simplified config for development only
// Production uses static files without build
export default defineConfig({
  base: '/Wedding-Invitation/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Build output for GitHub Pages deployment
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});