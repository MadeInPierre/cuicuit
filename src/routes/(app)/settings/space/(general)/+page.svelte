<script lang="ts">
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { leaveSpace } from '$lib/features/spaces/actions/leave-space';
	import EditSpaceForm from '$lib/features/spaces/components/EditSpaceForm.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Input } from '$lib/shared/components/ui/input';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { LogOut } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const spaceState = getActiveSpaceState();

	let showConfirmLeaveSpaceDialog = $state(false);
	let inputValue = $state('');
	let allowedToLeave = $derived((spaceState.userSpaces || []).length >= 2);

	async function leaveActiveSpace() {
		if (
			!spaceState.id ||
			!userState.user?.id ||
			!spaceState.activeSpace ||
			!spaceState.userSpaces
		) {
			console.error('Cannot leave space, missing active space or user ID.');
			return;
		}

		if (spaceState.userSpaces.length < 2) {
			toast.error('Cannot leave.', {
				description: 'This is your only space, create another first.'
			});
			return;
		}

		try {
			console.log('Leaving space:', spaceState.activeSpace.id, 'for user:', userState.user.id);
			await leaveSpace(userState.user?.id, spaceState.activeSpace.id);
			showConfirmLeaveSpaceDialog = false;
		} catch (error: any) {
			console.error('Error leaving space:', error);
			toast.error('Failed to leave space.', {
				description: error.message || 'An unexpected error occurred.'
			});
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">
			General settings for
			<span class="font-bold">{spaceState.activeSpace?.name || 'Space'}</span>
		</h3>
		<!-- <p class="text-sm text-muted-foreground">Settings related to the currently active space.</p> -->
	</div>
	<!-- <Separator /> -->

	<EditSpaceForm />

	<div class="mt-8 grid items-center md:grid-cols-2">
		<p class="text-center md:mr-auto text-sm text-muted-foreground">
			This space's uid is {spaceState.id || 'unknown'}
		</p>

		<Button
			disabled={!allowedToLeave}
			variant="link"
			class="px-0 text-destructive md:ml-auto"
			onclick={() => {
				if (allowedToLeave) showConfirmLeaveSpaceDialog = true;
				else {
					toast.error('Cannot leave.', {
						description: 'This is your only space, create another first.'
					});
				}
			}}
		>
			<LogOut class="mr-2 h-4 w-4 text-destructive" />
			Leave this space
		</Button>
	</div>
</div>

<Dialog.Root bind:open={showConfirmLeaveSpaceDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Leave {spaceState.activeSpace?.name || 'Space'}?</Dialog.Title>
			<Dialog.Description class="flex flex-col space-y-4 py-4">
				<p>
					This action cannot be undone. Your activity and history will stay in the space as archived
					data. You may rejoin the space later if you have the invite link.
				</p>

				<p>Please write "{spaceState.activeSpace?.name || 'Space'}" in the box below to confirm:</p>

				<Input placeholder={spaceState.activeSpace?.name || 'Space'} bind:value={inputValue} />
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2">
			<Button
				variant="outline"
				onclick={() => {
					showConfirmLeaveSpaceDialog = false;
				}}
			>
				Cancel
			</Button>
			<Button
				disabled={inputValue !== (spaceState.activeSpace?.name || 'Space')}
				onclick={leaveActiveSpace}
				variant="destructive"
			>
				Leave {spaceState.activeSpace?.name || 'Space'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
