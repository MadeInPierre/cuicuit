<script lang="ts">
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { getChangelogPosts, getUnseenPosts } from '$lib/features/changelog/changelog';
	import ActiveSpaceIcon from '$lib/features/spaces/components/ActiveSpaceIcon.svelte';
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { Lightbulb } from '@lucide/svelte';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import { useMedia } from '../hooks/use-media.svelte';
	import HelloDialog from './HelloDialog.svelte';
	import SupportBanner from './SupportBanner.svelte';
	import { Button } from './ui/button';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const media = useMedia();
	const userState = getUserState();

	// Same unread logic as the desktop sidebar badge. Hidden until preferences
	// load (avoids a flash for users with nothing new) and on /whats-new itself.
	const unseenChangelogCount = $derived.by(() => {
		if (page.url.pathname.startsWith('/whats-new')) return 0;
		if (!userState.preferences) return 0;
		return getUnseenPosts(getChangelogPosts(), userState.preferences.last_seen_changelog_tag)
			.length;
	});
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

	<Sidebar.Inset class="min-w-0">
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

				<div class="flex items-center gap-2">
					<HelloDialog>
						<Button variant="link" class="text-muted-foreground hidden sm:flex">
							<Lightbulb />
							Feedback
						</Button>
					</HelloDialog>

					<SupportBanner />
				</div>

				<div class="ml-auto flex items-center gap-2 md:hidden">
					{#if unseenChangelogCount > 0}
						<a
							href="/whats-new"
							aria-label="See what's new"
							class="relative flex h-7 items-center justify-center gap-1 text-xs text-lime-500 bg-lime-500/10 rounded-md px-2"
						>
							<Megaphone class="size-3.5" />
							New

							<span
								class="absolute -top-0.5 -right-0.5 z-40 flex w-2 max-w-2 h-2 rounded-full bg-lime-500 px-1"
							>
							</span>
						</a>
					{/if}

					<a href="/settings">
						<ActiveSpaceIcon variant="muted" class="size-10 rounded-full" iconClass="size-5" />
					</a>
				</div>
			</div>
		</header>

		<div class="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-10">
			{@render children?.()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
