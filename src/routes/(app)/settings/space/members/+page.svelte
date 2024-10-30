<script lang="ts">
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import ShareSpaceForm from '$lib/features/spaces/components/ShareSpaceForm.svelte';
	import { Star, LogOut } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const activeSpace = getActiveSpaceState();

	async function removeMember(uid: string) {
		toast.error('Not implemented');
		throw new Error('Not implemented');
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">{activeSpace.doc?.name} members</h3>
		<p class="text-sm text-muted-foreground">Manage the members of the currently active space.</p>
	</div>
	<Separator />

	<ShareSpaceForm />

	<legend class="text-lg font-medium">Members</legend>

	<div class="grid gap-4 grid-cols-2">
		<div class="border rounded-lg p-3 flex items-center gap-4 shadow-sm">
			{#each Object.entries(activeSpace.doc?.memberProfiles || {}) as [memderUid, profile] (memderUid)}
				<UserAvatar {profile} class="size-12" />
				<div class="grid">
					<div class="flex items-center text-sm font-medium">
						{profile.firstName}
						{profile.lastName}

						<div
							class="ml-2 flex items-center text-yellow-500 text-xs gap-1 rounded-full border-yellow-500 border-2 px-2 py-0.5"
						>
							<Star class="size-3.5" fill="#eab308" />
							Admin
						</div>
					</div>
					<p class="text-sm text-muted-foreground">@{profile.userName}</p>
				</div>
				<div class="ml-auto mr-2">
					<Button
						size="icon"
						variant="ghost"
						class="size-8 hover:bg-red-50 dark:hover:bg-red-950"
						onclick={() => removeMember(memderUid)}
					>
						<LogOut class="size-4 text-red-600" />
					</Button>
				</div>
			{/each}
		</div>
	</div>
</div>
