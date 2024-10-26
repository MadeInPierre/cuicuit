<script lang="ts">
	import { Check, Eye, EyeOff, KeyRound, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Avatar from '$lib/shared/components/ui/avatar';
	import { Input } from '$lib/shared/components/ui/input';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Label } from '$lib/shared/components/ui/label';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import {
		GithubAuthProvider,
		GoogleAuthProvider,
		linkWithPopup,
		unlink,
		updatePassword,
		type User
	} from 'firebase/auth';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import { passwordFormSchema } from '$lib/features/auth/models/schemas';
	import { auth } from '$lib/shared/db/firebase-client';
	import { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import UserAuthForm from '../../../(auth)/user-auth-form.svelte';
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import { signOut } from 'firebase/auth';
	import AddProvider from './AddProvider.svelte';

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

	const userDocState = new UserDocState();

	let countProviderChanges = $state(0); // Count the number of provider changes to trigger a UI refresh

	let showPassword = $state(false);
	let showReloginDialog = $state(false);

	const confirmDeleteAccountMessage = $derived(
		`Delete @${userDocState.doc?.userName || 'account'} forever`
	);
	let inputConfirmDeleteAccount: string = $state('');
	let showConfirmDeleteAccountDialog = $state(false);

	function linkProvider(providerId: string) {
		if (!auth || !auth.currentUser) {
			console.error('Error: Auth problem.');
			return;
		}

		let provider;
		switch (providerId) {
			case 'google.com':
				provider = new GoogleAuthProvider();
				break;
			case 'github.com':
				provider = new GithubAuthProvider();
				break;
			default:
				toast.error('An error occured.');
				return;
		}

		linkWithPopup(auth.currentUser, provider)
			.then((result) => {
				// const credential = GoogleAuthProvider.credentialFromResult(result);
				// const user = result.user;
				toast.success('Account linked!');
				console.log(result);
				countProviderChanges++;
			})
			.catch((error) => {
				toast.error('Link failed.');
				console.error(error);
			});
	}

	function unlinkProvider(providerId: string) {
		if (!auth || !auth.currentUser) {
			console.error('Error: Auth problem.');
			return;
		}

		unlink(auth.currentUser, providerId)
			.then((result) => {
				toast.success('Provider unlinked!');
				console.log(result);
				countProviderChanges++;
			})
			.catch((error) => {
				toast.success('Unlink failed.');
				console.error(error);
			});
	}

	function changePassword(newPassword: string) {
		if (!auth || !auth.currentUser) {
			console.error('Error: Auth not found.');
			return;
		}

		updatePassword(auth.currentUser, newPassword)
			.then(() => {
				toast.success('Password changed!');
				countProviderChanges++;
			})
			.catch((error) => {
				console.error(error);
				if (error.message.includes('auth/requires-recent-login')) showReloginDialog = true;
				else toast.error('Something went wrong...');
			});
	}

	function deleteAccount(user: User) {
		if (inputConfirmDeleteAccount === confirmDeleteAccountMessage) {
			// TODO Also delete user data (preferences, family, etc...)
			// TODO Redirect to a goodbye page to ask why the user left
			user
				.delete()
				.then(() => {
					toast.success('Good bye, friend!', {
						description: 'Your account and data have been deleted.'
					});
					goto('/');
				})
				.catch((error) => {
					console.error(error);
					if (error.message.includes('auth/requires-recent-login')) showReloginDialog = true;
					else toast.error('Something went wrong...');
				});
		} else {
			toast.error('Wrong confirmation message.', {
				description: 'Make sure you typed the message correctly to delete your account.'
			});
		}
	}
</script>

{#key countProviderChanges}
	{#if userDocState.user}
		<div class="w-full space-y-8">
			<div class="space-y-2">
				<Label>
					<div class="flex items-center">
						<p class="flex-grow">Primary email</p>

						{#if !userDocState.user.isAnonymous}
							<Badge
								variant={userDocState.user.emailVerified ? 'default' : 'destructive'}
								class={userDocState.user.emailVerified ? 'bg-green-600' : ''}
							>
								{userDocState.user.emailVerified ? 'Verified' : 'Not verified'}

								{#if userDocState.user.emailVerified}
									<Check class="ml-1 h-4 w-4" />
								{/if}
							</Badge>
						{/if}
					</div>
				</Label>
				<div class="flex gap-2">
					<Input value={userDocState.user.email || 'No email set!'} disabled />
					{#if userDocState.user.isAnonymous}
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
					{#if !userDocState.user.isAnonymous}
						You cannot change your primary email address.
					{:else}
						Click the button on the right to create a full account while keeping your data.
					{/if}
				</p>
			</div>

			{#if !userDocState.user.isAnonymous}
				<form method="POST" use:enhance>
					<Form.Field {form} name="password">
						<Form.Control let:attrs>
							<Form.Label>
								{#if userDocState.user.providerData.some((item) => item.providerId === 'password')}
									Change password
								{:else}
									Set password
								{/if}
							</Form.Label>

							<div class="flex gap-2">
								<div class="relative w-full">
									<Input
										{...attrs}
										class="pr-9"
										bind:value={$formData.password}
										placeholder="New password"
										type={showPassword ? 'text' : 'password'}
									/>

									<Button
										size="icon"
										variant="link"
										class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
										on:click={() => {
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
						</Form.Control>
						<Form.FieldErrors />
						<Form.Description>
							Password must be 8 to 30 characters long and include at least one lowercase letter,
							one capital letter, one digit, and one special character.
						</Form.Description>
					</Form.Field>
				</form>

				<div class="space-y-2">
					<!-- <legend class="mb-4 text-lg font-medium"> Login Providers </legend> -->
					<Label>Sign in methods</Label>

					{#each userDocState.user.providerData as provider}
						<div class="rounded-lg border px-5 py-4">
							<div class="flex w-full items-center">
								<Avatar.Root class="mr-4 h-10 w-10">
									{#if provider.providerId === 'password'}
										<Avatar.Fallback>
											<KeyRound class="h-1/2 w-1/2" />
										</Avatar.Fallback>
									{:else}
										<Avatar.Image src={provider.photoURL} alt={provider.displayName} />
										<Avatar.Fallback>
											{provider.providerId.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>

								<div class="flex-grow space-y-0.5">
									<Label>
										{provider.providerId.charAt(0).toUpperCase() +
											provider.providerId.slice(1).replace('.com', '') +
											(provider.displayName ? ` (${provider.displayName})` : '')}
									</Label>
									<p class="text-sm text-muted-foreground">
										{provider.email || ''}
										{provider.phoneNumber || ''}
									</p>
								</div>

								{#if userDocState.user.providerData.length > 1}
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
													on:click={() => unlinkProvider(provider.providerId)}
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
						linkedProviderIds={userDocState.user.providerData.map((e) => e.providerId)}
					/>
				</div>
			{/if}

			<div class="mt-8 grid items-center md:grid-cols-2">
				<p class="text-center md:mr-auto text-sm text-muted-foreground">
					Your uid is {userDocState.user.uid || 'unknown'}
				</p>

				<Button
					variant="link"
					class="px-0 text-destructive md:ml-auto"
					on:click={() => (showConfirmDeleteAccountDialog = true)}
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
						on:click={() => {
							showConfirmDeleteAccountDialog = false;
						}}
					>
						Cancel
					</Button>
					<Button
						on:click={() => {
							deleteAccount(userDocState.user!);
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
						on:click={() => {
							showReloginDialog = false;
						}}
					>
						Cancel
					</AlertDialog.Cancel>
					<AlertDialog.Action on:click={() => signOut(auth)}>Sign out</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if}
{/key}
