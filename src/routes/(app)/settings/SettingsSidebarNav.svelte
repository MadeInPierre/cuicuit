<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/shared/components/ui/button';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { Circle } from 'lucide-svelte';
	import type { NavLink } from '$lib/features/marketing/consts/nav-links';
	import { page } from '$app/state';

	interface Props {
		class?: string | undefined | null;
		groups: { name: string; links: NavLink[] }[];
	}

	let { class: className = undefined, groups }: Props = $props();

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<nav class={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}>
	{#each groups as group}
		<p class="text-muted-foreground text-sm font-medium">{group.name}</p>

		{#each group.links as link}
			{@const isActive = page.url.pathname === link.href}

			<Button
				href={link.href}
				variant="ghost"
				class={cn(!isActive && 'hover:underline', 'relative justify-start hover:bg-transparent')}
				data-sveltekit-noscroll
			>
				{#if isActive}
					<div
						class="absolute inset-0 rounded-md bg-muted"
						in:send={{ key: 'active-sidebar-tab' }}
						out:receive={{ key: 'active-sidebar-tab' }}
					></div>
				{/if}
				<div class="relative flex items-center gap-2">
					{#if link.icon}
						<link.icon class="h-4 w-4" />
					{:else}
						<Circle class="h-4 w-4" />
					{/if}

					{link.title}
				</div>
			</Button>
		{/each}

		<div class="h-4"></div>
	{/each}
</nav>
