<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { cn } from '$lib/utils';
	import { Heart, HeartCrack } from '@lucide/svelte';
	import SupportWallAutoDialog from '../../../routes/(marketing)/supporter/success/SupportWallAutoDialog.svelte';
	import { useMedia } from '../hooks/use-media.svelte';
	import { hideBannerUntil } from './support/hide-banner.svelte';
	import { Button } from './ui/button';

	const userState = getUserState();
	const media = useMedia();

	let openSupportDialog = $state(false);
	function openSupportWall() {
		if (media.md) openSupportDialog = true;
		else goto('/supporter');
	}

	const hideBanner = $derived(
		hideBannerUntil.value &&
			new Date(hideBannerUntil.value) > new Date() &&
			userState.creditBalance?.communityHealth !== 'Empty'
	);
</script>

{#if !hideBanner && userState.creditBalance && !userState.creditBalance.balance}
	<Button
		onclick={openSupportWall}
		variant="secondary"
		class={cn(
			'flex h-8 text-md px-2 font-normal text-pink-400 items-center gap-1 bg-transparent hover:bg-pink-100 shadow-none font-hand',
			userState.creditBalance.communityHealth === 'Low' && 'bg-pink-100',
			userState.creditBalance.communityHealth === 'Critical' && 'bg-pink-100 font-semibold',
			userState.creditBalance.communityHealth === 'Empty' &&
				'bg-red-100 text-red-600 hover:bg-red-200 text-sm font-sans tracking-tight'
		)}
	>
		{#if userState.creditBalance.communityHealth === 'Healthy'}
			<Heart />
			<span>Support</span>
		{:else if userState.creditBalance.communityHealth === 'Empty'}
			<HeartCrack />
			<span>No more community seeds, please contribute!</span>
		{:else}
			<HeartCrack />
			<span>{userState.creditBalance.communityHealth} community health - Support us!</span>
		{/if}
	</Button>
{/if}

<SupportWallAutoDialog
	email={userState.user?.email || null}
	bind:open={openSupportDialog}
	suggestHide
/>
