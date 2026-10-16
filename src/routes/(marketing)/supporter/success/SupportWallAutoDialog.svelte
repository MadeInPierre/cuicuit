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
			? 'min-w-xl lg:min-w-250 max-h-[90vh] overflow-y-auto bg-background p-0'
			: 'h-dvh w-screen max-w-none sm:max-w-none md:max-w-none lg:max-w-none rounded-none border-0 bg-background p-0 overflow-y-auto'}
	>
		<Dialog.Title class="sr-only">Support Cuicuit</Dialog.Title>
		<Dialog.Description class="sr-only">
			Choose a contribution for recipe imports and the shared seed garden.
		</Dialog.Description>
		<SupportWall {email} />
		{#if suggestHide}
			<Button
				disabled={userState.creditBalance?.communityHealth === 'Empty'}
				variant="link"
				class="mx-auto mb-5 min-h-11"
				onclick={() => {
					hideBannerUntil.set(
						new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
					);

					toast.success('Banner hidden for 3 months', {
						description: 'You can still support Cuicuit from your account menu.',
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
				Hide for 3 months
			</Button>
		{/if}
	</Dialog.Content>
</Dialog.Root>
