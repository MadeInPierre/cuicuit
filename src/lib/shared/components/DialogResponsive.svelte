<script lang="ts">
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import { Download } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { useMedia } from '../hooks/use-media.svelte';
	import { Button } from './ui/button';

	type Props = {
		title?: string;
		description?: string;
		open?: boolean;
		trigger?: any;
		content?: Snippet;
	};

	let {
		title = '',
		description = '',
		open = $bindable(false),
		trigger = undefined,
		content = undefined
	}: Props = $props();

	const media = useMedia();
</script>

<Drawer.Root bind:open shouldScaleBackground={false}>
	<Dialog.Root bind:open>
		<Dialog.Trigger>
			{#snippet child({ props })}
				{#if trigger}
					{@render trigger({ props })}
				{:else}
					<Button {...props} class="ml-auto" size="sm">
						<Download class="mx-2 h-4 w-4" />
						<span>Import</span>
					</Button>
				{/if}
			{/snippet}
		</Dialog.Trigger>

		{#if media.md}
			<Dialog.Content class="max-w-120">
				{@render content?.()}
			</Dialog.Content>
		{:else}
			<Drawer.Content class="max-h-[70dvh]">
				{#if title || description}
					<Drawer.Header class="text-start relative">
						{#if title}
							<Drawer.Title>{title}</Drawer.Title>
						{/if}
						{#if description}
							<Drawer.Description>{description}</Drawer.Description>
						{/if}
					</Drawer.Header>
				{/if}

				<div class="grid gap-3 px-6 mb-6 overflow-x-hidden overflow-y-auto min-w-0">
					{@render content?.()}
				</div>

				<!-- <Drawer.Footer class="pt-2">
					<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Drawer.Close>
				</Drawer.Footer> -->
			</Drawer.Content>
		{/if}
	</Dialog.Root>
</Drawer.Root>
