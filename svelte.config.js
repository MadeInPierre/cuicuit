import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: adapter({
			runtime: 'nodejs24.x'
		}),
		experimental: {
			remoteFunctions: true
		}
	},

	vitePlugin: {
		inspector: true
	},

	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
