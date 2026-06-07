import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	server: {
		host: '0.0.0.0',
		hmr: {
			host: '0.0.0.0'
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			manifest: {
				name: 'Cuicuit',
				short_name: 'Cuicuit',
				description:
					'Your favorite kitchen companion! Get pantry-aware meal recommendations from recipes you love and share with friends.',
				start_url: '/recipes',
				scope: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#faf9f5',
				icons: [
					{
						src: '/cuicuit_logo.jpg',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable any'
					}
				]
			},
			workbox: {
				globPatterns: [
					'client/**/*.{js,css,ico,png,svg,webp,webmanifest,html}',
					'prerendered/**/*.{html,json}'
				],
				navigateFallback: '/app-shell',
				navigateFallbackAllowlist: [
					/^\/$/,
					/^\/recipes/,
					/^\/pantry/,
					/^\/settings/
					// Add any other paths belonging to your (app) group here
				],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: { maxEntries: 20 }
						}
					}
				]
			},
			includeAssets: ['favicon.png'],
			devOptions: {
				enabled: true
			}
		})
		// visualizer({
		// 	// Plugin used to generate a visual representation of the production bundle.
		// 	// It generates an HTML file with a treemap of the bundle size.
		// 	// Run `npm run build` and open `.svelte-kit/output/client/stats.html` in
		// 	// your browser to see the treemap.
		// 	emitFile: true,
		// 	filename: 'stats.html'
		// })
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
