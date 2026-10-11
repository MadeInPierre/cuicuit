<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import {
		completeRecipeImport,
		runTextImport,
		runUrlImport,
		TEXT_IMPORT_STEPS,
		URL_IMPORT_STEPS
	} from '$lib/features/recipes/actions/run-recipe-import';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import ImportRecipeStepper from '$lib/features/recipes/components/ImportRecipeStepper.svelte';
	import { toastImportError } from '$lib/features/recipes/components/import-error-toast';
	import { parseSharedContent } from '$lib/features/recipes/share/parse-shared-content';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { ArrowLeft, FileText, ImagePlus, Link2, RotateCcw } from '@lucide/svelte';

	/**
	 * Web Share Target receiver (`share_target` action in `vite.config.ts`).
	 * The OS launches `GET /shared-content-receiver/?url=…&text=…&title=…`
	 * when the user shares to Cuicuit; the import starts automatically and
	 * lands on the recipe — no paste needed. Auth/onboarding guards come free
	 * from the `(app)` layout (logged-out sharers land on signup).
	 *
	 * Classification lives in `parse-shared-content.ts`, the import work in
	 * the core ops via `run-recipe-import.ts` — this page is only glue + states.
	 */

	const userState = getUserState();
	const space = getActiveSpaceState();

	const shared = $derived(
		parseSharedContent({
			url: page.url.searchParams.get('url'),
			text: page.url.searchParams.get('text'),
			title: page.url.searchParams.get('title')
		})
	);

	const steps = $derived(shared.kind === 'text' ? TEXT_IMPORT_STEPS : URL_IMPORT_STEPS);

	let started = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	let currentStep = $state(-1);

	const ready = $derived(!!userState.user?.id && !!space.activeSpace?.id && !!space.language?.lang);

	$effect(() => {
		if (shared.kind === 'empty' || started || loading || failed || !ready) return;
		started = true;
		loading = true;
		(async () => {
			try {
				const base = { spaceId: space.activeSpace!.id, lang: space.language!.lang };
				const result =
					shared.kind === 'text'
						? await runTextImport({ ...base, text: shared.text }, (s) => (currentStep = s))
						: await runUrlImport({ ...base, url: shared.url }, (s) => (currentStep = s));
				completeRecipeImport(userState, result, shared.kind);
			} catch (error) {
				console.error(error);
				toastImportError(error);
				failed = true;
				loading = false;
			}
		})();
	});

	function retry() {
		started = false;
		failed = false;
		currentStep = -1;
	}

	function goBack() {
		if (window.history.length > 1) window.history.back();
		else goto('/recipes');
	}
</script>

<div
	class="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 py-12"
>
	{#if shared.kind === 'empty'}
		<!-- Unsupported share (e.g. a photo: the manifest declares no `files`,
		     so images can't arrive with content — explain + offer the manual path). -->
		<div class="w-full space-y-4 rounded-lg bg-sidebar p-6 text-center md:p-8">
			<ImagePlus class="mx-auto size-12 text-muted-foreground" />
			<h1 class="text-xl font-bold tracking-tight">Nothing to import</h1>
			<p class="text-sm text-muted-foreground">
				We couldn't find a link or text in that share. Photo imports aren't supported yet — they're
				coming soon!
			</p>
			<div class="flex flex-col gap-2 pt-2">
				<ImportRecipeDialog>
					{#snippet trigger({ props })}
						<Button {...props} class="w-full">Paste a link manually</Button>
					{/snippet}
				</ImportRecipeDialog>
				<Button variant="outline" onclick={goBack} class="w-full">
					<ArrowLeft class="size-4" />
					Go back
				</Button>
			</div>
		</div>
	{:else if failed}
		<div class="w-full space-y-4 rounded-lg bg-sidebar p-6 text-center md:p-8">
			<h1 class="text-xl font-bold tracking-tight">Import failed</h1>
			<p class="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
				{#if shared.kind === 'url'}
					<Link2 class="size-4 shrink-0" />
					<span class="max-w-full truncate">{shared.url}</span>
				{:else}
					<FileText class="size-4 shrink-0" />
					<span>Shared text ({shared.text.length} characters)</span>
				{/if}
			</p>
			<div class="flex flex-col gap-2 pt-2">
				<Button onclick={retry} class="w-full">
					<RotateCcw class="size-4" />
					Try again
				</Button>
				<Button variant="outline" onclick={goBack} class="w-full">
					<ArrowLeft class="size-4" />
					Go back
				</Button>
			</div>
		</div>
	{:else}
		<!-- Foreground auto-import: keep Cuicuit open, show progress, then the
		     shared runner navigates to the imported recipe. -->
		<div class="w-full space-y-6 rounded-lg bg-sidebar p-6 md:p-8">
			<div class="space-y-1 text-center">
				<h1 class="text-xl font-bold tracking-tight">Importing your recipe…</h1>
				<p class="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
					{#if shared.kind === 'url'}
						<Link2 class="size-4 shrink-0" />
						<span class="max-w-full truncate">{shared.url}</span>
					{:else}
						<FileText class="size-4 shrink-0" />
						<span>Shared text ({shared.text.length} characters)</span>
					{/if}
				</p>
			</div>
			<div class="flex justify-center">
				<ImportRecipeStepper {steps} {currentStep} />
			</div>
			{#if !ready}
				<p class="text-center text-xs text-muted-foreground">Getting your kitchen ready…</p>
			{/if}
		</div>
	{/if}
</div>
