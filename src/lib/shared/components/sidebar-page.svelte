<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { cn } from '$lib/utils';
	import { Heart, HeartCrack } from '@lucide/svelte';
	import { useMedia } from '../hooks/use-media.svelte';
	import HelloDialog from './HelloDialog.svelte';
	import ThemeButton from './ThemeButton.svelte';
	import { Button } from './ui/button';

	const userState = getUserState();

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const media = useMedia();
	let openAlphaDialog = $state(false);
</script>

<svelte:window
	on:scroll={() => {
		const header = document.querySelector<HTMLElement>('[data-scroll-header]');
		if (!header) return;

		if (window.matchMedia('(min-width: 768px)').matches) {
			header.style.transform = 'translateY(0)';
			header.style.opacity = '1';
			return;
		}

		const y = window.scrollY || 0;
		const last = Number(header.getAttribute('data-last-y') || '0');
		const shouldShow = y < 120 || y < last;

		header.setAttribute('data-last-y', String(y));
		header.style.transform = shouldShow ? 'translateY(0)' : 'translateY(-100%)';
		header.style.opacity = shouldShow ? '1' : '0';
	}}
/>

<Sidebar.Provider open={false}>
	<SidebarLeft collapsible="icon" />

	{#if media.md}
		<SidebarRight />
	{/if}

	<Sidebar.Inset>
		<header
			data-scroll-header
			data-last-y="0"
			class="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-background/60 backdrop-blur-md transition-all duration-200 ease-out"
		>
			<div class="flex flex-1 items-center gap-2 px-3 mx-2 md:mx-6">
				<!-- <Sidebar.Trigger /> -->
				<!-- <Separator orientation="vertical" class="mr-2 h-4" /> -->

				<a href="/recipes" class="flex gap-2 items-center">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="size-8" />
					<h1 class="text-lg font-semibold">Cuicuit</h1>
				</a>

				<HelloDialog>
					<Button variant="link" class="px-2 text-xl text-[#fab030] font-hand cursor-help">
						alpha
					</Button>
				</HelloDialog>

				<!-- <Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="line-clamp-1">Recipes</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root> -->

				<!-- {#if hasCheckedItems && page.url.pathname === '/shopping-list'}
					<DoneShoppingButton />
				{/if} -->

				<!-- <CommandMenu /> -->

				{#if userState.creditBalance && !userState.creditBalance.balance}
					<Button
						href="/supporter"
						variant="secondary"
						class={cn(
							'hidden md:flex mr-8 h-8 text-md px-2 font-normal text-pink-400 items-center gap-1 bg-transparent hover:bg-pink-100 shadow-none font-hand',
							userState.creditBalance.communityHealth === 'Low' && 'bg-pink-100',
							userState.creditBalance.communityHealth === 'Critical' &&
								'bg-pink-400 text-white hover:bg-pink-500 font-bold text-lg',
								userState.creditBalance.communityHealth === 'Empty' &&
								'bg-red-500 text-white hover:bg-red-600 font-bold text-sm font-sans'
						)}
					>
						{#if userState.creditBalance.communityHealth === 'Healthy'}
							<Heart />
							<span>Support</span>
						{:else}
							<HeartCrack />
							<span>Community health: {userState.creditBalance.communityHealth}</span>
						{/if}
					</Button>
				{/if}

				<ThemeButton class="md:hidden" />

				<a href="/settings" class="md:hidden">
					<UserAvatar profile={userState.profile} class="size-10" />
				</a>
			</div>
		</header>

		<div class="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-10">
			{@render children?.()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
