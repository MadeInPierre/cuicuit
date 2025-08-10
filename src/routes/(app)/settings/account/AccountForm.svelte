<script lang="ts">
	import { Check, Eye, EyeOff, KeyRound, Trash2, User as UserIcon } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Avatar from '$lib/shared/components/ui/avatar';
	import { Input } from '$lib/shared/components/ui/input';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Label } from '$lib/shared/components/ui/label';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { passwordFormSchema } from '$lib/features/auth/models/schemas';
	import UserAuthForm from '../../../(auth)/user-auth-form.svelte';
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import AddProvider from './AddProvider.svelte';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { capitalize } from '$lib/utils';
	import type { Provider, User } from '@supabase/supabase-js';
	import { signOut } from '$lib/features/auth/actions/sign-out';

	// Validate the form data using zod
	const form = superForm(defaults(zod(passwordFormSchema)), {
		SPA: true,
		validators: zod(passwordFormSchema),

		onUpdate({ form }) {
			if (form.valid) {
				changePassword(form.data.password);
			}
		}
	});
	const { form: formData, enhance } = form;

	let countProviderChanges = $state(0); // Count the number of provider changes to trigger a UI refresh

	let showPassword = $state(false);
	let showReloginDialog = $state(false);

	const confirmDeleteAccountMessage = $derived(
		`Delete @${userState.user?.email || 'account'} forever`
	);
	let inputConfirmDeleteAccount: string = $state('');
	let showConfirmDeleteAccountDialog = $state(false);

	async function linkProvider(providerId: string) {
		if (!supabase || !userState.user) {
			console.error('Error: Auth problem.');
			return;
		}

		console.log('Linking provider:', providerId, 'for user:', userState.user.id);

		const { data, error } = await supabase.auth.linkIdentity({
			provider: providerId as Provider,
			options: {
				redirectTo: window.location.origin + '/settings/account'
			}
		});

		if (error) {
			console.error('Error linking provider:', error);
			toast.error('Link failed.');
			return;
		}

		if (data) {
			toast.success('Account linked!');
			console.log('Provider linked successfully:', data);
			countProviderChanges++;
		} else {
			toast.error('Link failed.');
			console.error('No data returned from linkIdentity:', data);
		}

		// linkWithPopup(auth.currentUser, provider)
		// 	.then((result) => {
		// 		// const credential = GoogleAuthProvider.credentialFromResult(result);
		// 		// const user = result.user;
		// 		toast.success('Account linked!');
		// 		console.log(result);
		// 		countProviderChanges++;
		// 	})
		// 	.catch((error) => {
		// 		toast.error('Link failed.');
		// 		console.error(error);
		// 	});
	}

	function unlinkProvider(providerId: string) {
		if (!supabase || !userState.user) {
			console.error('Error: Auth problem.');
			return;
		}

		// TODO: Implement provider unlinking
		// unlink(auth.currentUser, providerId)
		// 	.then((result) => {
		// 		toast.success('Provider unlinked!');
		// 		console.log(result);
		// 		countProviderChanges++;
		// 	})
		// 	.catch((error) => {
		// 		toast.success('Unlink failed.');
		// 		console.error(error);
		// 	});
	}

	function changePassword(newPassword: string) {
		if (!supabase || !userState.user) {
			console.error('Error: Auth not found.');
			return;
		}

		// TODO: Implement password change
		// updatePassword(auth.currentUser, newPassword)
		// 	.then(() => {
		// 		toast.success('Password changed!');
		// 		countProviderChanges++;
		// 	})
		// 	.catch((error) => {
		// 		console.error(error);
		// 		if (error.message.includes('auth/requires-recent-login')) showReloginDialog = true;
		// 		else toast.error('Something went wrong...');
		// 	});
	}

	function deleteAccount(user: User) {
		if (inputConfirmDeleteAccount === confirmDeleteAccountMessage) {
			// TODO Also delete user data (preferences, family, etc...)
			// TODO Redirect to a goodbye page to ask why the user left
			// TODO: Implement account deletion
			// user
			// 	.delete()
			// 	.then(() => {
			// 		toast.success('Good bye, friend!', {
			// 			description: 'Your account and data have been deleted.'
			// 		});
			// 		goto('/');
			// 	})
			// 	.catch((error) => {
			// 		console.error(error);
			// 		if (error.message.includes('auth/requires-recent-login')) showReloginDialog = true;
			// 		else toast.error('Something went wrong...');
			// 	});
		} else {
			toast.error('Wrong confirmation message.', {
				description: 'Make sure you typed the message correctly to delete your account.'
			});
		}
	}
</script>

{#key countProviderChanges}
	{#if userState.user}
		<div class="w-full space-y-8">
			<div class="space-y-2">
				<Label>
					<div class="flex items-center">
						<p class="flex-grow">Primary email</p>

						{#if !userState.user.is_anonymous}
							<Badge
								variant={userState.user.email_confirmed_at ? 'default' : 'destructive'}
								class={userState.user.email_confirmed_at ? 'bg-green-600' : ''}
							>
								{userState.user.email_confirmed_at ? 'Verified' : 'Not verified'}

								{#if userState.user.email_confirmed_at}
									<Check class="ml-1 h-4 w-4" />
								{/if}
							</Badge>
						{/if}
					</div>
				</Label>
				<div class="flex gap-2">
					<Input value={userState.user?.email || 'No email set!'} disabled />
					{#if userState.user.is_anonymous}
						<Dialog.Root>
							<Dialog.Trigger>
								<Button>Create account</Button>
							</Dialog.Trigger>
							<Dialog.Content class="sm:max-w-[425px]">
								<Dialog.Header>
									<Dialog.Title>Sign up</Dialog.Title>
									<Dialog.Description>Choose your preferred method below.</Dialog.Description>
								</Dialog.Header>
								<div class="mt-2">
									<UserAuthForm logMethod={LogMethod.CONVERT_ANONYMOUS} />
								</div>
							</Dialog.Content>
						</Dialog.Root>
					{/if}
				</div>
				<p class="text-sm text-muted-foreground">
					{#if !userState.user.is_anonymous}
						You cannot change your primary email address.
					{:else}
						Click the button on the right to create a full account while keeping your data.
					{/if}
				</p>
			</div>

			{#if !userState.user.is_anonymous}
				<form method="POST" use:enhance>
					<Form.Field {form} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									{#if userState.user?.identities?.some((i) => i.provider === 'email')}
										Change password
									{:else}
										Set password
									{/if}
								</Form.Label>

								<div class="flex gap-2">
									<div class="relative w-full">
										<Input
											{...props}
											class="pr-9"
											bind:value={$formData.password}
											placeholder="New password"
											type={showPassword ? 'text' : 'password'}
										/>

										<Button
											size="icon"
											variant="link"
											class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
											onclick={() => {
												showPassword = !showPassword;
											}}
										>
											{#if showPassword}
												<EyeOff />
											{:else}
												<Eye />
											{/if}
										</Button>
									</div>

									<Form.Button>Update</Form.Button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
						<Form.Description>
							You must have logged in recently to change your password, please sign out and log in
							again if needed. Password must be 8 to 30 characters long.
						</Form.Description>
					</Form.Field>
				</form>

				<div class="space-y-2">
					<!-- <legend class="mb-4 text-lg font-medium"> Login Providers </legend> -->
					<Label>Sign in methods</Label>

					{#each userState.user.identities || [] as identity (identity.provider)}
						<div class="rounded-lg border px-5 py-4">
							<div class="flex w-full items-center">
								<Avatar.Root class="mr-4 h-10 w-10">
									{#if identity.provider === 'email'}
										<Avatar.Fallback>
											<KeyRound class="h-1/2 w-1/2" />
										</Avatar.Fallback>
									{:else}
										<Avatar.Image
											src={identity.identity_data?.avatar_url}
											alt={identity.identity_data?.name}
										/>
										<Avatar.Fallback>
											{identity.provider.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>

								<div class="flex-grow space-y-0.5">
									<Label>
										{capitalize(identity.provider).replace('.com', '')}
										{identity.identity_data?.name ? `(${identity.identity_data?.name})` : ''}
									</Label>
									<p class="text-sm text-muted-foreground">
										{#if identity.last_sign_in_at}
											Last login: {new Date(identity.last_sign_in_at).toLocaleDateString('fr-FR', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit'
											})}
										{:else}
											No login yet.
										{/if}
									</p>
								</div>

								{#if userState.user?.identities && userState.user.identities.length > 1}
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											<Button size="icon" variant="destructive">
												<Trash2 class="h-5 w-5" />
											</Button>
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title class="text-destructive">Are you sure?</AlertDialog.Title
												>
												<AlertDialog.Description>
													You are about to delete this account provider. You will not be able to
													login using this method anymore, unless you link it again in the future.
												</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action
													onclick={() => unlinkProvider(identity.provider)}
													class="bg-destructive"
												>
													Delete
												</AlertDialog.Action>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<div class="flex flex-col space-y-2">
					<Label>Add a method</Label>
					<AddProvider
						onSelected={(p) => linkProvider(p)}
						linkedProviderIds={userState.user?.identities?.map((i) => i.provider) || []}
					/>
				</div>
			{/if}

			<div class="mt-8 grid items-center md:grid-cols-2">
				<p class="text-center md:mr-auto text-sm text-muted-foreground">
					{userState.user.id || 'unknown'}
				</p>

				<Button
					variant="link"
					class="px-0 text-destructive md:ml-auto"
					onclick={() => (showConfirmDeleteAccountDialog = true)}
				>
					<Trash2 class="mr-2 h-4 w-4 text-destructive" />
					Delete my account
				</Button>
			</div>
		</div>

		<Dialog.Root bind:open={showConfirmDeleteAccountDialog}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Leave forever?</Dialog.Title>
					<Dialog.Description class="flex flex-col space-y-4 py-4">
						<p>
							This action CANNOT be undone. All your data will be deleted such as your login,
							preferences, profile photo, kitchen contents, and so on.
						</p>

						<p>Please write "{confirmDeleteAccountMessage}" in the box below to confirm:</p>

						<Input
							placeholder={confirmDeleteAccountMessage}
							bind:value={inputConfirmDeleteAccount}
						/>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer class="gap-2">
					<Button
						variant="outline"
						onclick={() => {
							showConfirmDeleteAccountDialog = false;
						}}
					>
						Cancel
					</Button>
					<Button
						onclick={() => {
							if (!userState.user) return;
							deleteAccount(userState.user);
							showConfirmDeleteAccountDialog = true;
						}}
						variant="destructive"
					>
						Delete my account forever
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<AlertDialog.Root open={showReloginDialog}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Please log in again</AlertDialog.Title>
					<AlertDialog.Description>
						You can change your password after a fresh login. Please sign out, log in again, and
						come back here to change your password. Gotta be secure!
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel
						onclick={() => {
							showReloginDialog = false;
						}}
					>
						Cancel
					</AlertDialog.Cancel>
					<AlertDialog.Action onclick={signOut}>Sign out</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if}
{/key}
