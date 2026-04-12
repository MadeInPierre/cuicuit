<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/features/auth/actions/sign-out';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/shared/components/ui/sidebar/index.js';
	import { Settings } from 'lucide-svelte';
	import BadgeCheck from 'lucide-svelte/icons/badge-check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Sparkles from 'lucide-svelte/icons/sparkles';

	let { user }: { user: { name: string; email: string; avatar: string } } = $props();

	const sidebar = useSidebar();
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
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
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
				<!-- <DropdownMenu.Separator /> -->
				<!-- <DropdownMenu.Group>
					<DropdownMenu.Item>
						<Sparkles />
						Upgrade to Pro
					</DropdownMenu.Item>
				</DropdownMenu.Group> -->
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
