<script lang="ts">
	import * as Form from '$lib/shared/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { Input } from '$lib/shared/components/ui/input';
	import { onMount } from 'svelte';
	import { profileFormSchema } from '$lib/features/auth/models/schemas';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { toast } from 'svelte-sonner';
	import { getUserPreferences } from '$lib/features/auth/queries/get-user-preferences';
	import { getUserPublicProfile } from '$lib/features/auth/queries/get-user-public-profile';

	// Require the user to be signed in to get here
	$effect(() => {
		if (browser && userState.user === null) {
			console.warn('User is not logged in, redirect to signup');
			goto('/signup');
		}
	});

	// Forbid this zone if the user already finished his onboarding
	$effect(() => {
		if (
			browser &&
			userState.user?.id &&
			userState.preferences &&
			userState.preferences.onboarding_status === 'finished'
		) {
			console.log('User has finished onboarding, going to app.');
			goto('/recipes');
		}
	});

	// Validate the form data using zod
	const form = superForm(defaults(zod(profileFormSchema)), {
		SPA: true,
		validators: zod(profileFormSchema),
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
				goto('/recipes');
			}
		}
	});

	const { form: formData, enhance } = form;

	// Get the current values in supabase to set the input values & placeholders
	onMount(async () => {
		if (userState.user) {
			const preferences = await getUserPreferences(userState.user.id);
			const profile = await getUserPublicProfile(userState.user.id);

			if (!preferences || !profile) {
				console.error('Failed to fetch user preferences or profile.');
				toast.error('Failed to load your profile. Please try again later.');
				return;
			}

			$formData.firstName = preferences.first_name;
			$formData.lastName = preferences.last_name;
			$formData.userName = profile.user_name;
		}
	});
</script>

{#if userState.preferences && userState.preferences.onboarding_status !== 'finished'}
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
							<Form.Label>Last name</Form.Label>
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

		<Form.Button class="w-full">Continue</Form.Button>
	</form>

	<!-- <p class="px-8 text-center text-sm text-muted-foreground"></p> -->
{:else}
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome back!</h1>
		<p class="text-sm text-muted-foreground">You've already finished the welcome step.</p>
	</div>
{/if}
