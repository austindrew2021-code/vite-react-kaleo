import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        // Auto-inject Buffer into every chunk that references it.
        // Required by @solana/spl-token and @solana/web3.js in browser builds.
        inject({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@stripe/stripe-js', 'buffer'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
});
