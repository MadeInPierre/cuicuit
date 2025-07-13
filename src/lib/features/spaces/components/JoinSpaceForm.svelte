<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/shared/components/ui/form';
	import { joinSpaceFormSchema } from '../models/schemas';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import { cn } from '$lib/utils';
	import { joinSpace } from '../actions/join-space';
	import { userState } from '$lib/features/auth/state/user-state.svelte';

	let { openDialog = $bindable() } = $props();

	const activeSpace = getActiveSpaceState();

	// Refine the form schema to validate the invite link, should contain a code of 20 alphanumeric characters,
	// either with or without the cuicu.it/CODE or cuicuit.fr/in/CODE domains and/or https:// prefix, e.g.:
	// - https://cuicu.it/k1wEDOXRmPdJk6eTulQE
	// - cuicuit.fr/k1wEDOXRmPdJk6eTulQE
	// - https://cuicuit.fr/in/k1wEDOXRmPdJk6eTulQE
	// - cuicuit.fr/in/k1wEDOXRmPdJk6eTulQE
	// - k1wEDOXRmPdJk6eTulQE
	const schema = joinSpaceFormSchema.refine(
		(v) => /^((https?:\/\/)?(cuicu\.it|cuicuit\.fr\/in)\/)?[a-zA-Z0-9]{20}$/.test(v.url),
		{
			path: ['url'],
			message:
				'The invite link should contain a code of 20 alphanumeric characters, e.g. k1wEDOXRmPdJk6eTulQE.'
		}
	);

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		validators: zod(schema),
		onUpdate({ form }) {
			if (form.valid) onSubmit();
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	let loading = $state(false);
	// let SelectedIconComponent: any = $derived(
	// 	$formData.iconSlug ? spaceIcons[$formData.iconSlug as SpaceIconKey] : null
	// );

	function onSubmit() {
		if (!userState.user?.id) {
			toast.error('You must be logged in to join a space.');
			return;
		}

		// Extract the space ID from the invite link
		const spaceId = $formData.url.match(/[a-zA-Z0-9]{20}$/)?.[0];

		if (!spaceId) {
			return toast.error('The invite link is invalid.', {
				description: 'Please make sure it contains a code of 20 alphanumeric characters.'
			});
		}

		loading = true;
		joinSpace(userState.user.id, spaceId, $formData.theme as SpaceThemeKey)
			.then(() => {
				activeSpace.id = spaceId; // Change the active space to the newly joined one
				openDialog = false;
				loading = false;
			})
			.catch((error: Error) => {
				if (error.message === 'space-not-found')
					toast.error('Space not found.', {
						description: 'Please make sure the invite link is correct.'
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
		<Form.Field {form} name="url">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Invite link or code</Form.Label>

					<Input
						{...props}
						placeholder="E.g. https://cuicu.it/k1wEDOXRmPdJk6eTulQE"
						bind:value={$formData.url}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
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
				disabled={loading || !$formData.url}
				class={cn('w-full', $formData.url && themeButtonClasses[$formData.theme as SpaceThemeKey])}
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						Joining...
					</div>
				{:else}
					Join space
				{/if}
			</Form.Button>
		</Dialog.Footer>
		<p class="text-muted-foreground text-xs">
			The space's name and icon are shared with all members.
		</p>
	</div>
</form>
