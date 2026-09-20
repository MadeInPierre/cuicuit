<script lang="ts">
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import {
		createIngredientAdmin,
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import { AISLE_OPTIONS, BASE_UNIT_OPTIONS, COMMONLY_USED_OPTIONS, NO_AISLE, type Aisle, type BaseUnit, type CommonlyUsed } from './consts.js';

	type Props = {
		languages: LanguagesListOutput;
		onCreated: (id: string) => void;
	};

	let { languages, onCreated }: Props = $props();

	let slug = $state('');
	let slugGeneral = $state('');
	let aisleSel = $state(NO_AISLE);
	let baseUnit = $state('unit');
	let lang = $state('en-US');
	let nameGeneral = $state('');
	let nameSingular = $state('');
	let namePlural = $state('');
	let commonlyUsed = $state('occasionally');
	let saving = $state(false);

	async function handleCreate() {
		if (!slug.trim() || !slugGeneral.trim() || !nameGeneral.trim()) {
			toast.error('Missing information', {
				description: 'Slug, general slug and the English name are required.'
			});
			return;
		}
		saving = true;
		try {
			const result = (await createIngredientAdmin({
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
			onCreated(result.id);
		} catch (err) {
			console.error(err);
			toast.error('Could not create ingredient', {
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
			<Label for="new-slug">Slug</Label>
			<Input id="new-slug" bind:value={slug} placeholder="red-apple" />
		</div>
		<div class="grid gap-1.5">
			<Label for="new-slug-general">General slug</Label>
			<Input id="new-slug-general" bind:value={slugGeneral} placeholder="apple" />
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
		<Label for="new-name-general">Name (general)</Label>
		<Input id="new-name-general" bind:value={nameGeneral} placeholder="apple" />
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="grid gap-1.5">
			<Label for="new-name-singular">Singular (optional)</Label>
			<Input id="new-name-singular" bind:value={nameSingular} placeholder="apple" />
		</div>
		<div class="grid gap-1.5">
			<Label for="new-name-plural">Plural (optional)</Label>
			<Input id="new-name-plural" bind:value={namePlural} placeholder="apples" />
		</div>
	</div>

	<Button onclick={handleCreate} disabled={saving}>
		{saving ? 'Creating…' : 'Create ingredient'}
	</Button>
</div>
