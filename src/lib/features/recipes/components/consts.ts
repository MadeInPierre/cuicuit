import type { UISectionHeader } from '$lib/shared/components/SectionHeader.svelte';
import {
	Candy,
	Carrot,
	Nut,
	Snowflake,
	Wheat,
	Beef,
	Croissant,
	Cross,
	CupSoda,
	Milk,
	Cake,
	Cookie,
	EggFried,
	Salad,
	Soup
} from 'lucide-svelte';
import type { RecipeTimeOfDayKey } from '../db/recipe-doc';
import { Bean } from '@lucide/svelte';

export const recipeTimesOfDaySectionHeaders = {
	breakfast: {
		title: 'Breakfast',
		icon: Croissant,
		subtitle: 'Start your day with a delicious breakfast recipe.',
		classes: 'bg-orange-100 text-orange-800'
	},
	brunch: {
		title: 'Brunch',
		icon: EggFried,
		subtitle: 'Had a great sleep? Enjoy a delightful brunch recipe.',
		classes: 'bg-amber-100 text-amber-800'
	},
	lunch: {
		title: 'Lunch',
		icon: Salad,
		subtitle: 'Savor a fresh lunch recipe.',
		classes: 'bg-green-100 text-green-800'
	},
	dinner: {
		title: 'Dinner',
		icon: Soup,
		subtitle: 'Indulge in a hearty dinner recipe.',
		classes: 'bg-purple-100 text-purple-800'
	},
	snack: {
		title: 'Snacks',
		icon: Cookie,
		subtitle: 'Treat yourself to a tasty snack recipe.',
		classes: 'bg-pink-100 text-pink-800'
	},
	dessert: {
		title: 'Desserts',
		icon: Cake,
		subtitle: 'End your meal with a sweet dessert recipe.',
		classes: 'bg-fuchsia-100 text-fuchsia-800'
	},
	drink: {
		title: 'Drinks',
		icon: CupSoda,
		subtitle: 'Quench your thirst with a refreshing drink recipe.',
		classes: 'bg-cyan-100 text-cyan-800'
	}
} satisfies Record<RecipeTimeOfDayKey, UISectionHeader>;

export const supermarketAisleSectionHeaders: Record<string, UISectionHeader> = {
	beverages: {
		title: 'Beverages',
		subtitle: 'Drinks and refreshments',
		icon: CupSoda,
		classes: 'bg-blue-100 text-blue-800'
	},
	'bread-pastries': {
		title: 'Bread & Pastries',
		subtitle: 'Freshly baked goods',
		icon: Croissant,
		classes: 'bg-yellow-100 text-yellow-800'
	},
	'care-health': {
		title: 'Care & Health',
		subtitle: 'Health and personal care products',
		icon: Cross,
		classes: 'bg-red-100 text-red-800'
	},
	'frozen-convenience': {
		title: 'Frozen & Convenience',
		subtitle: 'Frozen meals and quick snacks',
		icon: Snowflake,
		classes: 'bg-slate-100 text-slate-800'
	},
	'fruits-vegetables': {
		title: 'Vegetables & Fruits',
		subtitle: 'Fresh produce',
		icon: Carrot,
		classes: 'bg-green-100 text-green-800'
	},
	'grain-products': {
		title: 'Grain Products',
		subtitle: 'Bread, rice, and pasta',
		icon: Wheat,
		classes: 'bg-yellow-100 text-yellow-800'
	},
	'ingredients-spices': {
		title: 'Ingredients & Spices',
		subtitle: 'Cooking essentials',
		icon: Bean,
		classes: 'bg-amber-100 text-amber-800'
	},
	'meat-fish': {
		title: 'Meat & Fish',
		subtitle: 'Fresh and frozen meats',
		icon: Beef,
		classes: 'bg-red-100 text-red-800'
	},
	'milk-cheese': {
		title: 'Milk & Cheese',
		subtitle: 'Dairy products',
		icon: Milk,
		classes: 'bg-blue-100 text-blue-800'
	},
	'snacks-sweets': {
		title: 'Snacks & Sweets',
		subtitle: 'Chips, candy, and treats',
		icon: Candy,
		classes: 'bg-pink-100 text-pink-800'
	}
};
