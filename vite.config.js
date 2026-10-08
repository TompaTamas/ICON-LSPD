import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// A './' alap miatt az oldal bármilyen GitHub Pages útvonal alatt működik (pl. /ICON-LSPD/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  test: { environment: 'node' },
});
