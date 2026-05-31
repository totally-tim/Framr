import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' blob: data:; " +
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
  "worker-src 'self' blob:; " +
  "base-uri 'self'; " +
  "form-action 'none';";

// Injects the production CSP meta tag into index.html during `vite build`.
// Dev keeps the document CSP-free because Vite's React plugin emits an
// inline React-refresh preamble that script-src 'self' would block.
function cspMetaPlugin(): Plugin {
  return {
    name: 'framr:csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<title>/,
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <title>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), cspMetaPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zip: ['jszip', 'file-saver']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
})
