<script lang="ts">
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import SpaceSwitcher from '$lib/features/spaces/components/SpaceSwitcher.svelte';
	import NavAdmin from '$lib/shared/components/nav-admin.svelte';
	import NavMain from '$lib/shared/components/nav-main.svelte';
	import NavSecondary from '$lib/shared/components/nav-secondary.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ChefHat, Notebook, Refrigerator, ShoppingBasket } from '@lucide/svelte';
	import Calendar from '@lucide/svelte/icons/calendar';
	import type { ComponentProps } from 'svelte';
	import type { TAILWIND_BREAKPOINTS } from '../hooks/use-media.svelte';
	import NavUser from './nav-user.svelte';

	const userState = getUserState();

	// This is sample data.
	const data: {
		navMain: {
			title: string;
			url: string;
			icon: any;
			isActive?: boolean;
			showUpTo?: keyof typeof TAILWIND_BREAKPOINTS;
		}[];
		navSecondary: { title: string; url: string; icon: any }[];
		admin: { name: string; url: string; emoji: string }[];
		workspaces: {
			name: string;
			emoji: string;
			pages: { name: string; url: string; emoji: string }[];
		}[];
	} = $derived({
		navMain: [
			{
				title: 'Recipes',
				url: '/recipes',
				icon: ChefHat,
				isActive: page.url.pathname.startsWith('/recipes')
			},
			{
				title: 'Meal plan',
				url: '/plan',
				icon: Calendar,
				isActive: page.url.pathname.startsWith('/plan'),
				showUpTo: 'lg'
			},
			{
				title: 'Cookbooks',
				url: '/cookbooks',
				icon: Notebook,
				isActive: page.url.pathname.startsWith('/cookbooks')
			},
			{
				title: 'Shopping list',
				url: '/shopping-list',
				icon: ShoppingBasket,
				isActive: page.url.pathname.startsWith('/shopping-list')
			},
			{
				title: 'Pantry',
				url: '/pantry',
				icon: Refrigerator,
				isActive: page.url.pathname.startsWith('/pantry')
			}
			// {
			// 	title: 'Chat',
			// 	url: '/chat',
			// 	icon: BotMessageSquare,
			// 	isActive: page.url.pathname.startsWith('/chat')
			// }
		],
		navSecondary: [
			// {
			// 	title: 'Settings',
			// 	url: '/settings/space',
			// 	icon: Settings2
			// },
			// {
			// 	title: 'Send feedback',
			// 	url: '#',
			// 	icon: Send
			// },
			// {
			// 	title: "What's new",
			// 	url: '/changelog',
			// 	icon: Megaphone,
			// 	badge: '2'
			// }
		],
		admin: [
			{
				name: 'Dashboard',
				url: '/admin/dashboard',
				emoji: '📊'
			},
			{
				name: 'Ingredients',
				url: '/admin/ingredients',
				emoji: '🍏'
			},
			{
				name: 'Match',
				url: '/admin/match',
				emoji: '🔍'
			}
		],
		workspaces: [
			// {
			// 	name: 'Personal Life Management',
			// 	emoji: '🏠',
			// 	pages: [
			// 		{
			// 			name: 'Daily Journal & Reflection',
			// 			url: '#',
			// 			emoji: '📔'
			// 		},
			// 		{
			// 			name: 'Health & Wellness Tracker',
			// 			url: '#',
			// 			emoji: '🍏'
			// 		},
			// 		{
			// 			name: 'Personal Growth & Learning Goals',
			// 			url: '#',
			// 			emoji: '🌟'
			// 		}
			// 	]
			// },
		]
	});

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root class="border-r-0" bind:ref {...restProps}>
	<Sidebar.Header>
		<SpaceSwitcher />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<!-- <NavWorkspaces workspaces={data.workspaces} /> -->
		{#if userState.isAdmin}
			<NavAdmin items={data.admin} />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<!-- <Sidebar.Rail onclick={() => {}} /> -->
	<Sidebar.Header class="border-sidebar-border border-b">
		<NavUser
			user={{
				name:
					userState.preferences?.first_name + ' ' + userState.preferences?.last_name ||
					'Loading...',
				email: '@' + userState.profile?.user_name || 'Loading...',
				avatar: userState.profile?.image_url || ''
			}}
		/>
	</Sidebar.Header>
</Sidebar.Root>
