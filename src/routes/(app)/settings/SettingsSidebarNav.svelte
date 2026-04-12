<script lang="ts">
	import { page } from '$app/state';
	import type { NavLink } from '$lib/features/marketing/consts/nav-links';
	import { Button } from '$lib/shared/components/ui/button';
	import { IsMobile } from '$lib/shared/hooks/is-mobile.svelte';
	import { cn } from '$lib/utils';
	import { Circle } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	interface Props {
		class?: string | undefined | null;
		groups: { name: string; links: NavLink[] }[];
	}

	let { class: className = undefined, groups }: Props = $props();

	const isMobile = new IsMobile();

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<nav class={cn('flex flex-col space-x-2 lg:space-x-0 lg:space-y-1', className)}>
	{#each groups as group}
		<p class="text-muted-foreground text-sm font-medium">{group.name}</p>

		<div class="grid w-full grid-cols-3 gap-1 lg:grid-cols-1 max-w-lg">
			{#each group.links.filter((link) => !link.display || link.display === (isMobile.current ? 'mobile' : 'desktop') || link.display === 'both') as link}
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
		</div>

		<div class="h-4"></div>
	{/each}
</nav>
