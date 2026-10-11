<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CreateRecipeManualForm from '$lib/features/recipes/components/CreateRecipeManualForm.svelte';
	import ImportRecipeFromTextForm from '$lib/features/recipes/components/ImportRecipeFromTextForm.svelte';
	import ImportRecipeUrlForm from '$lib/features/recipes/components/ImportRecipeUrlForm.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { ArrowLeft, FileImage, FileText, Globe, Pencil } from '@lucide/svelte';

	/**
	 * Mobile-only import pages: the mobile import menu navigates here so each
	 * form gets a full scrollable page (keyboard-safe), instead of living in
	 * the bottom dialog. The existing dialog forms are reused as-is.
	 */

	const method = $derived(page.params.method);

	const headers = {
		url: {
			icon: Globe,
			title: 'Import from the web',
			description: 'Grab the link of any recipe and paste it here.'
		},
		text: {
			icon: FileText,
			title: 'Import from a document',
			description: 'Paste the text of a recipe or document to import it.'
		},
		photo: {
			icon: FileImage,
			title: 'Import from a photo',
			description: 'Upload a photo or PDF of a recipe to import it.'
		},
		manual: {
			icon: Pencil,
			title: 'Create manually',
			description: 'Start with a blank recipe.'
		}
	} as const;

	type Method = keyof typeof headers;

	const isKnown = $derived(
		method === 'url' || method === 'text' || method === 'photo' || method === 'manual'
	);
	const header = $derived(isKnown ? headers[method as Method] : null);

	function goBack() {
		if (window.history.length > 1) window.history.back();
		else goto('/recipes');
	}
</script>

<div class="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
	<Button variant="ghost" size="sm" onclick={goBack} class="-ml-2 text-muted-foreground">
		<ArrowLeft class="size-4" />
		Back
	</Button>

	{#if header}
		{@const Icon = header.icon}
		<div class="space-y-1">
			<h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
				<Icon class="size-6" />
				{header.title}
			</h1>
			<p class="text-sm text-muted-foreground">{header.description}</p>
		</div>

		{#if method === 'url'}
			<ImportRecipeUrlForm />
		{:else if method === 'text'}
			<ImportRecipeFromTextForm />
		{:else if method === 'manual'}
			<CreateRecipeManualForm />
		{:else if method === 'photo'}
			<p class="rounded-md bg-muted p-6 text-center text-muted-foreground">Coming soon!</p>
		{/if}
	{:else}
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight">Unknown import method</h1>
			<p class="text-sm text-muted-foreground">This import option doesn't exist.</p>
		</div>
	{/if}
</div>
