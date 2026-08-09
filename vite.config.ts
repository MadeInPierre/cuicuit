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
				display: 'standalone',
				display_override: ['standalone', 'window-controls-overlay'],
				orientation: 'natural',
				scope: '/',
				lang: 'en',
				id: 'cuicuit',
				dir: 'ltr',
				background_color: '#faf9f5',
				theme_color: '#faf9f5',
				categories: ['food', 'health', 'shopping'],
				edge_side_panel: {
					preferred_width: 400
				},
				file_handlers: [],
				protocol_handlers: [],
				prefer_related_applications: false,
				related_applications: [],
				share_target: {
					action: '/shared-content-receiver/',
					enctype: 'application/x-www-form-urlencoded',
					method: 'GET',
					params: {
						url: 'url',
						text: 'text',
						title: 'title'
						// files:
					}
				},
				iarc_rating_id: '',
				// @ts-ignore Defined in pwabuilder.com
				widgets: [],
				shortcuts: [
					{
						name: 'Recipes',
						url: '/recipes',
						description: 'Find recipes'
					},
					{
						name: 'Plan',
						url: '/plan',
						description: 'Managed your meal plan'
					},
					{
						name: 'Shopping List',
						url: '/shopping-list',
						description: 'Jump to your groceries'
					}
				],
				screenshots: [
					{
						src: '/screenshots/recipes_wide_1280x720.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide'
					},
					{
						src: '/screenshots/shoppinglist_mobile_487x911.png',
						sizes: '487x911',
						type: 'image/png',
						form_factor: 'narrow'
					}
				],
				icons: [
					{
						src: '/icons/favicon/apple-touch-icon.png',
						sizes: '180x180'
					},
					{
						src: '/icons/favicon/favicon-16x16.png',
						sizes: '16x16'
					},
					{
						src: '/icons/favicon/favicon-192x192.png',
						sizes: '192x192'
					},
					{
						src: '/icons/favicon/favicon-32x32.png',
						sizes: '32x32'
					},
					{
						src: '/icons/favicon/favicon-48x48.png',
						sizes: '48x48'
					},
					{
						src: '/icons/favicon/favicon.ico',
						sizes: '16x16 32x32 48x48'
					},
					{
						src: '/icons/ios/100.png',
						sizes: '100x100'
					},
					{
						src: '/icons/android/android-launchericon-144-144.png',
						sizes: '144x144'
					},
					{
						src: '/icons/android/android-launchericon-192-192.png',
						sizes: '192x192'
					},
					{
						src: '/icons/android/android-launchericon-48-48.png',
						sizes: '48x48'
					},
					{
						src: '/icons/android/android-launchericon-512-512.png',
						sizes: '512x512'
					},
					{
						src: '/icons/android/android-launchericon-72-72.png',
						sizes: '72x72'
					},
					{
						src: '/icons/android/android-launchericon-96-96.png',
						sizes: '96x96'
					},
					{
						src: '/icons/ios/1024.png',
						sizes: '1024x1024'
					},
					{
						src: '/icons/ios/114.png',
						sizes: '114x114'
					},
					{
						src: '/icons/ios/120.png',
						sizes: '120x120'
					},
					{
						src: '/icons/ios/128.png',
						sizes: '128x128'
					},
					{
						src: '/icons/ios/144.png',
						sizes: '144x144'
					},
					{
						src: '/icons/ios/152.png',
						sizes: '152x152'
					},
					{
						src: '/icons/ios/16.png',
						sizes: '16x16'
					},
					{
						src: '/icons/ios/167.png',
						sizes: '167x167'
					},
					{
						src: '/icons/ios/180.png',
						sizes: '180x180'
					},
					{
						src: '/icons/ios/192.png',
						sizes: '192x192'
					},
					{
						src: '/icons/ios/20.png',
						sizes: '20x20'
					},
					{
						src: '/icons/ios/256.png',
						sizes: '256x256'
					},
					{
						src: '/icons/ios/29.png',
						sizes: '29x29'
					},
					{
						src: '/icons/ios/32.png',
						sizes: '32x32'
					},
					{
						src: '/icons/ios/40.png',
						sizes: '40x40'
					},
					{
						src: '/icons/ios/50.png',
						sizes: '50x50'
					},
					{
						src: '/icons/ios/512.png',
						sizes: '512x512'
					},
					{
						src: '/icons/ios/57.png',
						sizes: '57x57'
					},
					{
						src: '/icons/ios/58.png',
						sizes: '58x58'
					},
					{
						src: '/icons/ios/60.png',
						sizes: '60x60'
					},
					{
						src: '/icons/ios/64.png',
						sizes: '64x64'
					},
					{
						src: '/icons/ios/72.png',
						sizes: '72x72'
					},
					{
						src: '/icons/ios/76.png',
						sizes: '76x76'
					},
					{
						src: '/icons/ios/80.png',
						sizes: '80x80'
					},
					{
						src: '/icons/ios/87.png',
						sizes: '87x87'
					}
				]
			},
			workbox: {
				globPatterns: [
					'client/**/*.{js,css,ico,png,svg,webp,webmanifest,html}',
					'prerendered/**/*.{html,json}'
				],
				navigateFallback: '/app-shell',
				// navigateFallbackAllowlist: [
				// 	/^\/$/,
				// 	/^\/recipes/,
				// 	/^\/pantry/,
				// 	/^\/settings/
				// 	// Add any other paths belonging to the /(app)/** */ group here
				// ],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: { maxEntries: 20 }
						}
					}
				],
				// Cache up to 4MB
				maximumFileSizeToCacheInBytes: 4000000
			},
			includeAssets: ['favicon.png'],
			devOptions: {
				// enabled: true
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
