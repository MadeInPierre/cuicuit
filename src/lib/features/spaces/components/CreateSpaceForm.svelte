<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/shared/components/ui/form';
	import { spaceFormSchema } from '../models/schemas';
	import { createSpace } from '../actions/create-space';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import { cn } from '$lib/utils';

	let { openDialog = $bindable() } = $props();

	const form = superForm(defaults(zod(spaceFormSchema)), {
		SPA: true,
		validators: zod(spaceFormSchema),
		clearOnSubmit: 'errors-and-message',
		onUpdate({ form }) {
			if (form.valid) onSubmit();
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	const userDocState = getUserDocState();
	const activeSpace = getActiveSpaceState();

	let loading = $state(false);
	let SelectedIconComponent: any = $derived(
		$formData.iconSlug ? spaceIcons[$formData.iconSlug as SpaceIconKey] : null
	);

	async function onSubmit() {
		loading = true;
		createSpace(
			userDocState,
			$formData.name,
			$formData.color as SpaceThemeKey,
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

<form method="POST" use:enhance class="w-min">
	<div class="space-y-4 py-2 pb-4">
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
									slug === $formData.iconSlug &&
										themeButtonClasses[$formData.color as SpaceThemeKey]
								)}
							>
								<Icon class="size-5"></Icon>
							</Button>
						{/each}
					</div>
				</Form.Control>
			</Form.Fieldset>
		</div>

		<div class="space-y-2">
			<Form.Fieldset {form} name="color">
				<Form.Control let:attrs>
					<Form.Label for="name">Color</Form.Label>

					<div class="flex gap-2 items-center w-full">
						{#each Object.keys(themeButtonClasses) as c}
							<Button
								{...attrs}
								size="icon"
								variant={c === $formData.color ? 'link' : 'secondary'}
								on:click={() => ($formData.color = c)}
								class={cn("w-full size-10 rounded-full", c === $formData.color && `border-2 border-${c}-500`)}
							>
								<div class={`size-5 rounded-full bg-${c}-500`}></div>
							</Button>
						{/each}
					</div>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Fieldset>
		</div>

		<Dialog.Footer class="mt-4">
			<!-- <Button variant="secondary" on:click={() => (openDialog = false)}>Cancel</Button> -->
			<Form.Button
				type="submit"
				disabled={loading || !$formData.name}
				class={cn('w-full', $formData.name && themeButtonClasses[$formData.color as SpaceThemeKey])}
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
	</div>
</form>
