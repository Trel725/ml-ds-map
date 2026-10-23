import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { contentPlugin } from './src/data/vitePlugin';

export default defineConfig({
  base: './',
  plugins: [react(), contentPlugin({ dir: 'content', strict: process.env.CONTENT_STRICT === '1' })],
});
