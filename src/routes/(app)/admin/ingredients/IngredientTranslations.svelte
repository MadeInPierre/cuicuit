<script lang="ts">
	import type { GetIngredientResult } from '$lib/core/operations/ingredients/get.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import {
		deleteIngredientTranslationAdmin,
		upsertIngredientTranslationAdmin
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import { COMMONLY_USED_OPTIONS } from './consts.js';

	type Translation = GetIngredientResult['translations'][number];

	type Props = {
		ingredientId: string;
		translations: Translation[];
		languages: LanguagesListOutput;
		onChanged: () => void;
	};

	let { ingredientId, translations, languages, onChanged }: Props = $props();

	type RowState = {
		nameSingular: string;
		namePlural: string;
		nameGeneral: string;
		commonlyUsed: string;
		saving: boolean;
	};

	const rowState = $state(new Map<string, RowState>());

	function stateFor(t: Translation): RowState {
		const key = `${t.ingredient_id}:${t.language_id}`;
		let row = rowState.get(key);
		if (!row) {
			row = {
				nameSingular: t.name_singular ?? '',
				namePlural: t.name_plural ?? '',
				nameGeneral: t.name_general,
				commonlyUsed: t.commonly_used,
				saving: false
			};
			rowState.set(key, row);
		}
		return row;
	}

	// New-translation form
	let newLang = $state('');
	let newSingular = $state('');
	let newPlural = $state('');
	let newGeneral = $state('');
	let newCommonlyUsed = $state('occasionally');
	let adding = $state(false);

	const usedLangs = $derived(new Set(translations.map((t) => t.language?.lang)));
	const missingLanguages = $derived(languages.filter((l) => !usedLangs.has(l.lang)));

	async function handleSave(t: Translation) {
		const row = stateFor(t);
		const lang = t.language?.lang;
		if (!lang) {
			toast.error('Unknown language for this translation.');
			return;
		}
		if (!row.nameGeneral.trim()) {
			toast.error('Missing information', { description: 'The general name is required.' });
			return;
		}
		row.saving = true;
		try {
			await upsertIngredientTranslationAdmin({
				ingredientId,
				lang,
				nameSingular: row.nameSingular.trim() || undefined,
				namePlural: row.namePlural.trim() || undefined,
				nameGeneral: row.nameGeneral.trim(),
				commonlyUsed: row.commonlyUsed as 'daily' | 'common' | 'occasionally' | 'rare' | 'never'
			});
			toast.success(`Translation saved (${lang}).`);
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not save translation.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			row.saving = false;
		}
	}

	async function handleDelete(t: Translation) {
		const lang = t.language?.lang;
		if (!lang) return;
		try {
			await deleteIngredientTranslationAdmin({ ingredientId, lang });
			toast.success(`Translation removed (${lang}).`);
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not remove translation.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		}
	}

	async function handleAdd() {
		if (!newLang || !newGeneral.trim()) {
			toast.error('Missing information', {
				description: 'Pick a language and enter the general name.'
			});
			return;
		}
		adding = true;
		try {
			await upsertIngredientTranslationAdmin({
				ingredientId,
				lang: newLang,
				nameSingular: newSingular.trim() || undefined,
				namePlural: newPlural.trim() || undefined,
				nameGeneral: newGeneral.trim(),
				commonlyUsed: newCommonlyUsed as
					| 'daily'
					| 'common'
					| 'occasionally'
					| 'rare'
					| 'never'
			});
			toast.success(`Translation added (${newLang}).`);
			newLang = '';
			newSingular = '';
			newPlural = '';
			newGeneral = '';
			newCommonlyUsed = 'occasionally';
			onChanged();
		} catch (err) {
			console.error(err);
			toast.error('Could not add translation.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			adding = false;
		}
	}
</script>

<div class="grid gap-4">
	{#each translations as t (t.language_id)}
		{@const row = stateFor(t)}
		<div class="grid gap-2 rounded-lg border p-3">
			<div class="flex items-center gap-2">
				<strong class="text-sm">{t.language?.lang ?? `#${t.language_id}`}</strong>
				<span class="text-xs text-muted-foreground">{t.language?.name_en ?? ''}</span>
				<Button
					variant="ghost"
					size="sm"
					class="ml-auto text-destructive"
					onclick={() => handleDelete(t)}
				>
					Remove
				</Button>
			</div>
			<div class="grid grid-cols-3 gap-2">
				<div class="grid gap-1">
					<Label>Singular</Label>
					<Input bind:value={row.nameSingular} />
				</div>
				<div class="grid gap-1">
					<Label>Plural</Label>
					<Input bind:value={row.namePlural} />
				</div>
				<div class="grid gap-1">
					<Label>General</Label>
					<Input bind:value={row.nameGeneral} />
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Label>Frequency</Label>
				<Select.Root type="single" bind:value={row.commonlyUsed}>
					<Select.Trigger class="w-40">{row.commonlyUsed}</Select.Trigger>
					<Select.Content>
						{#each COMMONLY_USED_OPTIONS as option (option)}
							<Select.Item value={option} label={option} />
						{/each}
					</Select.Content>
				</Select.Root>
				<Button size="sm" class="ml-auto" disabled={row.saving} onclick={() => handleSave(t)}>
					{row.saving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	{/each}

	<div class="grid gap-2 rounded-lg border border-dashed p-3">
		<strong class="text-sm">Add translation</strong>
		{#if missingLanguages.length === 0}
			<p class="text-sm text-muted-foreground">All known languages already have a translation.</p>
		{:else}
			<div class="grid grid-cols-2 gap-2">
				<div class="grid gap-1">
					<Label>Language</Label>
					<Select.Root type="single" bind:value={newLang}>
						<Select.Trigger>{newLang || 'Select…'}</Select.Trigger>
						<Select.Content>
							{#each missingLanguages as l (l.lang)}
								<Select.Item value={l.lang} label={`${l.lang} — ${l.name_en}`} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-1">
					<Label>Frequency</Label>
					<Select.Root type="single" bind:value={newCommonlyUsed}>
						<Select.Trigger>{newCommonlyUsed}</Select.Trigger>
						<Select.Content>
							{#each COMMONLY_USED_OPTIONS as option (option)}
								<Select.Item value={option} label={option} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-2">
				<div class="grid gap-1">
					<Label>Singular</Label>
					<Input bind:value={newSingular} />
				</div>
				<div class="grid gap-1">
					<Label>Plural</Label>
					<Input bind:value={newPlural} />
				</div>
				<div class="grid gap-1">
					<Label>General</Label>
					<Input bind:value={newGeneral} />
				</div>
			</div>
			<div>
				<Button size="sm" disabled={adding} onclick={handleAdd}>
					{adding ? 'Adding…' : 'Add translation'}
				</Button>
			</div>
		{/if}
	</div>
</div>
