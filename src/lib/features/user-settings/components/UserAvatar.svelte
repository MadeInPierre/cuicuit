<script lang="ts">
	import * as Avatar from '$lib/shared/components/ui/avatar';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { nature_icons } from '$lib/shared/icons/nature-icons';
	import type { UserProfile } from '$lib/features/auth/db/user-doc';

	interface Props {
		class?: string;
		profile?: UserProfile;
	}

	// Take any user profile as input or use the current user's profile by default
	let { class: className, profile = undefined }: Props = $props();

	const userDocState = getUserDocState();
	const displayProfile = $derived(profile ? profile : userDocState.doc);
	const UserIcon = $derived(nature_icons[displayProfile?.avatar.icon || 'bird']);
</script>

{#if displayProfile}
	<Avatar.Root class={className}>
		{#if displayProfile.avatar.type == 'image'}
			<Avatar.Image
				src={displayProfile.avatar.url}
				alt={displayProfile.userName || displayProfile.firstName}
				class="object-cover"
			/>
		{/if}

		{#if displayProfile.avatar.type == 'icon' && Object.keys(nature_icons).includes(displayProfile.avatar.icon)}
			<Avatar.Fallback>
				<UserIcon class="h-1/2 w-1/2"></UserIcon>
			</Avatar.Fallback>
		{:else}
			<Avatar.Fallback>
				{displayProfile.firstName?.charAt(0) || ''}
			</Avatar.Fallback>
		{/if}
	</Avatar.Root>
{:else}
	<Avatar.Root class={className}>
		<Avatar.Fallback>
			<UserIcon class="h-1/2 w-1/2"></UserIcon>
		</Avatar.Fallback>
	</Avatar.Root>
{/if}
