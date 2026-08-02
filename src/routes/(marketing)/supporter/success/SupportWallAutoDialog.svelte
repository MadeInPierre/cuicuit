<script lang="ts">
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
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class={media.md
			? 'min-w-xl sm:min-x-xl lg:min-w-250 overflow-hidden bg-background'
			: 'h-screen w-screen max-w-none sm:max-w-none md:max-w-none lg:max-w-none rounded-none border-0 bg-background p-0'}
	>
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
								open = true;
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
