import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      // Mock WASM for SSR
      ...(process.env.npm_lifecycle_event === 'build:server' ? { 'sigremove_rs': './src/mocks/sigremove_rs.ts' } : {})
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    manifest: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }

});
