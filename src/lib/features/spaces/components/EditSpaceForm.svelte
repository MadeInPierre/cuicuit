<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/shared/components/ui/form';
	import { createSpaceFormSchema } from '../models/schemas';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import { cn } from '$lib/utils';
	import { editSpace } from '../actions/edit-space';

	const userDocState = getUserDocState();
	const activeSpace = getActiveSpaceState();

	// Refine the form schema to make sure the name is not already taken by other spaces,
	// except if it's the same as the current space (doesn't count when editing the current space)
	const schema = createSpaceFormSchema.refine(
		(v) =>
			!Object.values(activeSpace.userHeaders).some(
				(h) => h.name === v.name && v.name !== activeSpace.userHeader?.name
			),
		{
			path: ['name'],
			message:
				'Sorry, you already have a space with that name. You could rename the existing one first.'
		}
	);

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		validators: zod(schema),
		clearOnSubmit: 'errors-and-message',
		onUpdate({ form }) {
			if (form.valid) onSubmit();
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance, allErrors } = form;

	let loading = $state(false);

	// Set the form data to the current space data
	$effect(() => {
		if (!activeSpace.userHeader) return;
		$formData.name = activeSpace.userHeader.name;
		$formData.theme = activeSpace.userHeader.theme;
		$formData.iconSlug = activeSpace.userHeader.icon;
	});

	// Disable the submit button if the form is loading or the data is the same as the current space
	const disabled = $derived(
		loading ||
			$allErrors.length > 0 ||
			!$formData.name ||
			($formData.name === activeSpace.userHeader?.name &&
				$formData.theme === activeSpace.userHeader?.theme &&
				$formData.iconSlug === activeSpace.userHeader?.icon)
	);

	function onSubmit() {
		loading = true;
		editSpace(
			userDocState,
			activeSpace,
			$formData.name,
			$formData.theme as SpaceThemeKey,
			$formData.iconSlug as SpaceIconKey
		)
			.then(() => {
				loading = false;
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
			<Form.Control let:attrs>
				<Form.Label for="name">Name</Form.Label>

				<Input
					{...attrs}
					id="name"
					placeholder="Home, Paris, Parents, Office, John's, ..."
					bind:value={$formData.name}
				/>

				<Form.Description>The name is shared with all members.</Form.Description>
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="iconSlug" class="space-y-3">
			<Form.Control let:attrs>
				<Form.Label for="name">Icon</Form.Label>

				<div class="flex gap-2 items-center w-full">
					{#each Object.entries(spaceIcons) as [slug, Icon] (slug)}
						<Button
							{...attrs}
							size="icon"
							variant={slug === $formData.iconSlug ? 'default' : 'secondary'}
							on:click={() => ($formData.iconSlug = slug)}
							class={cn(
								'w-full size-10',
								slug === $formData.iconSlug && themeButtonClasses[$formData.theme as SpaceThemeKey]
							)}
						>
							<Icon class="size-5"></Icon>
						</Button>
					{/each}
				</div>

				<Form.Description>The icon is shared with all members.</Form.Description>
			</Form.Control>
		</Form.Fieldset>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="theme">
			<Form.Control let:attrs>
				<Form.Label for="name">
					Theme <span class="font-normal text-muted-foreground text-xs"> (for you only) </span>
				</Form.Label>

				<div class="flex gap-2 items-center w-full">
					{#each Object.keys(themeButtonClasses) as c}
						<Button
							{...attrs}
							size="icon"
							variant={c === $formData.theme ? 'link' : 'secondary'}
							on:click={() => ($formData.theme = c)}
							class={cn(
								'w-full size-10 rounded-full',
								c === $formData.theme && `border-2 border-${c}-500`
							)}
						>
							<div class={`size-5 rounded-full bg-${c}-500`}></div>
						</Button>
					{/each}
				</div>
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
