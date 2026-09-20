<script lang="ts">
	import { goto } from '$app/navigation';
	import { getClientCtx, runOp } from '$lib/core/operations/client.js';
	import '$lib/core/operations/ingredients/list.js';
	import '$lib/core/operations/languages/list.js';
	import type { ListIngredientsResult } from '$lib/core/operations/ingredients/list.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import * as Table from '$lib/shared/components/ui/table/index.js';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { AISLE_OPTIONS, COMMONLY_USED_OPTIONS } from './consts.js';
	import CustomItemsTab from './CustomItemsTab.svelte';
	import IngredientCreateDialog from './IngredientCreateDialog.svelte';

	type Ingredient = ListIngredientsResult[number];

	const PAGE_SIZE = 100;

	let ingredients: Ingredient[] = $state([]);
	let languages: LanguagesListOutput = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);

	// Filters
	let search = $state('');
	let aisleFilter = $state('all');
	let commonlyUsedFilter = $state('all');
	let missingTranslationFilter = $state('all');
	let view: 'table' | 'grid' = $state('table');
	let page = $state(0);
	let createOpen = $state(false);
	let tab = $state('catalog');

	onMount(async () => {
		try {
			const ctx = await getClientCtx();
			// Page through the range API until a short page (catalog is 1000+ rows).
			const all: Ingredient[] = [];
			let start = 0;
			const chunk = 1000;
			for (;;) {
				const rows = await runOp<{ start: number; end: number }, Ingredient[]>(
					'ingredients.list',
					ctx,
					{ start, end: start + chunk }
				);
				all.push(...rows);
				if (rows.length < chunk) break;
				start += chunk + 1;
			}
			ingredients = all;
			languages = await runOp('languages.list', ctx, {});
		} catch (err) {
			console.error(err);
			error = 'Failed to load ingredients.';
		} finally {
			loading = false;
		}
	});

	const normalizedSearch = $derived(search.trim().toLowerCase());

	const filtered = $derived.by(() => {
		return ingredients.filter((ing) => {
			if (aisleFilter !== 'all' && ing.aisle !== aisleFilter) return false;
			if (normalizedSearch) {
				const haystack = [
					ing.slug,
					ing.slug_general,
					...ing.translations.flatMap((t) => [t.name_singular, t.name_plural, t.name_general])
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				if (!haystack.includes(normalizedSearch)) return false;
			}
			if (commonlyUsedFilter !== 'all') {
				const uses = ing.translations.map((t) => t.commonly_used);
				if (!uses.some((u) => u === commonlyUsedFilter)) return false;
			}
			if (missingTranslationFilter !== 'all') {
				const hasLang = ing.translations.some((t) => t.language?.lang === missingTranslationFilter);
				if (hasLang) return false;
			}
			return true;
		});
	});

	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	const safePage = $derived(Math.min(page, pageCount - 1));
	const paged = $derived(filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE));

	// Reset to first page whenever a filter changes.
	$effect(() => {
		void search;
		void aisleFilter;
		void commonlyUsedFilter;
		void missingTranslationFilter;
		page = 0;
	});

	function displayName(ing: Ingredient): string {
		const en = ing.translations.find((t) => t.language?.lang === 'en-US');
		return en?.name_general ?? ing.translations[0]?.name_general ?? ing.slug_general;
	}

	function openDetail(id: string) {
		goto(`/admin/ingredients/${id}`);
	}

	function handleCreated(id: string) {
		createOpen = false;
		toast.success('Ingredient created.');
		openDetail(id);
	}
</script>

<svelte:head>
	<title>Ingredients — Admin</title>
</svelte:head>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-wrap items-center gap-2">
		<h1 class="text-2xl font-bold">Ingredients</h1>
		<Badge variant="secondary">{filtered.length} / {ingredients.length}</Badge>
		<div class="ml-auto flex gap-2">
			<Button
				variant={view === 'table' ? 'default' : 'outline'}
				size="sm"
				onclick={() => (view = 'table')}
			>
				Table
			</Button>
			<Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onclick={() => (view = 'grid')}>
				Grid
			</Button>
			<Button size="sm" onclick={() => (createOpen = true)}>New ingredient</Button>
		</div>
	</div>

	<Tabs.Root bind:value={tab}>
		<Tabs.List>
			<Tabs.Trigger value="catalog">Catalog</Tabs.Trigger>
			<Tabs.Trigger value="custom">Custom items</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="catalog" class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2">
		<Input
			bind:value={search}
			placeholder="Search slug or translation…"
			class="max-w-64"
			type="search"
		/>

		<Select.Root type="single" bind:value={aisleFilter}>
			<Select.Trigger class="w-44">
				{aisleFilter === 'all' ? 'All aisles' : aisleFilter}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="All aisles" />
				{#each AISLE_OPTIONS as aisle (aisle)}
					<Select.Item value={aisle} label={aisle} />
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" bind:value={commonlyUsedFilter}>
			<Select.Trigger class="w-44">
				{commonlyUsedFilter === 'all' ? 'Any frequency' : commonlyUsedFilter}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="Any frequency" />
				{#each COMMONLY_USED_OPTIONS as freq (freq)}
					<Select.Item value={freq} label={freq} />
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" bind:value={missingTranslationFilter}>
			<Select.Trigger class="w-52">
				{missingTranslationFilter === 'all'
					? 'Any translation state'
					: `Missing ${missingTranslationFilter}`}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="Any translation state" />
				{#each languages as lang (lang.lang)}
					<Select.Item value={lang.lang} label={`Missing ${lang.lang}`} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if loading}
		<p class="text-muted-foreground">Loading ingredients…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
	{:else if filtered.length === 0}
		<p class="text-muted-foreground">No ingredients match the current filters.</p>
	{:else if view === 'table'}
		<div class="rounded-lg border">
			<Table.Root class="bg-white dark:bg-muted rounded-lg">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-12 min-w-12"></Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head>Slug</Table.Head>
						<Table.Head>Aisle</Table.Head>
						<Table.Head>Translations</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each paged as ing (ing.id)}
						<Table.Row
							class="cursor-pointer"
							onclick={() => openDetail(ing.id)}
						>
							<Table.Cell>
								<IngredientImage id={ing.id} name={displayName(ing)} class="h-10 w-10 min-w-10" />
							</Table.Cell>
							<Table.Cell class="font-medium">{displayName(ing)}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{ing.slug}</Table.Cell>
							<Table.Cell>{ing.aisle ?? '—'}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#each ing.translations as t (t.language?.lang ?? t.language_id)}
										<Badge variant="outline" title={t.name_general}>
											{t.language?.lang ?? t.language_id}
										</Badge>
									{/each}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<div class="flex items-center gap-2">
			<Button size="sm" variant="outline" disabled={safePage === 0} onclick={() => (page = safePage - 1)}>
				Previous
			</Button>
			<span class="text-sm text-muted-foreground">
				Page {safePage + 1} of {pageCount}
			</span>
			<Button
				size="sm"
				variant="outline"
				disabled={safePage >= pageCount - 1}
				onclick={() => (page = safePage + 1)}
			>
				Next
			</Button>
		</div>
	{:else}
		<div
			style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.4rem;"
		>
			{#each filtered.slice(0, 200) as ing (ing.id)}
				<ShoppingItemCard
					ingredient={ing}
					size="sm"
					description={ing.slug_general}
					onclick={() => openDetail(ing.id)}
				/>
			{/each}
		</div>
		{#if filtered.length > 200}
			<p class="text-sm text-muted-foreground">
				Showing the first 200 of {filtered.length} — switch to the table view or refine the
				search to see more.
			</p>
		{/if}
	{/if}
		</Tabs.Content>

		<Tabs.Content value="custom">
			{#if tab === 'custom'}
				<CustomItemsTab {languages} />
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>

<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>New ingredient</Dialog.Title>
			<Dialog.Description>
				Creates the base row plus its first translation. More translations can be added on
				the detail page.
			</Dialog.Description>
		</Dialog.Header>
		<IngredientCreateDialog {languages} onCreated={handleCreated} />
	</Dialog.Content>
</Dialog.Root>
