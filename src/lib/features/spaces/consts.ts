import Armchair from 'lucide-svelte/icons/armchair';
import LampDesk from 'lucide-svelte/icons/lamp-desk';
import PawPrint from 'lucide-svelte/icons/paw-print';
import Handshake from 'lucide-svelte/icons/handshake';
import Refrigerator from 'lucide-svelte/icons/refrigerator';
import UsersRound from 'lucide-svelte/icons/users-round';
import House from 'lucide-svelte/icons/house';
import Cat from 'lucide-svelte/icons/cat';

export const spaceIcons = {
	house: House,
	armchair: Armchair,
	refrigerator: Refrigerator,
	lamp: LampDesk,
	handshake: Handshake,
	friends: UsersRound,
	cat: Cat,
	paw: PawPrint
	// hat: ChefHat,
	// pot: CookingPot
} as const;

export type SpaceIconKey = keyof typeof spaceIcons;

export const themeButtonClasses = {
	slate:
		'bg-slate-500 dark:text-slate-950 text-white hover:text-white hover:bg-slate-600 dark:hover:bg-slate-400 dark:bg-slate-400',
	red: 'bg-red-500 dark:text-red-950 text-white hover:text-white hover:bg-red-600 dark:hover:bg-red-400',
	orange:
		'bg-orange-500 dark:text-orange-950 text-white hover:text-white hover:bg-orange-600 dark:hover:bg-orange-400',
	yellow:
		'bg-yellow-500 dark:text-yellow-950 text-white hover:text-white hover:bg-yellow-600 dark:hover:bg-yellow-400',
	green:
		'bg-green-500 dark:text-green-950 text-white hover:text-white hover:bg-green-600 dark:hover:bg-green-400',
	emerald:
		'bg-emerald-500 dark:text-emerald-950 text-white hover:text-white hover:bg-emerald-600 dark:hover:bg-emerald-400',
	blue: 'bg-blue-500 dark:text-blue-950 text-white hover:text-white hover:bg-blue-600 dark:hover:bg-blue-400',
	violet:
		'bg-violet-500 dark:text-violet-950 text-white hover:text-white hover:bg-violet-600 dark:hover:bg-violet-400'
} as const;

export type SpaceThemeKey = keyof typeof themeButtonClasses;
