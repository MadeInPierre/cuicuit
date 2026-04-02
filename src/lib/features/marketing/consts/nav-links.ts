import { Bell, House, LayoutDashboard, Lock, ScanLine, Scroll, User, Users } from 'lucide-svelte';

export type NavLink = {
	href: string; // Link to the page
	title: string; // Page name displayed on the navbar
	startsWith?: boolean; // Item is active if the path starts with href (equal otherwise)
	startPath?: string; // Optionally specify a different value than href for startsWith
	className?: string; // Optional additional tailwind classes
	icon?: any; // Custom icon to be displayed alongside (e.g. command menu, user settings sidebar)
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
				title: 'Notifications',
				href: '/settings/notifications',
				icon: Bell
			}
		]
	}
];
