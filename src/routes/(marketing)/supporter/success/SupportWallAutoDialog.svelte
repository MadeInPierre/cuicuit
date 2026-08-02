<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { hideBannerUntil } from '$lib/shared/components/support/hide-banner.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { toast } from 'svelte-sonner';
	import SupportWall from '../SupportWall.svelte';

	type Props = {
		email: string | null;
		open?: boolean;
		suggestHide?: boolean;
	};
	let { email = null, open = $bindable(false), suggestHide = false }: Props = $props();

	let media = useMedia();
	const userState = getUserState();

	function openSupportWall() {
		if (media.md) open = true;
		else goto('/supporter');
	}

	$effect(() => {
		if (open) openSupportWall();
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="lg:min-w-250 overflow-hidden bg-background">
		{#if suggestHide}
			<Button
				disabled={userState.creditBalance?.communityHealth === 'Empty'}
				variant="link"
				class="absolute top-2 right-12 h-8 z-40"
				onclick={() => {
					hideBannerUntil.set(
						new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0]
					);

					toast.success('Banner hidden for 2 months', {
						description: 'Please support to hide forever',
						duration: 8000,
						action: {
							label: 'Support',
							onClick: () => {
								openSupportWall();
							}
						}
					});

					open = false;
				}}
			>
				Hide for 2 months
			</Button>
		{/if}

		<SupportWall {email} />
	</Dialog.Content>
</Dialog.Root>
