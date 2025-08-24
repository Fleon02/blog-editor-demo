import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react({
    // Desactiva strict mode para desarrollo
    strictMode: false
  })],
});
