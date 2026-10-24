import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	// Relative base so the build works from any path (local server or private hosting).
	base: './',
	plugins: [
		vue(),
		VitePWA({
			// Ask before reloading into a new version, so an update never interrupts a test.
			registerType: 'prompt',
			includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-64.png'],
			manifest: {
				name: 'מחוננים – תרגול',
				short_name: 'מחוננים',
				description: 'תרגול לקראת מבחן המחוננים, כיתה ב׳ שלב א׳',
				lang: 'he',
				dir: 'rtl',
				display: 'standalone',
				orientation: 'any',
				start_url: './',
				scope: './',
				// The album's blue cover: the status bar and the splash screen while it opens.
				theme_color: '#1446a0',
				background_color: '#1446a0',
				icons: [
					{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
					// Full-bleed background with the star inside the safe zone.
					{ src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
				],
			},
			workbox: {
				// Everything is precached: the app works fully offline after the first visit.
				globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
				navigateFallback: 'index.html',
			},
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	// Fixed port: fail loudly instead of silently moving to 5174 next to a stale server.
	server: { port: 5173, strictPort: true },
	preview: { port: 4173, strictPort: true },
});
