<script lang="ts">
	import type { GetIngredientResult } from '$lib/core/operations/ingredients/get.js';
	import { updateIngredientAdmin } from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { Textarea } from '$lib/shared/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import { AISLE_OPTIONS, BASE_UNIT_OPTIONS, NO_AISLE, type Aisle, type BaseUnit } from './consts.js';

	type Props = {
		ingredient: GetIngredientResult['ingredient'];
		onSaved: () => void;
	};

	let { ingredient, onSaved }: Props = $props();

	let slug = $state('');
	let slugGeneral = $state('');
	let aisleSel = $state(NO_AISLE);
	let baseUnit = $state('unit');
	let hierarchyText = $state('');
	let gPerMlText = $state('');
	let unitFrequenciesText = $state('null');
	let gPerUnitText = $state('null');
	let saving = $state(false);

	// One-time init from props (the parent remounts this form via {#key} whenever
	// the saved row changes, so capturing the initial value here is intended).
	let initialized = $state(false);
	$effect(() => {
		if (initialized) return;
		slug = ingredient.slug;
		slugGeneral = ingredient.slug_general;
		aisleSel = ingredient.aisle ?? NO_AISLE;
		baseUnit = ingredient.base_unit;
		hierarchyText = (ingredient.hierarchy ?? []).join(', ');
		gPerMlText = ingredient.g_per_ml?.toString() ?? '';
		unitFrequenciesText = JSON.stringify(ingredient.unit_frequencies ?? null, null, 2);
		gPerUnitText = JSON.stringify(ingredient.g_per_unit ?? null, null, 2);
		initialized = true;
	});

	function parseUnitMap(label: string, raw: string): Record<string, number> | null | undefined {
		const trimmed = raw.trim();
		if (trimmed === '' || trimmed === 'null') return null;
		let parsed: unknown;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			throw new Error(`${label} is not valid JSON.`);
		}
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error(`${label} must be a JSON object like {"cup": 2}.`);
		}
		for (const value of Object.values(parsed)) {
			if (typeof value !== 'number' || Number.isNaN(value)) {
				throw new Error(`${label} values must all be numbers.`);
			}
		}
		return parsed as Record<string, number>;
	}

	async function handleSave() {
		let unitFrequencies: Record<string, number> | null | undefined;
		let gPerUnit: Record<string, number> | null | undefined;
		let gPerMl: number | null | undefined;
		try {
			unitFrequencies = parseUnitMap('Unit frequencies', unitFrequenciesText);
			gPerUnit = parseUnitMap('Grams per unit', gPerUnitText);
			const gPerMlTrimmed = gPerMlText.trim();
			gPerMl = gPerMlTrimmed === '' ? null : Number(gPerMlTrimmed);
			if (gPerMl !== null && gPerMl !== undefined && !(gPerMl > 0)) {
				throw new Error('Grams per ml must be a positive number.');
			}
		} catch (err) {
			toast.error('Invalid input', {
				description: err instanceof Error ? err.message : 'Please check the form.'
			});
			return;
		}

		saving = true;
		try {
			await updateIngredientAdmin({
				ingredientId: ingredient.id,
				patch: {
					slug: slug.trim(),
					slugGeneral: slugGeneral.trim(),
					aisle: aisleSel === NO_AISLE ? null : (aisleSel as Aisle),
					baseUnit: baseUnit as BaseUnit,
					hierarchy: hierarchyText
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean),
					unitFrequencies,
					gPerUnit,
					gPerMl
				}
			});
			toast.success('Ingredient updated.');
			onSaved();
		} catch (err) {
			console.error(err);
			toast.error('Could not update ingredient.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			saving = false;
		}
	}
</script>

<div class="grid gap-3">
	<div class="grid grid-cols-2 gap-3">
		<div class="grid gap-1.5">
			<Label for="base-slug">Slug</Label>
			<Input id="base-slug" bind:value={slug} />
		</div>
		<div class="grid gap-1.5">
			<Label for="base-slug-general">General slug</Label>
			<Input id="base-slug-general" bind:value={slugGeneral} />
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="grid gap-1.5">
			<Label>Aisle</Label>
			<Select.Root type="single" bind:value={aisleSel}>
				<Select.Trigger>{aisleSel === NO_AISLE ? 'None' : aisleSel}</Select.Trigger>
				<Select.Content>
					<Select.Item value={NO_AISLE} label="None" />
					{#each AISLE_OPTIONS as option (option)}
						<Select.Item value={option} label={option} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="grid gap-1.5">
			<Label>Base unit</Label>
			<Select.Root type="single" bind:value={baseUnit}>
				<Select.Trigger>{baseUnit}</Select.Trigger>
				<Select.Content>
					{#each BASE_UNIT_OPTIONS as option (option)}
						<Select.Item value={option} label={option} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<div class="grid gap-1.5">
		<Label for="base-hierarchy">Hierarchy (comma-separated)</Label>
		<Input id="base-hierarchy" bind:value={hierarchyText} placeholder="fruit, apple" />
	</div>

	<div class="grid gap-1.5">
		<Label for="base-g-per-ml">Grams per ml (empty = none)</Label>
		<Input id="base-g-per-ml" bind:value={gPerMlText} inputmode="decimal" placeholder="1.03" />
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="grid gap-1.5">
			<Label for="base-unit-frequencies">Unit frequencies (JSON)</Label>
			<Textarea id="base-unit-frequencies" bind:value={unitFrequenciesText} rows={4} class="font-mono text-xs" />
		</div>
		<div class="grid gap-1.5">
			<Label for="base-g-per-unit">Grams per unit (JSON)</Label>
			<Textarea id="base-g-per-unit" bind:value={gPerUnitText} rows={4} class="font-mono text-xs" />
		</div>
	</div>

	<div>
		<Button onclick={handleSave} disabled={saving}>
			{saving ? 'Saving…' : 'Save base fields'}
		</Button>
	</div>
</div>
