<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/shared/components/ui/form';
	import { createSpaceFormSchema } from '../models/schemas';
	import { createSpace } from '../actions/create-space';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import { cn } from '$lib/utils';
	import { userState } from '$lib/features/auth/state/user-state.svelte';

	let { openDialog = $bindable() } = $props();

	const activeSpace = getActiveSpaceState();

	// Refine the form schema to make sure the name is not already taken by other spaces
	const schema = createSpaceFormSchema.refine(
		(v) =>
			activeSpace.userSpaces &&
			!Object.values(activeSpace.userSpaces).some((s) => s.name === v.name),
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

	const { form: formData, enhance } = form;

	let loading = $state(false);
	let SelectedIconComponent: any = $derived(
		$formData.iconSlug ? spaceIcons[$formData.iconSlug as SpaceIconKey] : null
	);

	function onSubmit() {
		if (!userState.user?.id) {
			toast.error('You must be logged in to create a space.');
			return;
		}

		loading = true;
		createSpace(
			userState.user.id,
			$formData.name,
			$formData.theme as SpaceThemeKey,
			$formData.iconSlug as SpaceIconKey
		)
			.then((newSpaceId: string) => {
				activeSpace.id = newSpaceId; // Change the active space to the new one
				openDialog = false;
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

<form method="POST" use:enhance class="w-min space-y-4">
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
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
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
				{/snippet}
			</Form.Control>
		</Form.Fieldset>
	</div>

	<div class="space-y-2">
		<Form.Fieldset {form} name="theme">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Theme <span class="font-normal text-muted-foreground text-xs"> (for you only) </span>
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
		<Dialog.Footer class="mt-4">
			<Form.Button
				type="submit"
				disabled={loading || !$formData.name}
				class={cn('w-full', $formData.name && themeButtonClasses[$formData.theme as SpaceThemeKey])}
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						Creating...
					</div>
				{:else}
					<div class="flex gap-2 items-center">
						Create
						{#if $formData.name}
							<SelectedIconComponent class="size-5"></SelectedIconComponent>
							{$formData.name}
						{:else}
							new space
						{/if}
					</div>
				{/if}
			</Form.Button>
		</Dialog.Footer>
		<p class="text-muted-foreground text-xs">
			The space's name and icon are shared with all members.
		</p>
	</div>
</form>
