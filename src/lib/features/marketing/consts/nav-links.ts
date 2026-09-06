import { Sprout } from '@lucide/svelte';
import { House, LayoutDashboard, Lock, LogOut, ScanLine, Scroll, User, Users } from '@lucide/svelte';

export type NavLink = {
	href?: string; // Link to the page
	title: string; // Page name displayed on the navbar
	startsWith?: boolean; // Item is active if the path starts with href (equal otherwise)
	startPath?: string; // Optionally specify a different value than href for startsWith
	className?: string; // Optional additional tailwind classes
	icon?: any; // Custom icon to be displayed alongside (e.g. command menu, user settings sidebar)
	display?: 'mobile' | 'desktop' | 'both'; // Control visibility on mobile vs desktop
};

export const navLinksMarketing: NavLink[] = [
	{
		href: '/pricing',
		title: 'Pricing'
	},
	{
		href: 'https://cuicuit.openstatus.dev',
		title: 'Status',
		className: 'hidden lg:block'
	}
];

export const navLinksApp: NavLink[] = [
	{
		href: '/dashboard',
		title: 'Dashboard',
		icon: LayoutDashboard
	},
	{
		href: '/scan',
		title: 'Scan',
		icon: ScanLine
	},
	{
		href: '/lists',
		title: 'Lists',
		startsWith: true,
		icon: Scroll
	}
];

export const navLinksAppSettingsSidebar: { name: string; links: NavLink[] }[] = [
	{
		name: 'Active space',
		links: [
			{
				title: 'General',
				href: '/settings/space',
				icon: House
			},
			{
				title: 'Members',
				href: '/settings/space/members',
				icon: Users
			}
		]
	},
	{
		name: 'Your account',
		links: [
			{
				title: 'Seeds',
				href: '/settings/seeds',
				icon: Sprout
			},
			{
				title: 'Profile',
				href: '/settings',
				icon: User
			},
			{
				title: 'Account',
				href: '/settings/account',
				icon: Lock
			},
			{
				title: 'Sign out',
				icon: LogOut,
				display: 'mobile'
			}
		]
	}
];
