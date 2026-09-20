<script lang="ts">
	import { goto } from '$app/navigation';
	import type { CustomSource } from '$lib/core/operations/ingredients/custom-shared.js';
	import type { ListCustomIngredientsResult } from '$lib/core/operations/ingredients/list-custom.js';
	import type { RelinkCustomIngredientResult } from '$lib/core/operations/ingredients/relink-custom.js';
	import { relinkCustomIngredientAdmin } from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { matchIngredientsRPC } from '$lib/features/ingredients/server/match-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';

	type CustomGroup = ListCustomIngredientsResult[number];

	type Props = {
		item: CustomGroup;
		source: CustomSource;
		onLinked: () => void;
	};

	let { item, source, onLinked }: Props = $props();

	let search = $state('');
	let candidates: { id: string; label: string }[] = $state([]);
	let searching = $state(false);
	let selectedId = $state('');
	let working = $state(false);
	let result: RelinkCustomIngredientResult | null = $state(null);
	let initialized = $state(false);

	// Prefill from props (parent remounts via {#key} per item).
	$effect(() => {
		if (initialized) return;
		search = item.sample;
		initialized = true;
	});

	const recipeRows = $derived(source === 'plan' ? 0 : item.recipeCount);
	const planRows = $derived(source === 'recipes' ? 0 : item.planCount);

	async function handleSearch() {
		const query = search.trim();
		if (!query) return;
		searching = true;
		try {
			// Match in the custom name's own language when known, so variant
			// spellings in other languages still find their ingredient.
			const result = await matchIngredientsRPC({
				ingredientStrings: [query],
				lang: item.langs[0] ?? 'en-US'
			});
			const matches = result.matches[0]?.bestMatches ?? [];
			candidates = matches.map((m) => {
				const en = (
					m.translations as { language?: { lang?: string }; name_general?: string }[]
				).find((t) => t.language?.lang === (item.langs[0] ?? 'en-US'));
				return { id: m.id, label: en?.name_general ?? m.slug_general };
			});
			selectedId = candidates[0]?.id ?? '';
			if (candidates.length === 0) toast.info('No ingredient matches that search.');
		} catch (err) {
			console.error(err);
			toast.error('Search failed.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			searching = false;
		}
	}

	async function handleLink() {
		if (!selectedId) {
			toast.error('Missing ingredient', { description: 'Search and pick an ingredient first.' });
			return;
		}
		working = true;
		try {
			// Idempotent: linking an already-linked key relinks zero rows.
			result = await relinkCustomIngredientAdmin({
				key: item.key,
				ingredientId: selectedId,
				source
			});
			toast.success('Custom ingredient linked.', {
				description: `${result.relinked} rows relinked${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.`
			});
			onLinked();
		} catch (err) {
			console.error(err);
			toast.error('Could not link ingredient.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			working = false;
		}
	}
</script>

{#if result}
	<div class="grid gap-3">
		<p class="text-sm">
			<strong>{item.sample}</strong> now points at the catalog ingredient:
			<strong>{result.relinked}</strong> rows relinked{#if result.skipped > 0}
				, <strong>{result.skipped}</strong> skipped (their recipes already link it — resolve
				those on the recipe)
			{/if}.
		</p>
		<div>
			<Button size="sm" onclick={() => goto(`/admin/ingredients/${result!.ingredientId}`)}>
				Open ingredient
			</Button>
		</div>
	</div>
{:else}
	<div class="grid gap-3">
		<p class="text-sm text-muted-foreground">
			Linking <strong>"{item.sample}"</strong> replaces the free-text rows
			{#if recipeRows > 0 && planRows > 0}
				(<strong>{recipeRows}</strong> recipe rows + <strong>{planRows}</strong> plan items)
			{:else if recipeRows > 0}
				(<strong>{recipeRows}</strong> recipe rows)
			{:else}
				(<strong>{planRows}</strong> plan items)
			{/if}
			with the ingredient you pick — the custom names stay stored for audit.
		</p>

		<div class="flex gap-2">
			<Input
				bind:value={search}
				placeholder="Search an ingredient…"
				onkeydown={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<Button variant="outline" size="sm" disabled={searching} onclick={handleSearch}>
				{searching ? '…' : 'Search'}
			</Button>
		</div>

		{#if candidates.length > 0}
			<div class="grid gap-1.5">
				<Label>Ingredient</Label>
				<Select.Root type="single" bind:value={selectedId}>
					<Select.Trigger>
						{candidates.find((c) => c.id === selectedId)?.label ?? 'Select…'}
					</Select.Trigger>
					<Select.Content>
						{#each candidates as c (c.id)}
							<Select.Item value={c.id} label={c.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div>
				<Button size="sm" disabled={working} onclick={handleLink}>
					{working ? 'Linking…' : `Link ${recipeRows + planRows} rows`}
				</Button>
			</div>
		{/if}
	</div>
{/if}
