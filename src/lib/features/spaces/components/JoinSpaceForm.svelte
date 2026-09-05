<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { cn } from '$lib/utils';
	import { Loader2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { joinSpace } from '../actions/join-space';
	import { themeButtonClasses, type SpaceThemeKey } from '../consts';
	import { joinSpaceFormSchema } from '../models/schemas';
	import { getActiveSpaceState } from '../state/active-space.svelte';

	const userState = getUserState();

	let { openDialog = $bindable() } = $props();

	const activeSpace = getActiveSpaceState();

	// Refine the form schema to validate the invite link, should contain a UUIDv4, for example:
	// - https://cuicu.it/<uuid>
	// - cuicuit.app/<uuid>
	// - https://cuicuit.app/join/<uuid>
	// - cuicuit.app/join/<uuid>
	// - <uuid>
	const schema = joinSpaceFormSchema.refine(
		(v) =>
			/^((https?:\/\/)?(cuicu\.it|cuicuit\.app\/join|cuicuit\.laclau\.dev\/join)\/)?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/.test(
				v.url
			),
		{
			path: ['url'],
			message:
				'The invite link should contain a UUIDv4, for example: "123e4567-e89b-12d3-a456-426614174000".'
		}
	);

	const form = superForm(defaults(zod4(schema)), {
		SPA: true,
		validators: zod4(schema),
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
		const spaceId = $formData.url.match(
			/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
		)?.[0];

		if (!spaceId) {
			return toast.error('The invite link is invalid.', {
				description: 'Please make sure it contains a code of 32 alphanumeric characters.'
			});
		}

		loading = true;
		joinSpace(userState.user.id, spaceId, $formData.theme as SpaceThemeKey)
			.then(async () => {
				activeSpace.id = spaceId; // Change the active space to the newly joined one
				localStorage.removeItem('invite-join-space-id');
				openDialog = false;
				loading = false;
				await activeSpace.refreshSpaces(); // Make the joined space show up in the switcher
			})
			.catch((error: Error) => {
				console.log('CATCH');
				if (error.message === 'space-not-found') {
					toast.error('Space not found.', {
						description: 'Please make sure the invite link is correct.'
					});
				} else if (error.message === 'already-joined-space') {
					toast.error('Space already joined.', {
						description: 'The grass is already green :)'
					});
					activeSpace.id = spaceId;
					localStorage.removeItem('invite-join-space-id');
					openDialog = false;
					loading = false;
				} else {
					toast.error('Something went wrong.', { description: 'Please try again later.' });
					console.error(error);
					localStorage.removeItem('invite-join-space-id');
				}
				loading = false;
			});
	}

	onMount(() => {
		const inviteSpaceId = localStorage.getItem('invite-join-space-id');
		if (inviteSpaceId) $formData.url = inviteSpaceId;
	});
</script>

<form method="POST" use:enhance class="w-full space-y-4">
	<div class="space-y-2">
		<Form.Field {form} name="url">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Invite link or code</Form.Label>

					<Input
						{...props}
						placeholder="Ex: https://cuicuit.app/join/k1wEDOXRmPdJk6eTulQE"
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

	<div class="grid space-y-2">
		<Dialog.Footer class="">
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
	</div>
</form>
