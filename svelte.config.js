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
		version: {
			name: `v${process.env.npm_package_version}-${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'}`
		},
		experimental: {
			remoteFunctions: true
		},
		paths: {
			// Relative paths needed for PostHog, https://svelte.dev/docs/kit/configuration#paths
			relative: false
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
