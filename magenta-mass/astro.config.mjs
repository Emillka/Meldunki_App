// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Server-side rendering for API routes
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react(), tailwind()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 10000
  },
  // Ensure proper environment variable handling
  vite: {
    define: {
      'process.env': process.env
    }
  }
});
