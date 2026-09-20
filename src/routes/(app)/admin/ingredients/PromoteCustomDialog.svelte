<script lang="ts">
	import type { ListCustomIngredientsResult } from '$lib/core/operations/ingredients/list-custom.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import {
		createIngredientAdmin,
		relinkCustomIngredientAdmin
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { goto } from '$app/navigation';
	import type { CustomSource } from '$lib/core/operations/ingredients/custom-shared.js';
	import type { RelinkCustomIngredientResult } from '$lib/core/operations/ingredients/relink-custom.js';
	import { toast } from 'svelte-sonner';
	import {
		AISLE_OPTIONS,
		BASE_UNIT_OPTIONS,
		COMMONLY_USED_OPTIONS,
		NO_AISLE,
		slugifyCustomName,
		type Aisle,
		type BaseUnit,
		type CommonlyUsed
	} from './consts.js';

	type CustomGroup = ListCustomIngredientsResult[number];

	type Props = {
		item: CustomGroup;
		languages: LanguagesListOutput;
		source: CustomSource;
		onPromoted: () => void;
	};

	let { item, languages, source, onPromoted }: Props = $props();

	// Prefill from the custom row (parent remounts via {#key} per item, and
	// the M2 eslint rule forbids $state-from-props initializers, hence the
	// one-time effect).
	let slug = $state('');
	let slugGeneral = $state('');
	let aisleSel = $state(NO_AISLE);
	let baseUnit = $state('unit');
	let lang = $state('en-US');
	let nameGeneral = $state('');
	let nameSingular = $state('');
	let namePlural = $state('');
	let commonlyUsed = $state('occasionally');
	let working = $state(false);
	let result: RelinkCustomIngredientResult | null = $state(null);
	let initialized = $state(false);

	// Relink scope follows the tab's source filter.
	const recipeRows = $derived(source === 'plan' ? 0 : item.recipeCount);
	const planRows = $derived(source === 'recipes' ? 0 : item.planCount);

	$effect(() => {
		if (initialized) return;
		const suggestion = slugifyCustomName(item.sample) || 'custom-ingredient';
		slug = suggestion;
		slugGeneral = suggestion;
		nameGeneral = item.sample;
		// Guess the translation language from the most common sample lang.
		lang = item.langs[0] ?? (languages[0]?.lang ?? 'en-US');
		initialized = true;
	});

	async function handlePromote() {
		if (!slug.trim() || !slugGeneral.trim() || !nameGeneral.trim()) {
			toast.error('Missing information', {
				description: 'Slug, general slug and the name are required.'
			});
			return;
		}
		working = true;
		try {
			// Duplicate slug → CONFLICT here, before anything is relinked.
			const created = (await createIngredientAdmin({
				slug: slug.trim(),
				slugGeneral: slugGeneral.trim(),
				aisle: aisleSel === NO_AISLE ? null : (aisleSel as Aisle),
				hierarchy: [],
				baseUnit: baseUnit as BaseUnit,
				initialTranslation: {
					lang,
					nameSingular: nameSingular.trim() || undefined,
					namePlural: namePlural.trim() || undefined,
					nameGeneral: nameGeneral.trim(),
					commonlyUsed: commonlyUsed as CommonlyUsed
				}
			})) as { id: string };
			// Idempotent: re-running after a promote relinks zero rows.
			result = await relinkCustomIngredientAdmin({
				key: item.key,
				ingredientId: created.id,
				source
			});
			toast.success('Ingredient promoted.', {
				description: `${result.relinked} rows relinked${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.`
			});
			onPromoted();
		} catch (err) {
			console.error(err);
			toast.error('Could not promote ingredient.', {
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
			<strong>{item.sample}</strong> is now a catalog ingredient:
			<strong>{result.relinked}</strong> rows relinked
			{#if result.recipeRelinked > 0 && result.planRelinked > 0}
				({result.recipeRelinked} recipes + {result.planRelinked} plan)
			{/if}{#if result.skipped > 0}
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
			Promoting <strong>"{item.sample}"</strong> creates the catalog row and relinks
			{#if recipeRows > 0 && planRows > 0}
				<strong>{recipeRows}</strong> recipe rows + <strong>{planRows}</strong> plan items
			{:else if recipeRows > 0}
				<strong>{recipeRows}</strong> recipe rows
			{:else}
				<strong>{planRows}</strong> plan items
			{/if}
			({item.langs.join(', ') || 'unknown language'}).
		</p>

		<div class="grid grid-cols-2 gap-3">
			<div class="grid gap-1.5">
				<Label for="promote-slug">Slug</Label>
				<Input id="promote-slug" bind:value={slug} />
			</div>
			<div class="grid gap-1.5">
				<Label for="promote-slug-general">General slug</Label>
				<Input id="promote-slug-general" bind:value={slugGeneral} />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="grid gap-1.5">
				<Label>Aisle</Label>
				<Select.Root type="single" bind:value={aisleSel}>
					<Select.Trigger>{aisleSel === NO_AISLE ? 'Select…' : aisleSel}</Select.Trigger>
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

		<div class="grid grid-cols-2 gap-3">
			<div class="grid gap-1.5">
				<Label>Language</Label>
				<Select.Root type="single" bind:value={lang}>
					<Select.Trigger>{lang}</Select.Trigger>
					<Select.Content>
						{#each languages.length > 0 ? languages : [{ lang: 'en-US' }] as l (l.lang)}
							<Select.Item value={l.lang} label={l.lang} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid gap-1.5">
				<Label>Frequency</Label>
				<Select.Root type="single" bind:value={commonlyUsed}>
					<Select.Trigger>{commonlyUsed}</Select.Trigger>
					<Select.Content>
						{#each COMMONLY_USED_OPTIONS as option (option)}
							<Select.Item value={option} label={option} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="grid gap-1.5">
			<Label for="promote-name-general">Name (general)</Label>
			<Input id="promote-name-general" bind:value={nameGeneral} />
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="grid gap-1.5">
				<Label for="promote-name-singular">Singular (optional)</Label>
				<Input id="promote-name-singular" bind:value={nameSingular} />
			</div>
			<div class="grid gap-1.5">
				<Label for="promote-name-plural">Plural (optional)</Label>
				<Input id="promote-name-plural" bind:value={namePlural} />
			</div>
		</div>

		<div>
			<Button onclick={handlePromote} disabled={working}>
				{working ? 'Promoting…' : `Create + relink ${recipeRows + planRows} rows`}
			</Button>
		</div>
	</div>
{/if}
