<script lang="ts">
	import { page } from '$app/state';
	import { navLinksAppSettingsSidebar } from '$lib/features/marketing/consts/nav-links';
	import SupportBanner from '$lib/shared/components/SupportBanner.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';
	import SettingsSidebarNav from './SettingsSidebarNav.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const media = useMedia();

	// On mobile, overlay the options to let the user select one, then navigate and hide the options. On desktop, always show the options.
	let showOptions = $state(true);
</script>

<div class="space-y-6 pb-16">
	<div class="flex items-center gap-2 h-10">
		{#if !media.md && !showOptions}
			<Button variant="ghost" href="/settings" size="icon-lg" onclick={() => (showOptions = true)}>
				<ChevronLeft class="size-6" />
			</Button>
		{/if}

		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
			<p class="text-muted-foreground hidden md:block">
				Manage your account settings and set e-mail preferences.
			</p>
		</div>

		<div class="sm:hidden ml-auto mr-2">
			<SupportBanner />
		</div>
	</div>

	<SeparatorZigZag class="my-6" />

	{#if media.md}
		<div class="flex flex-col space-y-8 pb-16 md:flex-row md:space-x-12 md:space-y-0">
			<aside class="min-w-40 lg:w-1/6">
				<SettingsSidebarNav groups={navLinksAppSettingsSidebar} />
			</aside>

			<div class="flex-1 lg:max-w-2xl">
				{@render children?.()}
			</div>
		</div>
	{:else if showOptions && page.url.pathname === '/settings'}
		<SettingsSidebarNav
			groups={navLinksAppSettingsSidebar}
			onSelect={async (l) => {
				if (l.title === 'Sign out') {
					console.log('User asked to sign out.');
					await supabase.client?.auth.signOut();
					window.location.href = '/login';
				}

				showOptions = false;
			}}
		/>
	{:else}
		<div class="flex flex-col space-y-8">
			{@render children?.()}
		</div>
	{/if}
</div>
