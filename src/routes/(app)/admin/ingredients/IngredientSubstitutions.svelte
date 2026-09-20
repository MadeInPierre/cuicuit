<script lang="ts">
	import type { GetIngredientResult } from '$lib/core/operations/ingredients/get.js';
	import {
		addIngredientSubstitutionAdmin,
		getIngredientAdmin,
		removeIngredientSubstitutionAdmin,
		updateIngredientSubstitutionAdmin
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { matchIngredientsRPC } from '$lib/features/ingredients/server/match-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import { SUBSTITUTION_STRENGTH_OPTIONS, type SubstitutionStrength } from './consts.js';

	type Substitution = GetIngredientResult['substitutionsAsOriginal'][number];

	type Props = {
		ingredientId: string;
		asOriginal: Substitution[];
		asSubstitute: Substitution[];
		onChanged: () => void;
	};

	let { ingredientId, asOriginal, asSubstitute, onChanged }: Props = $props();

	// Resolve linked-ingredient display names via the admin get op (no direct DB
	// access outside core ops). Cached by id; N is tiny (a few links per row).
	const nameCache = $state(new Map<string, string>());

	async function displayName(id: string): Promise<string> {
		const cached = nameCache.get(id);
		if (cached) return cached;
		try {
			const detail = await getIngredientAdmin({ ingredientId: id });
			const en = detail.translations.find((t) => t.language?.lang === 'en-US');
			const name =
				en?.name_singular ??
				en?.name_plural ??
				detail.translations[0]?.name_general ??
				detail.ingredient.slug;
			nameCache.set(id, name);
			return name;
		} catch {
			return id.slice(0, 8);
		}
	}

	// Add form
	let search = $state('');
	let candidates: { id: string; label: string }[] = $state([]);
	let searching = $state(false);
	let selectedId = $state('');
	let strength = $state('close');
	let ratioText = $state('1');
	let adding = $state(false);

	async function handleSearch() {
		const query = search.trim();
		if (!query) return;
		searching = true;
		try {
			const result = await matchIngredientsRPC({ ingredientStrings: [query], lang: 'en-US' });
			const matches = result.matches[0]?.bestMatches ?? [];
			candidates = matches
				.filter((m) => m.id !== ingredientId)
				.map((m) => {
					const en = (
						m.translations as { language?: { lang?: string }; name_general?: string }[]
					).find((t) => t.language?.lang === 'en-US');
					return { id: m.id, label: en?.name_general ?? m.slug_general };
				});
			selectedId = candidates[0]?.id ?? '';
			if (candidates.length === 0) toast.info('No other ingredient matches that search.');
		} catch (err) {
			console.error(err);
			toast.error('Search failed.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			searching = false;
		}
	}

	async function handleAdd() {
		const ratio = Number(ratioText);
		if (!selectedId) {
			toast.error('Missing substitute', { description: 'Search and pick an ingredient first.' });
			return;
		}
		if (!(ratio > 0)) {
			toast.error('Invalid ratio', { description: 'Ratio must be a positive number.' });
			return;
		}
		adding = true;
		try {
			await addIngredientSubstitutionAdmin({
				originalIngredientId: ingredientId,
				substituteIngredientId: selectedId,
				strength: strength as SubstitutionStrength,
				ratio
			});
			toast.success('Substitution added.');
			search = '';
			candidates = [];
			selectedId = '';
			ratioText = '1';
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not add substitution.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			adding = false;
		}
	}

	async function handleUpdate(sub: Substitution, patch: { strength?: string; ratio?: number }) {
		try {
			await updateIngredientSubstitutionAdmin({
				substitutionId: sub.id,
				strength: patch.strength as SubstitutionStrength | undefined,
				ratio: patch.ratio
			});
			toast.success('Substitution updated.');
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not update substitution.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		}
	}

	async function handleRemove(sub: Substitution) {
		try {
			await removeIngredientSubstitutionAdmin({ substitutionId: sub.id });
			toast.success('Substitution removed.');
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not remove substitution.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		}
	}
</script>

{#snippet subRow(sub: Substitution, otherId: string, editable: boolean)}
	<div class="flex flex-wrap items-center gap-2 rounded-lg border p-2">
		{#await displayName(otherId) then name}
			<a class="text-sm font-medium" href={otherId}>
				{name}
			</a>
		{/await}
		<code class="text-xs text-muted-foreground">{otherId.slice(0, 8)}</code>
		{#if editable}
			<Select.Root
				type="single"
				value={sub.strength}
				onValueChange={(v) => v && handleUpdate(sub, { strength: v })}
			>
				<Select.Trigger class="w-32">{sub.strength}</Select.Trigger>
				<Select.Content>
					{#each SUBSTITUTION_STRENGTH_OPTIONS as option (option)}
						<Select.Item value={option} label={option} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Input
				class="w-24"
				value={String(sub.original_to_substitute_ratio)}
				inputmode="decimal"
				aria-label="Ratio"
				onchange={(e) => {
					const ratio = Number((e.target as HTMLInputElement).value);
					if (ratio > 0 && ratio !== Number(sub.original_to_substitute_ratio)) {
						handleUpdate(sub, { ratio });
					}
				}}
			/>
			<Button
				variant="ghost"
				size="sm"
				class="ml-auto text-destructive"
				onclick={() => handleRemove(sub)}
			>
				Remove
			</Button>
		{:else}
			<span class="text-xs text-muted-foreground">
				{sub.strength} · ×{sub.original_to_substitute_ratio}
			</span>
		{/if}
	</div>
{/snippet}

<div class="grid gap-4">
	<div class="grid gap-2">
		<strong class="text-sm">Can be replaced by ({asOriginal.length})</strong>
		{#if asOriginal.length === 0}
			<p class="text-sm text-muted-foreground">No substitutes yet.</p>
		{:else}
			{#each asOriginal as sub (sub.id)}
				{@render subRow(sub, sub.substitute_ingredient_id, true)}
			{/each}
		{/if}
	</div>

	<div class="grid gap-2">
		<strong class="text-sm">Used as substitute for ({asSubstitute.length})</strong>
		{#if asSubstitute.length === 0}
			<p class="text-sm text-muted-foreground">Not used as a substitute anywhere.</p>
		{:else}
			{#each asSubstitute as sub (sub.id)}
				{@render subRow(sub, sub.original_ingredient_id, false)}
			{/each}
		{/if}
	</div>

	<div class="grid gap-2 rounded-lg border border-dashed p-3">
		<strong class="text-sm">Add substitute</strong>
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
			<div class="grid grid-cols-3 gap-2">
				<div class="grid gap-1">
					<Label>Substitute</Label>
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
				<div class="grid gap-1">
					<Label>Strength</Label>
					<Select.Root type="single" bind:value={strength}>
						<Select.Trigger>{strength}</Select.Trigger>
						<Select.Content>
							{#each SUBSTITUTION_STRENGTH_OPTIONS as option (option)}
								<Select.Item value={option} label={option} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-1">
					<Label>Ratio</Label>
					<Input bind:value={ratioText} inputmode="decimal" />
				</div>
			</div>
			<div>
				<Button size="sm" disabled={adding} onclick={handleAdd}>
					{adding ? 'Adding…' : 'Add substitution'}
				</Button>
			</div>
		{/if}
	</div>
</div>
