<script lang="ts">
	import * as Form from '$lib/shared/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { getDoc } from 'firebase/firestore';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { userState } from '$lib/features/auth/state/user.svelte';
	import { doc, updateDoc } from 'firebase/firestore';
	import { Input } from '$lib/shared/components/ui/input';
	import { onMount } from 'svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import { profileFormSchema } from '$lib/features/auth/models/schemas';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import type { UserDoc } from '$lib/features/auth/db/user-doc';

	// Require the user to be signed in to get here
	$effect(() => {
		if (browser && userState.user === null) {
			console.warn('User is not logged in, redirect to signup');
			goto('/signup');
		}
	});

	const userDocState = getUserDocState();

	// Forbid this zone if the user already finished his onboarding
	$effect(() => {
		if (
			browser &&
			userDocState &&
			userDocState.doc &&
			userDocState.doc.checklist.welcome === true
		) {
			console.log('User has finished onboarding, going to dashboard.');
			goto('/dashboard');
		}
	});

	// Validate the form data using zod
	const form = superForm(defaults(zod(profileFormSchema)), {
		SPA: true,
		validators: zod(profileFormSchema),
		async onUpdate({ form }) {
			if (form.valid) {
				// Mark the welcome step as finished
				console.log('Marking the welcome step as finished.');
				const docRef = doc(firestore!, 'users', userState.user!.uid);
				await updateDoc(docRef, {
					firstName: form.data.firstName,
					lastName: form.data.lastName,
					userName: form.data.userName,
					'checklist.welcome': true
				});

				// Done, go to dashboard!
				goto('/dashboard');
			}
		}
	});

	const { form: formData, enhance } = form;

	// Get the current values in firestore to set the input values & placeholders
	onMount(async () => {
		if (firestore && userState.user) {
			const docRef = doc(firestore, 'users', userState.user.uid);
			const userDoc = await getDoc(docRef).catch((error) => {
				console.log("Coudln't get user doc.", error);
			});

			const data = userDoc?.data() as UserDoc;
			console.log('Initial user data:', data);

			if (data) {
				$formData.firstName = data.firstName;
				$formData.lastName = data.lastName;
				$formData.userName = data.userName;
			}
		}
	});
</script>

{#if userDocState?.doc && userDocState?.doc.checklist.welcome == false}
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
