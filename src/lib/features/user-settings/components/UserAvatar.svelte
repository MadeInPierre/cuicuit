<script lang="ts">
	import * as Avatar from '$lib/shared/components/ui/avatar';
	import { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { nature_icons } from '$lib/shared/icons/nature-icons';

	let className: string | undefined | null = undefined;
	export { className as class };

	const userDocState = new UserDocState();
</script>

{#if userDocState.user && userDocState.doc}
	{#key userDocState.doc.avatar.last_change_t}
		<Avatar.Root class={className}>
			{#if userDocState.doc.avatar.type == 'image'}
				<Avatar.Image
					src={userDocState.doc.avatar.url}
					alt={userDocState.doc.userName || userDocState.doc.firstName}
					class="object-cover"
				/>
			{/if}

			{#if userDocState.doc.avatar.type == 'icon' && Object.keys(nature_icons).includes(userDocState.doc.avatar.icon)}
				<Avatar.Fallback>
					<svelte:component this={nature_icons[userDocState.doc.avatar.icon]} class="h-1/2 w-1/2" />
				</Avatar.Fallback>
			{:else}
				<Avatar.Fallback>
					{userDocState.doc.firstName?.charAt(0) || ''}
				</Avatar.Fallback>
			{/if}
		</Avatar.Root>
	{/key}
{/if}
