<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { generateRandomProfileDraft } from '$lib/features/auth/actions/create-user-data';
	import { profileFormSchema } from '$lib/features/auth/models/schemas';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { languages, type LanguageKey } from '$lib/features/user-settings/consts';
	import { getClientCtx, runOp } from '$lib/core/operations/client.js';
	import '$lib/core/operations/profile/complete-onboarding.js';
	import type { ProfileCompleteOnboardingInput } from '$lib/core/operations/profile/complete-onboarding.js';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { cn } from '$lib/utils';
	import { Check } from '@lucide/svelte';
	import posthog from 'posthog-js';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

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
	const form = superForm(defaults(zod4(profileFormSchema)), {
		SPA: true,
		validators: zod4(profileFormSchema),
		resetForm: false,
		async onUpdate({ form }) {
			if (form.valid) {
				if (!userState.user?.id) {
					console.error('User is not logged in, cannot update profile.');
					return;
				}

				// Persist onboarding in one op (profile + preferences + spaces language)
				try {
					await runOp<ProfileCompleteOnboardingInput, void>(
						'profile.complete-onboarding',
						await getClientCtx(),
						{
							userId: userState.user.id,
							userName: String($formData.userName ?? ''),
							icon: String($formData.iconKey ?? ''),
							firstName: $formData.firstName,
							lastName: $formData.lastName,
							lang: $formData.lang
						}
					);
				} catch (error) {
					console.error('Error updating user data:', error);
					toast.error('Failed to update your profile. Please try again later.');
					return;
				}

				// Refresh UI state
				await userState.refresh();
				posthog.capture('onboarding_completed');

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
		$formData.lang ??= 'en-US';
	});
</script>

{#if userState.preferences?.onboarding_status === 'finished'}
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">All good!</h1>
		<p class="text-sm text-muted-foreground">2 clicks left to import your first recipe!</p>
	</div>
{:else}
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome to Cuicuit!</h1>
		<p class="text-sm text-muted-foreground">Let's get to know each other a little!</p>
	</div>

	<form method="POST" use:enhance class="space-y-4">
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

			<p class="text-sm text-muted-foreground">Only visible to you and your household members.</p>
		</div>

		<!-- <div class="flex gap-3">
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
		</div> -->

		<div class="space-y-2">
			<Form.Fieldset {form} name="lang">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Language</Form.Label>

						<div class="grid grid-cols-2 gap-2 items-center w-full pt-1">
							{#each Object.keys(languages) as LanguageKey[] as l}
								<Button
									{...props}
									type="button"
									size="sm"
									variant="outline"
									onclick={() => ($formData.lang = l)}
									class={cn(
										'relative p-3 shadow-2xs border border-border/60 transition-all flex items-center gap-2',
										l === $formData.lang && 'ring-3 ring-primary/60 border-transparent'
									)}
								>
									{languages[l as keyof typeof languages].emoji}
									{languages[l as keyof typeof languages].label}

									{#if l === $formData.lang}
										<span class={cn('absolute right-3 flex size-3 items-center justify-center')}>
											<Check class={cn('size-4.5 text-primary')} />
										</span>
									{/if}
								</Button>
							{/each}
						</div>

						<Form.Description>For ingredient names. App translation soon.</Form.Description>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Fieldset>
		</div>

		<div class="flex gap-2">
			<!-- <Button type="button" variant="outline" class="flex-1" onclick={randomizeProfileDraft}>
				<Dice4 />
				Randomize
			</Button> -->
			<Form.Button class="flex-1" disabled={!userState.preferences}>
				{#if userState.preferences}
					Let's go!
				{:else}
					Getting ready...
				{/if}
			</Form.Button>
		</div>
	</form>
{/if}
