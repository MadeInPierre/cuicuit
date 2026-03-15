<script lang="ts">
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import CommandMenu from '$lib/features/command/CommandMenu.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { Check } from 'lucide-svelte';
	import { IsMobile } from '../hooks/is-mobile.svelte';
	import ThemeButton from './ThemeButton.svelte';
	import { Button } from './ui/button';
	import { page } from '$app/state';
	import { deletePlanItem } from '$lib/features/plans/actions/update-item';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const isMobile = new IsMobile();

	const activeSpace = getActiveSpaceState();
	const hasCheckedItems = $derived(
		activeSpace.activePlanItems?.some((item) => item.checked_at) || false
	);
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

	{#if !isMobile.current}
		<SidebarRight />
	{/if}

	<Sidebar.Inset>
		<header
			data-scroll-header
			data-last-y="0"
			class="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-background/60 backdrop-blur-md transition-all duration-200 ease-out"
		>
			<div class="flex flex-1 items-center gap-4 px-3 mx-2 md:mx-6">
				<!-- <Sidebar.Trigger /> -->
				<!-- <Separator orientation="vertical" class="mr-2 h-4" /> -->

				<a href="/recipes" class="flex gap-2 items-center mr-auto">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="size-8" />
					<h1 class="text-lg font-semibold">Cuicuit</h1>
				</a>

				<!-- <Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="line-clamp-1">Recipes</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root> -->

				{#if hasCheckedItems && page.url.pathname === '/shopping-list'}
					<Button
						variant="default"
						class="ml-auto"
						onclick={async () => {
							if (!activeSpace.activePlanItems) return;
							
							activeSpace.activePlanItems.forEach((item) => {
								if (item.checked_at) deletePlanItem(activeSpace, item.id);
							});

							await activeSpace.refreshActivePlanItems();
							await activeSpace.refreshActivePlanMeals();
							// await refreshRecommendations();
						}}
					>
						<Check class="size-4 mr-2" />
						Done shopping
					</Button>
				{/if}

				<CommandMenu />
				<ThemeButton class="md:hidden" />

				<UserAvatar profile={userState.profile} class="size-8 md:hidden" />
			</div>
		</header>

		<div class="flex flex-1 flex-col gap-4 p-6 md:p-10">
			{@render children?.()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
