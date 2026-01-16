import { defineConfig } from 'jsrepo';

export default defineConfig({
	// configure where stuff comes from here
	registries: ['@ieedan/shadcn-svelte-extras'],
	// configure were stuff goes here
	paths: {
		ui: '$lib/shared/components/ui-extras',
		block: '$lib/shared/components',
		hook: '$lib/shared/hooks',
		action: '$lib/shared/actions',
		util: '$lib/shared/utils',
		lib: '$lib'
	}
});
