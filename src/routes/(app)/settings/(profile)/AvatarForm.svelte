<script lang="ts">
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { deleteUserPicture } from '$lib/features/user-settings/actions/delete-user-picture';
	import { updateUserAvatar } from '$lib/features/user-settings/actions/update-user-avatar';
	import { uploadProfilePicture } from '$lib/features/user-settings/actions/upload-profile-picture';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { ImageUp, LoaderCircle, Trash2 } from 'lucide-svelte';
	import IconPicker from './IconPicker.svelte';

	let file: any = $state(undefined);
	let loadingUpload = $state(false);
	let openDeleteDialog = $state(false);

	/** Option 1: Upload the file immediately after it's selected */
	// $effect(() => {
	// 	if (!file) return;
	// 	uploadProfilePicture(userDocState, file);
	// });

	/**
	 * Option 2: Upload the file to the storage and update the userDoc avatar
	 */
	async function upload() {
		if (!file || !userState.user?.id) return;

		loadingUpload = true;

		await uploadProfilePicture(userState.user.id, file);

		// wait 1sec to show the loading spinner for better UX
		await new Promise((resolve) =>
			setTimeout(() => {
				loadingUpload = false;
				file = undefined;
				resolve(null);
			}, 1000)
		);
	}
</script>

{#if userState.user && userState.profile}
	<div class="flex w-full flex-col gap-2">
		<Label>Picture or icon</Label>

		<div class="flex items-center gap-2">
			<Input
				type="file"
				class="w-full"
				onchange={(e) => {
					file = (e.target as HTMLInputElement)?.files?.[0];
				}}
			/>

			{#if file}
				<Button variant="default" class="px-3 flex gap-2" onclick={upload} disabled={loadingUpload}>
					{#if loadingUpload}
						<LoaderCircle class="h-[1.2rem] w-[1.2rem] animate-spin" />
						<span>Uploading...</span>
					{:else}
						<ImageUp class="h-[1.2rem] w-[1.2rem]" />
						Upload
					{/if}
				</Button>
			{/if}

			{#if userState.profile.image_url && !file}
				<AlertDialog.Root bind:open={openDeleteDialog}>
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
								onclick={() => {
									if (!userState.user?.id) return;
									deleteUserPicture(userState.user.id);
									openDeleteDialog = false;
								}}
							>
								Delete
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>

				<a href={userState.profile.image_url} target="_blank" rel="noopener noreferrer">
					<UserAvatar profile={userState.profile} />
				</a>
			{:else}
				<UserAvatar profile={userState.profile} />
			{/if}
		</div>

		<p class="text-sm text-muted-foreground">Upload a photo or pick your favorite icon below:</p>

		<div class="mt-4">
			<IconPicker
				selectedIcon={userState.profile.icon}
				showSelected={!userState.profile.image_url}
				onChange={async (name) => {
					if (!userState.user?.id) return;
					await updateUserAvatar(userState.user.id, name, null);
					userState.refresh();
				}}
				showWarning={!!userState.profile.image_url}
			/>

			<p class="mt-2 text-sm text-muted-foreground">
				Pick your favorite icon or upload a photo. It will be visible publicly.
			</p>
		</div>
	</div>
{/if}
