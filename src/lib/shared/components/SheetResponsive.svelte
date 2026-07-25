<script lang="ts">
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import * as Sheet from '$lib/shared/components/ui/sheet/index.js';
	import { useMedia } from '../hooks/use-media.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
		trigger?: Snippet<[{ props: any }]>;
		side?: 'top' | 'right' | 'bottom' | 'left';
	};

	let {
		open = $bindable(false),
		title,
		description,
		children,
		trigger,
		side = 'right'
	}: Props = $props();

	const media = useMedia();
</script>

{#if media.md}
	<Sheet.Root bind:open>
		{#if trigger}
			<Sheet.Trigger>
				{#snippet child({ props })}
					{@render trigger({ props })}
				{/snippet}
			</Sheet.Trigger>
		{/if}

		<Sheet.Content {side}>
			<Sheet.Header>
				<Sheet.Title>{title}</Sheet.Title>
				{#if description}
					<Sheet.Description>{description}</Sheet.Description>
				{/if}
			</Sheet.Header>

			{@render children()}
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Drawer.Root bind:open shouldScaleBackground={false}>
		{#if trigger}
			<Drawer.Trigger>
				{#snippet child()}
					{@render trigger({ props: {} })}
				{/snippet}
			</Drawer.Trigger>
		{/if}

		<Drawer.Content class="max-h-[85%] flex flex-col">
			<Drawer.Header class="text-start flex-shrink-0">
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>{description}</Drawer.Description>
				{/if}
			</Drawer.Header>

			{@render children()}
		</Drawer.Content>
	</Drawer.Root>
{/if}
