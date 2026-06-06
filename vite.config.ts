import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
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
		VitePWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			manifest: {
				name: 'Cuicuit',
				short_name: 'Cuicuit',
				description:
					'Your favorite kitchen companion! Get pantry-aware meal recommendations and share with friends.',
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
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
				navigateFallback: '/offline.html',
				navigateFallbackDenylist: [/^\/api\//, /^\/(auth)\//],
				globIgnores: ['**/stats.html'],
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
			includeAssets: ['favicon.png', 'offline.html'],
			devOptions: {
				enabled: true
			}
		}),
		visualizer({
			// Plugin used to generate a visual representation of the production bundle.
			// It generates an HTML file with a treemap of the bundle size.
			// Run `npm run build` and open `.svelte-kit/output/client/stats.html` in
			// your browser to see the treemap.
			emitFile: true,
			filename: 'stats.html'
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
