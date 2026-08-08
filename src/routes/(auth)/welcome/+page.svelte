<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { generateRandomProfileDraft } from '$lib/features/auth/actions/create-user-data';
	import { profileFormSchema } from '$lib/features/auth/models/schemas';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { Dice4 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	const userState = getUserState();

	$effect(() => {
		// Require the user to be signed in to get here
		if (browser && userState.user === null) {
			console.warn('User is not logged in, redirect to /login');
			goto('/login');
		}

		// Forbid this zone if the user already finished his onboarding
		if (browser && userState.user?.id && userState.preferences?.onboarding_status === 'finished') {
			console.log('User is already onboarded, going /recipes.');
			goto('/recipes');
		}
	});

	// Validate the form data using zod
	const form = superForm(defaults(zod(profileFormSchema)), {
		SPA: true,
		validators: zod(profileFormSchema),
		resetForm: false,
		async onUpdate({ form }) {
			if (form.valid) {
				if (!supabase.client) {
					console.error('No supabase');
					return;
				}
				if (!userState.user?.id) {
					console.error('User is not logged in, cannot update profile.');
					return;
				}

				// Update the user profile in the database
				const { error: profileError } = await supabase.client
					.from('user_public_profiles')
					.update({
						user_name: String($formData.userName ?? ''),
						icon: String($formData.iconKey ?? '')
					})
					.eq('user_id', userState.user.id);

				// Update the user preferences in the database
				const { error: prefError } = await supabase.client
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

				// Refresh UI state
				await userState.refresh();

				// Done, go to app!
				goto('/recipes');
			}
		}
	});

	const { form: formData, enhance } = form as any;

	function randomizeProfileDraft() {
		const draft = generateRandomProfileDraft();
		$formData.firstName = draft.firstName;
		$formData.lastName = '';
		$formData.userName = draft.userName;
		$formData.iconKey = draft.iconKey;
	}

	// Get the current values in supabase to set the input values & placeholders
	$effect(() => {
		$formData.firstName = userState.preferences?.first_name;
		$formData.lastName = userState.preferences?.last_name;
		$formData.userName = userState.profile?.user_name;
		$formData.iconKey = userState.profile?.icon;

		// if (!$formData.firstName && !$formData.userName) {
		// 	randomizeProfileDraft();
		// }
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
								placeholder={String($formData.firstName ?? '') || 'John'}
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
								placeholder={String($formData.lastName ?? '') || 'Doe'}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<p class="text-sm text-muted-foreground">Only visible to you and your family members.</p>
		</div>

		<div class="flex gap-3">
			<Form.Field {form} name="userName" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Username</Form.Label>
						<Input
							{...props}
							bind:value={$formData.userName}
							placeholder={String($formData.userName ?? '') || 'CuiCarrot'}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>This is your public display name.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			{#if userState.profile}
				<UserAvatar
					profile={{ ...userState.profile, icon: $formData.iconKey || 'bird' }}
					class="mt-5.5"
				/>
			{/if}
		</div>

		<!-- <ImagePicker /> -->

		<div class="flex gap-2">
			<Button type="button" variant="outline" class="flex-1" onclick={randomizeProfileDraft}>
				<Dice4 />
				Randomize
			</Button>
			<Form.Button class="flex-1" disabled={!userState.preferences}>
				{#if userState.preferences}
					Let's go!
				{:else}
					Getting ready...
				{/if}
			</Form.Button>
		</div>
	</form>

	<!-- <p class="px-8 text-center text-sm text-muted-foreground"></p> -->
{/if}
