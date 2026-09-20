<script lang="ts">
	import type { CustomSource } from '$lib/core/operations/ingredients/custom-shared.js';
	import type { ListCustomIngredientsResult } from '$lib/core/operations/ingredients/list-custom.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import { listCustomIngredientsAdmin } from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import * as Table from '$lib/shared/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import LinkCustomDialog from './LinkCustomDialog.svelte';
	import PromoteCustomDialog from './PromoteCustomDialog.svelte';

	type CustomGroup = ListCustomIngredientsResult[number];

	type Props = {
		languages: LanguagesListOutput;
	};

	let { languages }: Props = $props();

	const SOURCE_OPTIONS: { value: CustomSource; label: string }[] = [
		{ value: 'all', label: 'All sources' },
		{ value: 'recipes', label: 'Recipes only' },
		{ value: 'plan', label: 'Shopping plan only' }
	];

	let groups: CustomGroup[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);
	let search = $state('');
	let source: CustomSource = $state('all');
	let expandedKey: string | null = $state(null);
	let promoteItem: CustomGroup | null = $state(null);
	let linkItem: CustomGroup | null = $state(null);

	async function load() {
		loading = true;
		error = null;
		try {
			groups = await listCustomIngredientsAdmin({ limit: 200, source });
		} catch (err) {
			console.error(err);
			error = err instanceof Error ? err.message : 'Failed to load custom ingredients.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const normalizedSearch = $derived(search.trim().toLowerCase());
	const filtered = $derived(
		normalizedSearch
			? groups.filter(
					(g) =>
						g.key.includes(normalizedSearch) ||
						g.rawInputs.some((r) => r.toLowerCase().includes(normalizedSearch))
				)
			: groups
	);

	function toggleExpanded(key: string) {
		expandedKey = expandedKey === key ? null : key;
	}

	function sourceLabel(group: CustomGroup): string {
		const parts: string[] = [];
		if (group.recipeCount > 0) parts.push(`${group.recipeCount} recipe${group.recipeCount > 1 ? 's' : ''}`);
		if (group.planCount > 0) parts.push(`${group.planCount} plan`);
		return parts.join(' · ') || '—';
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2">
		<Input
			bind:value={search}
			placeholder="Filter custom names…"
			class="max-w-64"
			type="search"
		/>
		<Select.Root
			type="single"
			bind:value={source}
			onValueChange={(v) => v && load()}
		>
			<Select.Trigger class="w-44">
				{SOURCE_OPTIONS.find((o) => o.value === source)?.label}
			</Select.Trigger>
			<Select.Content>
				{#each SOURCE_OPTIONS as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
		<Badge variant="secondary">{filtered.length} groups</Badge>
		<Button size="sm" variant="outline" class="ml-auto" onclick={load} disabled={loading}>
			{loading ? 'Loading…' : 'Refresh'}
		</Button>
	</div>

	{#if loading}
		<p class="text-muted-foreground">Loading custom ingredients…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
	{:else if filtered.length === 0}
		<p class="text-muted-foreground">
			{groups.length === 0
				? 'No free-text ingredients here — every row links the catalog.'
				: 'No custom names match this filter.'}
		</p>
	{:else}
		<div class="rounded-lg border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head class="w-20">Rows</Table.Head>
						<Table.Head>Sources</Table.Head>
						<Table.Head>Languages</Table.Head>
						<Table.Head class="w-48"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filtered as group (group.key)}
						<Table.Row class="cursor-pointer" onclick={() => toggleExpanded(group.key)}>
							<Table.Cell class="font-medium">{group.sample}</Table.Cell>
							<Table.Cell>{group.count}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">{sourceLabel(group)}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#each group.langs as lang (lang)}
										<Badge variant="outline">{lang}</Badge>
									{/each}
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex gap-1">
									<Button
										size="sm"
										onclick={(e) => {
											e.stopPropagation();
											promoteItem = group;
										}}
									>
										Promote
									</Button>
									<Button
										size="sm"
										variant="outline"
										onclick={(e) => {
											e.stopPropagation();
											linkItem = group;
										}}
									>
										Link
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
						{#if expandedKey === group.key}
							<Table.Row>
								<Table.Cell colspan={5}>
									<div class="grid gap-2 py-1 pl-2">
										{#if group.rawInputs.length > 0}
											<div class="text-sm">
												<span class="text-muted-foreground">Raw inputs: </span>
												{group.rawInputs.join(' · ')}
											</div>
										{/if}
										{#if group.recipes.length > 0}
											<div class="grid gap-1">
												<span class="text-sm text-muted-foreground">Sample recipes:</span>
												{#each group.recipes as recipe (recipe.recipeId)}
													<a
														href={`/recipes/${recipe.recipeId}`}
														class="text-sm underline underline-offset-2"
														onclick={(e) => e.stopPropagation()}
													>
														{recipe.title}
														{#if recipe.lang}
															<span class="text-muted-foreground">({recipe.lang})</span>
														{/if}
													</a>
												{/each}
											</div>
										{/if}
										{#if group.spaces.length > 0}
											<div class="grid gap-1">
												<span class="text-sm text-muted-foreground">Sample plan spaces:</span>
												{#each group.spaces as space (space.spaceId)}
													<span class="text-sm">
														{space.name}
														{#if space.lang}
															<span class="text-muted-foreground">({space.lang})</span>
														{/if}
													</span>
												{/each}
											</div>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/if}
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<Dialog.Root open={promoteItem !== null} onOpenChange={(open) => !open && (promoteItem = null)}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Promote "{promoteItem?.sample}"</Dialog.Title>
			<Dialog.Description>
				Creates the catalog ingredient, then relinks the matching rows to it.
			</Dialog.Description>
		</Dialog.Header>
		{#if promoteItem}
			{#key promoteItem.key}
				<PromoteCustomDialog item={promoteItem} {languages} {source} onPromoted={load} />
			{/key}
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root open={linkItem !== null} onOpenChange={(open) => !open && (linkItem = null)}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Link "{linkItem?.sample}"</Dialog.Title>
			<Dialog.Description>
				Points the matching rows at an existing catalog ingredient — no new ingredient
				is created.
			</Dialog.Description>
		</Dialog.Header>
		{#if linkItem}
			{#key linkItem.key}
				<LinkCustomDialog item={linkItem} {source} onLinked={load} />
			{/key}
		{/if}
	</Dialog.Content>
</Dialog.Root>
