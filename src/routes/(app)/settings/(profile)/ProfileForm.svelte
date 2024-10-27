<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { superForm, defaults, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { Check, Loader2, X } from 'lucide-svelte';
	import { profileFormSchema, type ProfileFormSchema } from '$lib/features/auth/models/schemas';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { updateUserProfile } from '$lib/features/user-settings/actions/update-user-profile';
	import ImagePicker from './AvatarForm.svelte';

	// Show a status icon to the user in real-time
	enum UpdateStatus {
		STANDBY,
		LOADING,
		SUCCESS,
		FAILED
	}
	let updateStatus: UpdateStatus = $state(UpdateStatus.STANDBY);

	// Validate the form data using zod
	const form = superForm(defaults(zod(profileFormSchema)), {
		SPA: true,
		validators: zod(profileFormSchema),

		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
		}
	});
	const { form: formData, enhance, allErrors } = form;

	const userDocState = getUserDocState();

	async function onSubmit(data: Infer<ProfileFormSchema>) {
		updateStatus = UpdateStatus.LOADING;

		try {
			// Write the new user data to the database
			await updateUserProfile(userDocState, data);

			// Notify success to the user
			updateStatus = UpdateStatus.SUCCESS;
			toast.success('Profile updated 🎉', {
				description: `Nice to meet you, ${data.firstName}!`
			});
		} catch (error: any) {
			// Notify the user of the error
			updateStatus = UpdateStatus.FAILED;
			console.error('Failed to update profile:', error);
			if (error.message == 'Missing profile information') {
				toast.error('Missing information', { description: 'Please fill in all the fields.' });
			} else {
				toast.error('Failed to update 😢', { description: 'Please try again later.' });
			}
		}

		// Update the form placeholders with the new profile data
		setTimeout(() => (updateStatus = UpdateStatus.STANDBY), 3000);
		updateFormFields();
	}

	// Set the input values & placeholders with the
	// current user data when entering the page
	let initialUserData: any = $state(undefined);

	// This effect runs when the userDocState changes to fill the form fields
	$effect(() => {
		if (userDocState.doc) {
			initialUserData = userDocState.doc;
			updateFormFields();
		}
	});

	// Update the form fields with the current user doc's data
	function updateFormFields() {
		$formData.firstName = initialUserData?.firstName;
		$formData.lastName = initialUserData?.lastName;
		$formData.userName = initialUserData?.userName;
	}

	// Disable submit button if the values are identical to the placeholders
	const buttonDisabled = $derived(
		$allErrors.length > 0 ||
			($formData.firstName == initialUserData?.firstName &&
				$formData.lastName == initialUserData?.lastName &&
				$formData.userName == initialUserData?.userName)
	);
</script>

<form method="POST" use:enhance class="space-y-8">
	<legend class="text-lg font-medium">Avatar</legend>

	<ImagePicker />

	<legend class="text-lg font-medium">Display name</legend>

	<div class="flex flex-col">
		<div class="flex w-full gap-4">
			<Form.Field {form} name="firstName" class="w-full">
				<Form.Control let:attrs>
					<Form.Label>First name</Form.Label>
					<Input
						{...attrs}
						bind:value={$formData.firstName}
						placeholder={initialUserData?.firstName || 'John'}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="lastName" class="w-full">
				<Form.Control let:attrs>
					<Form.Label>Last name</Form.Label>
					<Input
						{...attrs}
						bind:value={$formData.lastName}
						placeholder={initialUserData?.lastName || 'Doe'}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<p class="text-sm text-muted-foreground">Only visible to you and your family members.</p>
	</div>

	<Form.Field {form} name="userName">
		<Form.Control let:attrs>
			<Form.Label>Username</Form.Label>
			<Input
				{...attrs}
				bind:value={$formData.userName}
				placeholder={initialUserData?.userName || 'johndoe'}
			/>
		</Form.Control>
		<Form.Description>
			This is your public display name. You can only change this once every 30 days.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<div class="flex items-center gap-4">
		<Form.Button disabled={buttonDisabled}>Update</Form.Button>

		{#if updateStatus == UpdateStatus.LOADING}
			<Loader2 class="animate-spin" />
		{:else if updateStatus == UpdateStatus.SUCCESS}
			<Check class="text-green-600" />
		{:else if updateStatus == UpdateStatus.FAILED}
			<X class="text-red-600" />
		{/if}
	</div>

	<!-- {#if browser && dev}
		<SuperDebug data={$formData} />
		{/if} -->
</form>
