<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import ShareSpaceForm from './ShareSpaceForm.svelte';

	interface Props {
		open?: boolean;
		children?: import('svelte').Snippet;
	}

	let { open = $bindable(false), children }: Props = $props();

	const activeSpace = getActiveSpaceState();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild>
		{@render children?.()}
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Share {activeSpace.userHeader?.name}</Dialog.Title>
			<Dialog.Description>Invite your friends to manage your kitchen together!</Dialog.Description>
		</Dialog.Header>

		<ShareSpaceForm></ShareSpaceForm>

		<!-- <Dialog.Footer>
			<Button variant="outline" on:click={() => (open = false)}>Close</Button>
			<Button on:click={copyLink}>Copy</Button>
		</Dialog.Footer> -->
	</Dialog.Content>
</Dialog.Root>
