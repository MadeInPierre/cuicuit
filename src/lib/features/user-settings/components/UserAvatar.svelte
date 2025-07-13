<script lang="ts">
	import type { UserPublicProfile } from '$lib/features/auth/queries/get-user-public-profile';
	import * as Avatar from '$lib/shared/components/ui/avatar';
	import { nature_icons } from '$lib/shared/icons/nature-icons';

	interface Props {
		class?: string;
		profile?: UserPublicProfile;
	}

	// Take any user profile as input or use the current user's profile by default
	let { class: className, profile = undefined }: Props = $props();

	const UserIcon = $derived(nature_icons[profile?.icon || 'bird']);
</script>

{#if profile}
	<Avatar.Root class={className}>
		{#if profile.image_url}
			<Avatar.Image src={profile.image_url} alt={profile.user_name} class="object-cover" />
		{/if}

		{#if !profile.image_url && Object.keys(nature_icons).includes(profile.icon)}
			<Avatar.Fallback>
				<UserIcon class="h-1/2 w-1/2"></UserIcon>
			</Avatar.Fallback>
		{:else}
			<Avatar.Fallback>
				{profile.user_name?.charAt(0) || ''}
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
