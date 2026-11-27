import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
export default defineConfig({ server: { allowedHosts: ['atlas.blakeoxford.com'] }, plugins: [cloudflare({ inspectorPort: false })] });
