<script lang="ts" module>
	const authSchema = passwordFormSchema.extend({ email: z.string().email() });
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resetPassword } from '$lib/features/auth/actions/reset-password';
	import { signupOrLogin } from '$lib/features/auth/actions/signup-or-login';
	import { AuthMethod } from '$lib/features/auth/models/auth-method';
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import { passwordFormSchema } from '$lib/features/auth/models/schemas';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { Icons } from '$lib/shared/icons';
	import { cn } from '$lib/utils';
	import { Check, Eye, EyeOff } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import SeparatorZigZag from '../(app)/shopping-list/SeparatorZigZag.svelte';

	// Component props
	interface Props {
		logMethod: LogMethod;
		class?: string | undefined | null;
		[key: string]: any; // Other props
	}

	let { logMethod, class: className = undefined, ...restProps }: Props = $props();

	// Validate the form data using zod
	const form = superForm(defaults(zod(authSchema)), {
		SPA: true,
		validators: zod(authSchema),
		clearOnSubmit: 'none',
		onUpdate({ form }) {
			if (form.valid) {
				onSubmit(AuthMethod.EMAIL_PASSWORD);
			}
		}
	});
	const { form: formData, enhance } = form;

	// Component state
	let linkEmailSent = $state(false);
	let isLoading = $state(false);
	let selectedMethod: AuthMethod = $state(AuthMethod.ANONYMOUS);
	let showExistingAccountDialog = $state(false);
	let showPasswordRequirements = $state(false);
	let showPassword = $state(false);

	/**
	 * Handle the form submission
	 * @param authMethod The authentication method selected by the user (email/password, google, etc)
	 */
	async function onSubmit(authMethod: AuthMethod) {
		if (!supabase.client?.auth) {
			console.error('Error: Auth not found.');
			return;
		}

		isLoading = true;
		selectedMethod = authMethod;

		try {
			if (logMethod == LogMethod.LOGIN || logMethod == LogMethod.SIGNUP) {
				const { emailSent } = await signupOrLogin(
					logMethod,
					authMethod,
					$formData.email,
					$formData.password
				);
				linkEmailSent = emailSent;
			} else if (logMethod == LogMethod.CONVERT_ANONYMOUS) {
				// TODO convertAnonToUser(logMethod, authMethod, $formData.email, $formData.password);
			} else {
				throw new Error('Invalid log method');
			}
		} catch (error: any) {
			if (error.message.includes('auth/account-exists-with-different-credential')) {
				showExistingAccountDialog = true;
			} else if (error.message.includes('auth/credential-already-in-use')) {
				toast.error('Account already exists.', {
					description:
						'Looks like you already have an account with this provider, contact us if you want us to merge both accounts.',
					duration: 20000
				});
			} else if (error.message.includes('auth/email-already-in-use')) {
				showExistingAccountDialog = true;
			} else if (
				error.message.includes('auth/invalid-login-credentials') ||
				error.message.includes('auth/wrong-password')
			) {
				toast.error('Incorrect email or password.', {
					description: 'Please try again.'
				});
			} else {
				// toast.error('Something went wrong...', {
				// 	description: 'Please try again later.'
				// });
			}
		}
		isLoading = false;
	}
</script>

<div class={cn('grid gap-4', className)} {...restProps}>
	<div class="grid grid-cols-1 gap-3">
		<Button
			variant="outline"
			type="button"
			disabled={isLoading}
			onclick={() => onSubmit(AuthMethod.GOOGLE)}
		>
			{#if isLoading && selectedMethod == AuthMethod.GOOGLE}
				<Icons.spinner class="mr-2 size-4 animate-spin" />
			{:else}
				<Icons.google class="mr-2 size-4" />
			{/if}
			Continue with Google
		</Button>

		<Button
			variant="outline"
			type="button"
			disabled={true}
			onclick={() => onSubmit(AuthMethod.APPLE)}
			class="relative"
		>
			{#if isLoading && selectedMethod == AuthMethod.APPLE}
				<Icons.spinner class="mr-2 size-4 animate-spin" />
			{:else}
				<Icons.apple class="mr-2 size-4" />
			{/if}
			Continue with Apple
			<span class="absolute right-4 top-1/2 -translate-y-1/2 italic text-xs">soon</span>
		</Button>
	</div>

	<div class="flex gap-3 items-center mt-2">
		<SeparatorZigZag />

		<span class="text-muted-foreground uppercase text-xs min-w-max"> Or continue with </span>

		<SeparatorZigZag />
	</div>

	<form method="POST" use:enhance>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>

							<Input
								{...props}
								type="email"
								placeholder="name@example.com"
								autocapitalize="none"
								autocomplete="email"
								autocorrect="off"
								disabled={isLoading}
								bind:value={$formData.email}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="grid gap-2">
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<Form.Label>Password</Form.Label>

								{#if logMethod == LogMethod.LOGIN}
									<button
										onclick={() => resetPassword($formData.email)}
										class="text-xs text-muted-foreground decoration-dotted underline-offset-4 hover:underline"
										type="button"
										tabindex={-1}
									>
										Forgot password?
									</button>
								{/if}
							</div>

							<div class="relative w-full">
								<Input
									{...props}
									class="pr-9"
									type={showPassword ? 'text' : 'password'}
									placeholder="Password"
									disabled={isLoading}
									bind:value={$formData.password}
									onfocus={() => {
										showPasswordRequirements = true;
									}}
								/>

								<Button
									size="icon"
									variant="link"
									class="absolute right-3 top-1/2 size-4 -translate-y-1/2 transform"
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
						{/snippet}
					</Form.Control>

					<Form.FieldErrors />

					{#if showPasswordRequirements && logMethod != LogMethod.LOGIN}
						<p class="text-xs text-muted-foreground">
							Password must be 8 to 30 characters long and include at least one capital letter and
							number.
						</p>
					{/if}

					<Form.Button disabled={isLoading || linkEmailSent} type="submit" class="mt-2 w-full">
						{#if linkEmailSent}
							<Check class="mr-2 h-5 w-5" />
							Your email is on the way, click on the link!
						{:else if isLoading && selectedMethod == AuthMethod.EMAIL_PASSWORD}
							<Icons.spinner class="mr-2 size-4 animate-spin" />
							Sending email...
						{:else if logMethod == LogMethod.LOGIN}
							Log in with Email
						{:else}
							Sign up with Email
						{/if}
					</Form.Button>
				</Form.Field>
			</div>
		</div>
	</form>

	<!-- {#if logMethod == LogMethod.SIGNUP}
		<AlertDialog.Root>
			<AlertDialog.Trigger>
				<Button variant="ghost" size="sm" class="w-full font-normal" disabled={isLoading}>
					{#if isLoading && selectedMethod == AuthMethod.ANONYMOUS}
						<Icons.spinner class="size-4 animate-spin" />
					{:else}
						<ShieldQuestion class="size-4" />
					{/if}
					<span class="pt-0.5">Continue anonymously</span>
				</Button>
			</AlertDialog.Trigger>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you sure?</AlertDialog.Title>
					<AlertDialog.Description>
						Your profile will only be available on this device. Don't worry, you will be able to
						link your profile to a full account later if you like the app!
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action onclick={() => onSubmit(AuthMethod.ANONYMOUS)}>
						Continue anonymously
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if} -->
</div>

<AlertDialog.Root open={showExistingAccountDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Another account already exists</AlertDialog.Title>
			<AlertDialog.Description>
				The same email is used with another existing account. If you are the owner, please sign in
				using one of the methods already linked. You can add more methods from your account settings
				once logged in.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					showExistingAccountDialog = false;
				}}
			>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					goto('/login');
				}}
			>
				Go to login
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
