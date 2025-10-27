// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Enable server-side rendering for API routes
  // This allows POST/PUT/DELETE requests to API endpoints
  output: 'server',
  integrations: [react(), tailwind()],
});
