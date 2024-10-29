<script lang="ts">
	import EditSpaceForm from '$lib/features/spaces/components/EditSpaceForm.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { LogOut } from 'lucide-svelte';
	import { Input } from '$lib/shared/components/ui/input';
	import { leaveSpace } from '$lib/features/spaces/actions/leave-space';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { toast } from 'svelte-sonner';

	const userDocState = getUserDocState();
	const activeSpace = getActiveSpaceState();

	let showConfirmLeaveSpaceDialog = $state(false);
	let inputValue = $state('');
	let allowedToLeave = $derived(Object.keys(userDocState.doc!.spaces).length > 1);
	$inspect(allowedToLeave);

	async function leaveActiveSpace() {
		if (!activeSpace.id) return;
		try {
			await leaveSpace(userDocState, activeSpace, activeSpace.id);
			showConfirmLeaveSpaceDialog = false;
		} catch (error: any) {
			if (error.message === 'last-space-of-user') {
				toast.error('Cannot leave.', {
					description: 'This is your only space, create another first.'
				});
			}
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">{activeSpace.doc?.name} settings</h3>
		<p class="text-sm text-muted-foreground">Settings related to the currently active space.</p>
	</div>
	<Separator />

	<EditSpaceForm />

	<div class="mt-8 grid items-center md:grid-cols-2">
		<p class="text-center md:mr-auto text-sm text-muted-foreground">
			This space's uid is {activeSpace.id || 'unknown'}
		</p>

		<Button
			disabled={!allowedToLeave}
			variant="link"
			class="px-0 text-destructive md:ml-auto"
			on:click={() => {
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
			<Dialog.Title>Leave {activeSpace.doc?.name}?</Dialog.Title>
			<Dialog.Description class="flex flex-col space-y-4 py-4">
				<p>
					This action cannot be undone. Your activity and history will stay in the space as archived
					data. You may rejoin the space later if you have the invite link.
				</p>

				<p>Please write "{activeSpace.doc?.name}" in the box below to confirm:</p>

				<Input placeholder={activeSpace.doc?.name} bind:value={inputValue} />
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2">
			<Button
				variant="outline"
				on:click={() => {
					showConfirmLeaveSpaceDialog = false;
				}}
			>
				Cancel
			</Button>
			<Button
				disabled={inputValue !== activeSpace.doc?.name}
				on:click={leaveActiveSpace}
				variant="destructive"
			>
				Leave {activeSpace.doc?.name}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
