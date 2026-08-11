import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    env: {
      POSTGRES_URL: 'postgresql://user:pass@ep-test.neon.tech/db?sslmode=require',
      POSTGRES_URL_NON_POOLING: 'postgresql://user:pass@ep-test.neon.tech/db?sslmode=require',
    },
  },
});
