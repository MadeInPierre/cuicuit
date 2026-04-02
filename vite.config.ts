import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
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
