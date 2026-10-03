import { defineConfig } from 'vite';

// Test runs write to tmp/; watching it reloads the page and on Windows can crash the dev server (EBUSY).
export default defineConfig({ base: './', server: { watch: { ignored: ['**/tmp/**'] } } });
