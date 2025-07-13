<script lang="ts">
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import ShareSpaceForm from '$lib/features/spaces/components/ShareSpaceForm.svelte';
	import { LogOut } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const spaceState = getActiveSpaceState();

	async function removeMember(uid: string) {
		toast.error('Not implemented');
		throw new Error('Not implemented');
	}

	const activeSpaceMembers = $derived(spaceState.activeSpace?.members);
	const activeSpaceMembersProfiles = $derived(
		activeSpaceMembers?.map((member) => {
			return spaceState.friendProfiles?.find((p) => p.user_id === member.user_id)!;
		}) || []
	);
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">{spaceState.activeSpace?.name || 'Space'} members</h3>
		<p class="text-sm text-muted-foreground">Manage the members of the currently active space.</p>
	</div>
	<Separator />

	<ShareSpaceForm />

	<legend class="text-lg font-medium">Members</legend>

	<div class="grid gap-4 grid-cols-2">
		{#each activeSpaceMembersProfiles as profile (profile.user_id)}
			<div class="border rounded-lg p-3 flex items-center gap-4 shadow-sm">
				<UserAvatar {profile} class="size-12" />
				<div class="grid">
					<div class="flex items-center text-sm font-medium">
						@{profile.user_name}

						<!-- <div
							class="ml-2 flex items-center text-yellow-500 text-xs gap-1 rounded-full border-yellow-500 border-2 px-2 py-0.5"
						>
							<Star class="size-3.5" fill="#eab308" />
							Admin
						</div> -->
					</div>
					<p class="text-sm text-muted-foreground">
						{spaceState.activeSpace?.author_id === profile.user_id ? 'Creator' : 'Member'}
					</p>
				</div>
				<div class="ml-auto mr-2">
					<Button
						size="icon"
						variant="ghost"
						class="size-8 hover:bg-red-50 dark:hover:bg-red-950"
						onclick={() => removeMember(profile.user_id)}
					>
						<LogOut class="size-4 text-red-600" />
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>
