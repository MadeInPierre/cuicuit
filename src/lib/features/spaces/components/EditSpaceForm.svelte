<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { languages, type LanguageKey } from '$lib/features/user-settings/consts';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { cn } from '$lib/utils';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { editSpace } from '../actions/edit-space';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import { createSpaceFormSchema } from '../models/schemas';
	import { getActiveSpaceState } from '../state/active-space.svelte';

	const userState = getUserState();
	const activeSpace = getActiveSpaceState();

	// Refine the form schema to make sure the name is not already taken by other spaces,
	// except if it's the same as the current space (doesn't count when editing the current space)
	const schema = createSpaceFormSchema.refine(
		(v) =>
			activeSpace.userSpaces &&
			!activeSpace.userSpaces.some((space) => space.name === v.name && space.id !== activeSpace.id),
		{
			path: ['name'],
			message:
				'Sorry, you already have a space with that name. You could rename the existing one first.'
		}
	);

	const form = superForm(defaults(zod4(schema)), {
		SPA: true,
		resetForm: false,
		validators: zod4(schema),
		onUpdate({ form }) {
			if (form.valid) onSubmit();
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance, allErrors } = form;

	let loading = $state(false);

	// Set the form data to the current space data
	$effect(() => {
		refreshFormData();
	});

	function refreshFormData() {
		if (!activeSpace.activeSpace || !activeSpace.activeMember) return;
		$formData.name = activeSpace.activeSpace.name;
		$formData.iconSlug = activeSpace.activeSpace.icon;
		$formData.theme = activeSpace.activeMember.theme;
		$formData.lang = activeSpace.activeSpace.language.lang as LanguageKey;
	}

	// Disable the submit button if the form is loading or the data is the same as the current space
	const disabled = $derived(
		loading ||
			$allErrors.length > 0 ||
			!$formData.name ||
			!activeSpace.activeSpace ||
			!activeSpace.activeMember ||
			($formData.name === activeSpace.activeSpace.name &&
				$formData.iconSlug === activeSpace.activeSpace.icon &&
				$formData.theme === activeSpace.activeMember.theme &&
				$formData.lang === (activeSpace.language?.lang as LanguageKey))
	);

	function onSubmit() {
		if (!userState.user?.id) {
			toast.error('You must be logged in to edit a space.');
			return;
		}

		if (!activeSpace.id) {
			toast.error('You must select a space to edit.');
			return;
		}

		loading = true;
		editSpace(
			activeSpace,
			userState.user.id,
			$formData.name,
			$formData.theme as SpaceThemeKey,
			$formData.iconSlug as SpaceIconKey,
			$formData.lang as LanguageKey
		)
			.then(() => {
				loading = false;
				refreshFormData();
			})
			.catch((error: Error) => {
				if (error.message === 'space-already-exists')
					toast.error('You already have a space with that name.', {
						description: 'Please choose another name.'
					});
				else {
					toast.error('Something went wrong.', { description: 'Please try again later.' });
					console.error(error);
				}
				loading = false;
			});
	}
</script>

<form method="POST" use:enhance class="space-y-6">
	<div class="space-y-2">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>

					<Input
						{...props}
						placeholder="Home, Paris, Parents, Office, John's, ..."
						bind:value={$formData.name}
					/>

					<Form.Description>The name is shared with all members.</Form.Description>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="lang">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Language</Form.Label>

					<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 items-center w-full">
						{#each Object.keys(languages) as LanguageKey[] as l}
							<Button
								{...props}
								size="sm"
								variant={l === $formData.lang ? 'default' : 'secondary'}
								onclick={() => ($formData.lang = l)}
							>
								{languages[l as keyof typeof languages].emoji}
								{languages[l as keyof typeof languages].label}
							</Button>
						{/each}
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Fieldset>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="iconSlug" class="space-y-3">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Icon</Form.Label>

					<div class="flex gap-2 items-center w-full">
						{#each Object.entries(spaceIcons) as [slug, Icon] (slug)}
							<Button
								{...props}
								size="icon"
								variant={slug === $formData.iconSlug ? 'default' : 'secondary'}
								onclick={() => ($formData.iconSlug = slug)}
								class={cn(
									'w-full size-10',
									slug === $formData.iconSlug &&
										themeButtonClasses[$formData.theme as SpaceThemeKey]
								)}
							>
								<Icon class="size-5"></Icon>
							</Button>
						{/each}
					</div>

					<Form.Description>The icon is shared with all members.</Form.Description>
				{/snippet}
			</Form.Control>
		</Form.Fieldset>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="theme">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Theme
						<span class="font-normal text-muted-foreground text-xs"> (applies to you only) </span>
					</Form.Label>

					<div class="flex gap-2 items-center w-full">
						{#each Object.keys(themeButtonClasses) as c}
							<Button
								{...props}
								size="icon"
								variant={c === $formData.theme ? 'link' : 'secondary'}
								onclick={() => ($formData.theme = c)}
								class={cn(
									'w-full size-10 rounded-full',
									c === $formData.theme && `border-2 border-${c}-500`
								)}
							>
								<div class={`size-5 rounded-full bg-${c}-500`}></div>
							</Button>
						{/each}
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Fieldset>
	</div>

	<div class="space-y-2">
		<!-- TODO check/load/X indicator -->
		<Form.Button type="submit" {disabled}>
			{#if loading}
				<div class="flex items-center gap-2">
					<Loader2 class="size-4 animate-spin" />
					Updating...
				</div>
			{:else}
				Update
			{/if}
		</Form.Button>
	</div>
</form>
