import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	// Relative base so the build works from any path (local server or private hosting).
	base: './',
	plugins: [vue()],
	// Fixed port: fail loudly instead of silently moving to 5174 next to a stale server.
	server: { port: 5173, strictPort: true },
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
});
