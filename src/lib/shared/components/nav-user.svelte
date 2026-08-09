<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/features/auth/actions/sign-out';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight } from '@lucide/svelte';
	import { Settings } from 'lucide-svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LogOut from 'lucide-svelte/icons/log-out';
	import SupportWallAutoDialog from '../../../routes/(marketing)/supporter/success/SupportWallAutoDialog.svelte';
	import { useMedia } from '../hooks/use-media.svelte';

	const userState = getUserState();

	let { user }: { user: { name: string; email: string; avatar: string } } = $props();

	const sidebar = useSidebar();

	let openSupportDialog = $state(false);
	let media = useMedia();
	function openSupportWall() {
		if (media.md) openSupportDialog = true;
		else goto('/supporter');
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-full"
					>
						<UserAvatar profile={userState.profile} class="size-8" />
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDown class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg bg-popover -translate-y-2"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="start"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<UserAvatar profile={userState.profile} class="mx-1 mb-1 mt-0" />

						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>

				{#if userState.creditBalance?.balance}
					<DropdownMenu.Item
						onclick={() => goto('/settings/seeds')}
						class="bg-lime-50 hover:bg-lime-50 data-[highlighted]:bg-lime-100 data-[highlighted]:text-lime-600 text-lime-600 dark:bg-lime-900 dark:hover:bg-lime-800 dark:data-[highlighted]:bg-lime-800 dark:data-[highlighted]:text-lime-400"
					>
						<span class="">🌱</span>

						You have {userState.creditBalance?.balance} seed{userState.creditBalance?.balance > 1
							? 's'
							: ''}

						<ArrowRight class="ml-auto mr-2 text-lime-600" />
					</DropdownMenu.Item>
				{:else}
					<DropdownMenu.Item
						onclick={openSupportWall}
						class="bg-lime-100 hover:bg-lime-50 data-[highlighted]:bg-lime-50 data-[highlighted]:text-lime-600 dark:bg-lime-900 dark:hover:bg-lime-800 dark:data-[highlighted]:bg-lime-800 dark:data-[highlighted]:text-lime-400"
					>
						<span class="ml-1">🌱</span>

						<div class="grid">
							<span class="text-lime-600 font-medium">Get your own seeds</span>
							<span class="text-xs text-lime-600">and support Cuicuit!</span>
						</div>

						<ArrowRight class="ml-auto mr-2 text-lime-600" />
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Separator />

				<DropdownMenu.Group>
					<DropdownMenu.Item onclick={() => goto('/settings')}>
						<Settings />
						Settings
					</DropdownMenu.Item>
					<!-- <DropdownMenu.Item>
						<CreditCard />
						Billing
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<Bell />
						Notifications
					</DropdownMenu.Item> -->
				</DropdownMenu.Group>
				<!-- <DropdownMenu.Separator /> -->
				<DropdownMenu.Item onclick={signOut}>
					<LogOut />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<SupportWallAutoDialog email={userState.user?.email || null} bind:open={openSupportDialog} />
