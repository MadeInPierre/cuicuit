<script lang="ts">
	import { Input, type FormInputEvent } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { Button } from '$lib/shared/components/ui/button';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Trash2 } from 'lucide-svelte';
	import IconPicker from './IconPicker.svelte';
	import { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import { updateUserDocAvatar } from '$lib/features/user-settings/actions/update-user-doc-avatar';
	import { deleteUserPicture } from '$lib/features/user-settings/actions/delete-user-picture';
	import { uploadProfilePicture } from '$lib/features/user-settings/actions/upload-profile-picture';

	const userDocState = new UserDocState();

	/**
	 * Upload the file to the storage and update the userDoc avatar
	 */
	let file: any = $state(undefined);
	$effect(() => {
		if (!file) return;
		uploadProfilePicture(userDocState, file);
	});
</script>

{#if userDocState.user && userDocState.doc}
	<div class="flex w-full flex-col gap-2">
		<Label for="picture">Picture or icon</Label>

		<div class="flex items-center gap-2">
			<Input
				id="picture"
				type="file"
				class="w-full"
				onchange={(e: FormInputEvent) => {
					file = (e.target as HTMLInputElement)?.files?.[0];
				}}
			/>

			{#key userDocState.doc.avatar.last_change_t}
				{#if userDocState.doc.avatar.type == 'image' && userDocState.doc.avatar.url}
					<AlertDialog.Root>
						<AlertDialog.Trigger>
							<Button variant="outline" class="px-3">
								<Trash2 class="h-[1.2rem] w-[1.2rem]" />
								<span class="sr-only">Remove picture</span>
							</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>Delete your profile picture?</AlertDialog.Title>
								<AlertDialog.Description>
									This action cannot be undone. This will permanently delete your photo from our
									servers.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
								<AlertDialog.Action
									on:click={() =>
										deleteUserPicture(userDocState, `users/${userDocState.user?.uid}/profile.png`)}
								>
									Delete
								</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>

					<a href={userDocState.doc.avatar.url} target="_blank" rel="noopener noreferrer">
						<UserAvatar />
					</a>
				{:else}
					<UserAvatar />
				{/if}
			{/key}
		</div>

		<p class="text-sm text-muted-foreground">Upload a photo or pick your favorite icon below:</p>

		<div class="mt-4">
			<IconPicker
				selectedIcon={userDocState.doc.avatar.icon}
				showSelected={userDocState.doc.avatar.type == 'icon'}
				onChange={(name) => updateUserDocAvatar(userDocState, 'icon', name)}
				showWarning={userDocState.doc.avatar.type == 'image'}
			/>

			<p class="mt-2 text-sm text-muted-foreground">
				Pick your favorite icon or upload a photo. It will be visible publicly.
			</p>
		</div>
	</div>
{/if}
