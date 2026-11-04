import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { activeSocialLinks } from './src/config/social';

/**
 * Ajoute sameAs au JSON-LD de l'organisation (index.html) à partir de src/config/social.ts.
 * Tant qu'aucune adresse n'est renseignée, la propriété est absente.
 */
const sameAsJsonLd = (): Plugin => ({
  name: 'ecosurv-jsonld-sameas',
  transformIndexHtml(html) {
    const urls = activeSocialLinks().map((l) => l.url);
    const sameAs = urls.length > 0 ? `,\n            "sameAs": ${JSON.stringify(urls)}` : '';
    return html.replace('__SAME_AS__', sameAs);
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sameAsJsonLd()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
