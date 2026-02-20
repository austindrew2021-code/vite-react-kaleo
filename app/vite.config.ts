import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
// Cache bust: force rebuild to pick up VITE_STRIPE_PUBLISHABLE_KEY env var
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@stripe/stripe-js'], // helps with ESM deps
  },
});
