<script lang="ts">
	import { profileFormSchema, type ProfileFormSchema } from '$lib/features/auth/models/schemas';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { updateUserPreferences } from '$lib/features/user-settings/actions/update-user-preferences';
	import { updateUserProfile } from '$lib/features/user-settings/actions/update-user-profile';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { Check, Loader2, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import ImagePicker from './AvatarForm.svelte';

	const userState = getUserState();

	// Show a status icon to the user in real-time
	type UpdateStatus = 'idle' | 'loading' | 'success' | 'failed';
	let updateStatus: UpdateStatus = $state('idle');

	// Validate the form data using zod
	const form = superForm(defaults(zod4(profileFormSchema)), {
		SPA: true,
		validators: zod4(profileFormSchema),
		resetForm: false,
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
		}
	});
	const { form: formData, enhance, allErrors } = form;

	async function onSubmit(data: Infer<ProfileFormSchema>) {
		if (!userState.user?.id) {
			console.error('User is not logged in, cannot update profile.');
			return;
		}

		updateStatus = 'loading';

		try {
			// Write the new user data to the database
			await updateUserProfile(userState.user.id, data);
			await updateUserPreferences(userState.user.id, data);

			// Notify success to the user
			updateStatus = 'success';
			toast.success('Profile updated 🎉', {
				description: `All good, ${data.firstName}!`
			});
		} catch (error: any) {
			// Notify the user of the error
			updateStatus = 'failed';
			console.error('Failed to update profile:', error);
			if (error.message == 'Missing profile information') {
				toast.error('Missing information', { description: 'Please fill in all the fields.' });
			} else {
				toast.error('Failed to update 😢', { description: 'Please try again later.' });
			}
		}

		// Update the form placeholders with the new profile data
		await userState.refresh();
		updateStatus = 'idle';
	}

	// This effect runs when the userState changes to fill the form fields
	$effect(() => {
		$formData.firstName = userState.preferences?.first_name || '';
		$formData.lastName = userState.preferences?.last_name || '';
		$formData.userName = userState.profile?.user_name || '';
	});

	// Disable submit button if the values are identical to the placeholders
	const buttonDisabled = $derived(
		$allErrors.length > 0 ||
			($formData.firstName == userState.preferences?.first_name &&
				$formData.lastName == userState.preferences?.last_name &&
				$formData.userName == userState.profile?.user_name)
	);
</script>

<form method="POST" use:enhance class="space-y-8">
	<legend class="text-lg font-medium">Avatar</legend>

	<ImagePicker />

	<Separator />

	<legend class="text-lg font-medium">Display name</legend>

	<div class="flex flex-col">
		<div class="flex w-full gap-4">
			<Form.Field {form} name="firstName" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>First name</Form.Label>
						<Input {...props} bind:value={$formData.firstName} placeholder="John" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="lastName" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Last name (optional)</Form.Label>
						<Input {...props} bind:value={$formData.lastName} placeholder="Doe" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<p class="text-sm text-muted-foreground">
			Only visible to you and members of spaces you've joined.
		</p>
	</div>

	<Form.Field {form} name="userName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Username</Form.Label>
				<Input {...props} bind:value={$formData.userName} placeholder="eEg. ninjabird" />
			{/snippet}
		</Form.Control>
		<Form.Description
			>This is your public display name. Not used in the app yet, maybe in the future!</Form.Description
		>
		<Form.FieldErrors />
	</Form.Field>

	<div class="flex items-center gap-4">
		<Form.Button disabled={buttonDisabled}>Update</Form.Button>

		{#if updateStatus == 'loading'}
			<Loader2 class="animate-spin" />
		{:else if updateStatus == 'success'}
			<Check class="text-green-600" />
		{:else if updateStatus == 'failed'}
			<X class="text-red-600" />
		{/if}
	</div>

	<!-- {#if browser && dev}
		<SuperDebug data={$formData} />
		{/if} -->
</form>
