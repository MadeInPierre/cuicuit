<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createUserData } from '$lib/features/auth/actions/create-user-data';
	import { profileFormSchema } from '$lib/features/auth/models/schemas';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { createSpace } from '$lib/features/spaces/actions/create-space';
	import { joinSpace } from '$lib/features/spaces/actions/join-space';
	import type { SpaceIconKey, SpaceThemeKey } from '$lib/features/spaces/consts';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	// Require the user to be signed in to get here
	$effect(() => {
		if (browser && userState.user === null) {
			console.warn('User is not logged in, redirect to signup');
			goto('/signup');
		}
	});

	// Forbid this zone if the user already finished his onboarding
	$effect(() => {
		if (browser && userState.user?.id) {
			if (userState.preferences === null) {
				// Freshly signed up user without initial data yet, create it
				initializeUserData(userState.user.id);
			} else if (userState.preferences?.onboarding_status === 'finished') {
				console.log('User is already onboarded, going to app.');
				goto('/recipes');
			}
		}
	});

	async function initializeUserData(userId: string) {
		// Create a new user doc if they're a new user
		const firstName = await createUserData(userId);

		// Join space if they have a join intent in local storage
		const inviteSpaceId = localStorage.getItem('invite-join-space-id');
		if (inviteSpaceId) {
			try {
				await joinSpace(userId, inviteSpaceId, 'yellow');
				localStorage.removeItem('invite-join-space-id');
			} catch {
				// Fallback by creating a private space
				await createSpace(
					userId,
					firstName + "'s Home",
					'yellow' as SpaceThemeKey,
					'house' as SpaceIconKey
				);
			}
		}

		// Create a new space for the user
		else {
			await createSpace(
				userId,
				firstName + "'s Home",
				'yellow' as SpaceThemeKey,
				'house' as SpaceIconKey
			);
		}

		// Refresh profile & preferences to populate the form
		await userState.refresh();
	}

	// Validate the form data using zod
	const form = superForm(defaults(zod(profileFormSchema)), {
		SPA: true,
		validators: zod(profileFormSchema),
		resetForm: false,
		async onUpdate({ form }) {
			if (form.valid) {
				if (!userState.user?.id) {
					console.error('User is not logged in, cannot update profile.');
					return;
				}

				// Update the user profile in the database
				const { error: profileError } = await supabase
					.from('user_public_profiles')
					.update({
						user_name: $formData.userName
					})
					.eq('user_id', userState.user.id);

				// Update the user preferences in the database
				const { error: prefError } = await supabase
					.from('user_preferences')
					.update({
						first_name: $formData.firstName,
						last_name: $formData.lastName,
						onboarding_status: 'finished' // Mark the onboarding as finished
					})
					.eq('user_id', userState.user.id);

				if (profileError || prefError) {
					console.error('Error updating user data:', profileError, prefError);
					toast.error('Failed to update your profile. Please try again later.');
					return;
				}

				// Done, go to app!
				window.location.href = '/recipes';
			}
		}
	});

	const { form: formData, enhance } = form;

	// Refresh the user's data once logged in
	$effect(() => {
		if (userState.user) userState.refresh();
	});

	// Get the current values in supabase to set the input values & placeholders
	$effect(() => {
		$formData.firstName = userState.preferences?.first_name || '';
		$formData.lastName = userState.preferences?.last_name || '';
		$formData.userName = userState.profile?.user_name || '';
	});
</script>

{#if userState.preferences?.onboarding_status === 'finished'}
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome back!</h1>
		<p class="text-sm text-muted-foreground">
			Looks like you've already finished the welcome step, redirecting you to your homepage...
		</p>
	</div>
{:else}
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome to Cuicuit!</h1>
		<p class="text-sm text-muted-foreground">Let's get to know each other a little!</p>
	</div>

	<form method="POST" use:enhance class="space-y-4">
		<!-- <legend class="mb-4 text-lg font-medium"> Display names </legend> -->

		<div class="flex flex-col">
			<div class="flex w-full gap-4">
				<Form.Field {form} name="firstName" class="w-full">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>First name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.firstName}
								placeholder={$formData.firstName || 'John'}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="lastName" class="w-full">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Last name (optional)</Form.Label>
							<Input
								{...props}
								bind:value={$formData.lastName}
								placeholder={$formData.lastName || 'Doe'}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<p class="text-sm text-muted-foreground">Only visible to you and your family members.</p>
		</div>

		<Form.Field {form} name="userName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Username</Form.Label>
					<Input
						{...props}
						bind:value={$formData.userName}
						placeholder={$formData.userName || 'CuiCarrot'}
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>This is your public display name.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<!-- <ImagePicker /> -->

		<Form.Button class="w-full" disabled={!userState.preferences}>
			{#if userState.preferences}
				Let's go!
			{:else}
				Getting ready...
			{/if}
		</Form.Button>
	</form>

	<!-- <p class="px-8 text-center text-sm text-muted-foreground"></p> -->
{/if}
