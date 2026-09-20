<script lang="ts">
	import { page } from '$app/state';
	import { getClientCtx, runOp } from '$lib/core/operations/client.js';
	import type { GetIngredientResult } from '$lib/core/operations/ingredients/get.js';
	import '$lib/core/operations/languages/list.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import { getIngredientAdmin } from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import IngredientBaseForm from '../IngredientBaseForm.svelte';
	import IngredientImageManager from '../IngredientImageManager.svelte';
	import IngredientSubstitutions from '../IngredientSubstitutions.svelte';
	import IngredientTranslations from '../IngredientTranslations.svelte';

	const ingredientId = $derived(page.params.id ?? '');

	let detail: GetIngredientResult | null = $state(null);
	let languages: LanguagesListOutput = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);

	async function load() {
		if (!ingredientId) {
			error = 'Missing ingredient id.';
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			detail = await getIngredientAdmin({ ingredientId });
			if (languages.length === 0) {
				languages = await runOp('languages.list', await getClientCtx(), {});
			}
		} catch (err) {
			console.error(err);
			error = err instanceof Error ? err.message : 'Failed to load ingredient.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void ingredientId;
		load();
	});

	const displayName = $derived.by(() => {
		if (!detail) return '';
		const en = detail.translations.find((t) => t.language?.lang === 'en-US');
		return en?.name_general ?? detail.translations[0]?.name_general ?? detail.ingredient.slug;
	});
</script>

<svelte:head>
	<title>{displayName ? `${displayName} — Admin` : 'Ingredient — Admin'}</title>
</svelte:head>

<div class="flex max-w-3xl flex-col gap-4 p-4">
	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" href="/admin/ingredients">← All ingredients</Button>
		{#if detail}
			<h1 class="text-2xl font-bold">{displayName}</h1>
			<Badge variant="secondary">{detail.ingredient.slug}</Badge>
		{/if}
	</div>

	{#if loading}
		<p class="text-muted-foreground">Loading ingredient…</p>
	{:else if error || !detail}
		<p class="text-destructive">{error ?? 'Ingredient not found.'}</p>
		<Button variant="outline" size="sm" class="w-fit" onclick={load}>Retry</Button>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Image</Card.Title>
			</Card.Header>
			<Card.Content>
				<IngredientImageManager ingredientId={detail.ingredient.id} {displayName} />
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Base fields</Card.Title>
			</Card.Header>
			<Card.Content>
				{#key detail.ingredient.id + JSON.stringify(detail.ingredient)}
					<IngredientBaseForm ingredient={detail.ingredient} onSaved={load} />
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Translations ({detail.translations.length})</Card.Title>
			</Card.Header>
			<Card.Content>
				{#key JSON.stringify(detail.translations.map( (t) => [t.language_id, t.name_general, t.commonly_used] ))}
					<IngredientTranslations
						ingredientId={detail.ingredient.id}
						translations={detail.translations}
						{languages}
						onChanged={load}
					/>
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Substitutions</Card.Title>
			</Card.Header>
			<Card.Content>
				<IngredientSubstitutions
					ingredientId={detail.ingredient.id}
					asOriginal={detail.substitutionsAsOriginal}
					asSubstitute={detail.substitutionsAsSubstitute}
					onChanged={load}
				/>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
