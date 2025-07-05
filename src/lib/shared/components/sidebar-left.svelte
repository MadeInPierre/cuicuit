<script lang="ts">
	import Calendar from 'lucide-svelte/icons/calendar';
	import Settings2 from 'lucide-svelte/icons/settings-2';
	import NavFavorites from '$lib/shared/components/nav-favorites.svelte';
	import NavMain from '$lib/shared/components/nav-main.svelte';
	import NavSecondary from '$lib/shared/components/nav-secondary.svelte';
	import NavWorkspaces from '$lib/shared/components/nav-workspaces.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import SpaceSwitcher from '$lib/features/spaces/components/SpaceSwitcher.svelte';
	import { Blocks, ChefHat, LifeBuoy, Megaphone, Notebook, Refrigerator, ScrollText, Send, ShoppingCart } from 'lucide-svelte';
	import { page } from '$app/state';
	import NavUser from './nav-user.svelte';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

	// This is sample data.
	const data = $derived({
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
				isActive: page.url.pathname.startsWith('/plan')
			},
			{
				title: 'Shopping list',
				url: '/list',
				icon: ShoppingCart,
				isActive: page.url.pathname.startsWith('/list')
			},
			{
				title: 'Pantry',
				url: '/pantry',
				icon: Refrigerator,
				isActive: page.url.pathname.startsWith('/pantry')
			},
			{
				title: 'Cookbook',
				url: '/cookbook',
				icon: Notebook,
				isActive: page.url.pathname.startsWith('/cookbook')
			}
		],
		navSecondary: [
			// {
			// 	title: 'Settings',
			// 	url: '/settings/space',
			// 	icon: Settings2
			// },
			{
				title: 'Feedback',
				url: '#',
				icon: Send
			},
			{
				title: "What's new",
				url: '/changelog',
				icon: Megaphone,
				// badge: '2'
			}
		],
		favorites: [
			{
				name: 'Project Management & Task Tracking',
				url: '#',
				emoji: '📊'
			},
			{
				name: 'Family Recipe Collection & Meal Planning',
				url: '#',
				emoji: '🍳'
			},
			{
				name: 'Fitness Tracker & Workout Routines',
				url: '#',
				emoji: '💪'
			},
			{
				name: 'Book Notes & Reading List',
				url: '#',
				emoji: '📚'
			},
			{
				name: 'Sustainable Gardening Tips & Plant Care',
				url: '#',
				emoji: '🌱'
			},
			{
				name: 'Language Learning Progress & Resources',
				url: '#',
				emoji: '🗣️'
			},
			{
				name: 'Home Renovation Ideas & Budget Tracker',
				url: '#',
				emoji: '🏠'
			},
			{
				name: 'Personal Finance & Investment Portfolio',
				url: '#',
				emoji: '💰'
			},
			{
				name: 'Movie & TV Show Watchlist with Reviews',
				url: '#',
				emoji: '🎬'
			},
			{
				name: 'Daily Habit Tracker & Goal Setting',
				url: '#',
				emoji: '✅'
			}
		],
		workspaces: [
			{
				name: 'Personal Life Management',
				emoji: '🏠',
				pages: [
					{
						name: 'Daily Journal & Reflection',
						url: '#',
						emoji: '📔'
					},
					{
						name: 'Health & Wellness Tracker',
						url: '#',
						emoji: '🍏'
					},
					{
						name: 'Personal Growth & Learning Goals',
						url: '#',
						emoji: '🌟'
					}
				]
			},
			{
				name: 'Professional Development',
				emoji: '💼',
				pages: [
					{
						name: 'Career Objectives & Milestones',
						url: '#',
						emoji: '🎯'
					},
					{
						name: 'Skill Acquisition & Training Log',
						url: '#',
						emoji: '🧠'
					},
					{
						name: 'Networking Contacts & Events',
						url: '#',
						emoji: '🤝'
					}
				]
			},
			{
				name: 'Creative Projects',
				emoji: '🎨',
				pages: [
					{
						name: 'Writing Ideas & Story Outlines',
						url: '#',
						emoji: '✍️'
					},
					{
						name: 'Art & Design Portfolio',
						url: '#',
						emoji: '🖼️'
					},
					{
						name: 'Music Composition & Practice Log',
						url: '#',
						emoji: '🎵'
					}
				]
			},
			{
				name: 'Home Management',
				emoji: '🏡',
				pages: [
					{
						name: 'Household Budget & Expense Tracking',
						url: '#',
						emoji: '💰'
					},
					{
						name: 'Home Maintenance Schedule & Tasks',
						url: '#',
						emoji: '🔧'
					},
					{
						name: 'Family Calendar & Event Planning',
						url: '#',
						emoji: '📅'
					}
				]
			},
			{
				name: 'Travel & Adventure',
				emoji: '🧳',
				pages: [
					{
						name: 'Trip Planning & Itineraries',
						url: '#',
						emoji: '🗺️'
					},
					{
						name: 'Travel Bucket List & Inspiration',
						url: '#',
						emoji: '🌎'
					},
					{
						name: 'Travel Journal & Photo Gallery',
						url: '#',
						emoji: '📸'
					}
				]
			}
		]
	});

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let user = getUserDocState();
</script>

<Sidebar.Root class="border-r-0" bind:ref {...restProps}>
	<Sidebar.Header>
		<SpaceSwitcher />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<!-- <NavWorkspaces workspaces={data.workspaces} /> -->
		<!-- <NavFavorites favorites={data.favorites} /> -->
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Rail />
	<Sidebar.Header class="border-sidebar-border border-b">
		<NavUser
			user={{
				name: user.doc?.firstName + ' ' + user.doc?.lastName || 'Loading...',
				email: '@' + user.doc?.userName || 'Loading...',
				avatar: user.doc?.avatar.url || ''
			}}
		/>
	</Sidebar.Header>
</Sidebar.Root>
