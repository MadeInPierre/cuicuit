<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';

	// The `any` should be `Component` after lucide-svelte updates types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { items }: { items: { title: string; url: string; icon: any; isActive?: boolean }[] } =
		$props();
</script>

<Sidebar.Menu>
	{#each items as item (item.title)}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton isActive={item.isActive}>
				{#snippet child({ props })}
					<a
						href={item.url}
						{...props}
						onclick={(e) => {
							// Don't navigate if the link is already active, this prevents
							// losing currently active searchParams
							e.preventDefault();
							if (window.location.pathname !== item.url) {
								goto(item.url);
							}
						}}
					>
						<item.icon />
						<span>{item.title}</span>
					</a>
				{/snippet}

				{#snippet tooltipContent()}
					<span>{item.title}</span>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/each}
</Sidebar.Menu>
