<script lang="ts">
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import ThemeButton from './ThemeButton.svelte';
	import { useSidebar } from '$lib/shared/components/ui/sidebar/index.js';

	let {
		ref = $bindable(null),
		items,
		...restProps
	}: ComponentProps<
		typeof Sidebar.Group
		// The `any` should be `Component` after lucide-svelte updates types
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	> & { items: { title: string; url: string; icon: any; badge?: string }[] } = $props();

	const sidebar = useSidebar();
</script>

<Sidebar.Group bind:ref {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					<ThemeButton />

					{#snippet tooltipContent()}
						<span>Toggle theme</span>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								<item.icon />
								<span>{item.title}</span>

								{#if item.badge && !sidebar.open}
									<span class="absolute top-0.5 right-0 h-2 w-2 rounded-full bg-red-500"></span>
								{/if}
							</a>
						{/snippet}

						{#snippet tooltipContent()}
							<span>{item.title}</span>
						{/snippet}
					</Sidebar.MenuButton>

					{#if item.badge}
						<Sidebar.MenuBadge class="bg-red-500 rounded-full text-white text-xs">
							{item.badge}
						</Sidebar.MenuBadge>
					{/if}
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
