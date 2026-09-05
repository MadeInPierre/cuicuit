<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import type { NavLink } from '$lib/features/marketing/consts/nav-links';
	import { Button } from '$lib/shared/components/ui/button';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import { ArrowRight, Circle } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import SettingsMobileSpaceSwitcher from './SettingsMobileSpaceSwitcher.svelte';

	interface Props {
		class?: string | undefined | null;
		groups: { name: string; links: NavLink[] }[];
		onSelect?: (link: NavLink) => void;
	}

	let { class: className = undefined, groups, onSelect }: Props = $props();

	const media = useMedia();
	const userState = getUserState();

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<nav class={cn('flex flex-col space-x-2 space-y-3 lg:space-x-0 lg:space-y-1', className)}>
	{#if !userState.creditBalance?.balance}
		<Button
			href="/supporter"
			class="md:hidden max-w-lg mb-8 bg-lime-100 hover:bg-lime-200 border border-lime-400 text-lime-600 p-8 rounded-xl flex items-center gap-4 mx-0"
		>
			<span class="text-lg">🌱</span>
			<div class="grid">
				<span class="text-lg font-medium leading-tight">Get your own seeds</span>
				<span class="text-sm font-normal">and support Cuicuit!</span>
			</div>
			<ArrowRight class="size-5 ml-auto mr-2" />
		</Button>
	{/if}

	{#each groups as group}
		<p class="md:text-muted-foreground md:text-sm font-medium">{group.name}</p>

		{#if group.name == 'Active space' && !media.md}
			<SettingsMobileSpaceSwitcher />
		{/if}

		<div class="grid w-full gap-1 grid-cols-1 max-w-lg space-y-3 md:space-y-0">
			{#each group.links.filter((link) => !link.display || link.display === (media.md ? 'desktop' : 'mobile') || link.display === 'both') as link}
				{@const isActive = page.url.pathname === link.href}

				<Button
					variant="ghost"
					class={cn(
						!isActive && 'hover:underline',
						'relative justify-start hover:bg-transparent py-6 md:py-0',
						!media.md && 'p-8 rounded-xl bg-white shadow-xs border border-border/60 text-md'
					)}
					data-sveltekit-noscroll
					onclick={async () => {
						if (link.href) await goto(link.href);
						onSelect?.(link);
					}}
				>
					{#if isActive && media.md}
						<div
							class="absolute inset-0 rounded-md bg-muted"
							in:send={{ key: 'active-sidebar-tab' }}
							out:receive={{ key: 'active-sidebar-tab' }}
						></div>
					{/if}

					<div class="relative flex items-center gap-4 md:gap-2">
						{#if link.icon}
							<link.icon class="size-5 md:size-4" />
						{:else}
							<Circle class="size-5 md:size-4" />
						{/if}

						{link.title}
					</div>
				</Button>
			{/each}
		</div>

		<div class="h-4"></div>
	{/each}
</nav>
