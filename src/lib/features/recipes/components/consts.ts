import type { UISectionHeader } from '$lib/shared/components/SectionHeader.svelte';
import { Bean } from '@lucide/svelte';
import {
	Beef,
	Blocks,
	Cake,
	Candy,
	Carrot,
	Clock,
	Cookie,
	Croissant,
	Cross,
	CupSoda,
	EggFried,
	Milk,
	Pizza,
	Salad,
	Sandwich,
	ShoppingBag,
	Snowflake,
	Soup,
	Wheat
} from '@lucide/svelte';
import type { RecipeCourseKey, RecipeCuisineKey, RecipeTimeOfDayKey } from '../db/recipe-doc';

export const recipeTimesOfDaySectionHeaders = {
	breakfast: {
		title: 'Breakfast',
		icon: Croissant,
		subtitle: 'Start your day with a delicious breakfast recipe.',
		classes: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-500'
	},
	brunch: {
		title: 'Brunch',
		icon: EggFried,
		subtitle: 'Had a great sleep? Enjoy a delightful brunch recipe.',
		classes: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-500'
	},
	lunch: {
		title: 'Lunch',
		icon: Salad,
		subtitle: 'Savor a fresh lunch recipe.',
		classes: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-500'
	},
	dinner: {
		title: 'Dinner',
		icon: Soup,
		subtitle: 'Indulge in a hearty dinner recipe.',
		classes: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-500'
	},
	snack: {
		title: 'Snacks',
		icon: Cookie,
		subtitle: 'Treat yourself to a tasty snack recipe.',
		classes: 'bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-500'
	},
	dessert: {
		title: 'Desserts',
		icon: Cake,
		subtitle: 'End your meal with a sweet dessert recipe.',
		classes: 'bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-500'
	},
	drinks: {
		title: 'Drinks',
		icon: CupSoda,
		subtitle: 'Quench your thirst with a refreshing drink recipe.',
		classes: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-500'
	},
	default: {
		title: 'Others',
		icon: Clock,
		subtitle: 'Recipes for any time of the day.',
		classes: 'bg-slate-100 dark:bg-slate-950'
	}
} satisfies Record<RecipeTimeOfDayKey, UISectionHeader> & { default: UISectionHeader };

export const recipeCuisineSectionHeaders = {
	italian: {
		title: 'Italian',
		icon: '🇮🇹',
		subtitle: 'Delicious Italian recipes.',
		classes: 'bg-green-100 dark:bg-green-950'
	},
	chinese: {
		title: 'Chinese',
		icon: '🇨🇳',
		subtitle: 'Tasty Chinese recipes.',
		classes: 'bg-red-100 dark:bg-red-950'
	},
	mexican: {
		title: 'Mexican',
		icon: '🇲🇽',
		subtitle: 'Spicy Mexican recipes.',
		classes: 'bg-green-100 dark:bg-green-950'
	},
	indian: {
		title: 'Indian',
		icon: '🇮🇳',
		subtitle: 'Flavorful Indian recipes.',
		classes: 'bg-orange-100 dark:bg-orange-950'
	},
	brazilian: {
		title: 'Brazilian',
		icon: '🇧🇷',
		subtitle: 'Delicious Brazilian recipes.',
		classes: 'bg-green-100 dark:bg-green-950'
	},
	french: {
		title: 'French',
		icon: '🇫🇷',
		subtitle: 'Delicious French recipes.',
		classes: 'bg-blue-100 dark:bg-blue-950'
	},
	american: {
		title: 'American',
		icon: '🇺🇸',
		subtitle: 'Delicious American recipes.',
		classes: 'bg-red-100 dark:bg-red-950'
	},
	japanese: {
		title: 'Japanese',
		icon: '🇯🇵',
		subtitle: 'Sushi, ramen, and more from Japan.',
		classes: 'bg-sky-100 dark:bg-sky-950'
	},
	mediterranean: {
		title: 'Mediterranean',
		icon: '🇲🇽',
		subtitle: 'Fresh and flavorful Mediterranean dishes.',
		classes: 'bg-amber-100 dark:bg-amber-950'
	},
	spanish: {
		title: 'Spanish',
		icon: '🇪🇸',
		subtitle: 'Tapas, paella and Spanish classics.',
		classes: 'bg-red-100 dark:bg-red-950'
	},
	thai: {
		title: 'Thai',
		icon: '🇹🇭',
		subtitle: 'Aromatic and spicy Thai recipes.',
		classes: 'bg-green-100 dark:bg-green-950'
	},
	greek: {
		title: 'Greek',
		icon: '🇬🇷',
		subtitle: 'Mediterranean Greek flavors and dishes.',
		classes: 'bg-blue-100 dark:bg-blue-950'
	},
	korean: {
		title: 'Korean',
		icon: '🇰🇷',
		subtitle: 'Korean BBQ, kimchi and more.',
		classes: 'bg-rose-100 dark:bg-rose-950'
	},
	vietnamese: {
		title: 'Vietnamese',
		icon: '🇻🇳',
		subtitle: 'Fresh Vietnamese soups and rolls.',
		classes: 'bg-emerald-100 dark:bg-emerald-950'
	},
	middleeast: {
		title: 'Middle Eastern',
		icon: '🇸🇦',
		subtitle: 'Hearty and spiced Middle Eastern cuisine.',
		classes: 'bg-yellow-100 dark:bg-yellow-950'
	},
	british: {
		title: 'British',
		icon: '🇬🇧',
		subtitle: 'Classic British comfort food.',
		classes: 'bg-slate-100 dark:bg-slate-950'
	},
	caribbean: {
		title: 'Caribbean',
		icon: '🇯🇲',
		subtitle: 'Tropical and spicy Caribbean dishes.',
		classes: 'bg-amber-100 dark:bg-amber-950'
	},
	african: {
		title: 'African',
		icon: '🌍',
		subtitle: 'Diverse African recipes and flavors.',
		classes: 'bg-orange-100 dark:bg-orange-950'
	},
	default: {
		title: 'Other',
		icon: '🌍',
		subtitle: 'A variety of delicious recipes from around the world.',
		classes: 'bg-slate-100 dark:bg-slate-950'
	}
} as Record<RecipeCuisineKey, UISectionHeader> & { default: UISectionHeader }; // TODO add all and change 'as' to 'satisfies'

export const recipeCoursesSectionHeaders = {
	main: {
		title: 'Main Courses',
		icon: Pizza,
		subtitle: 'Savor a hearty main course.',
		classes: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-500'
	},
	appetizer: {
		title: 'Appetizers',
		icon: Sandwich,
		subtitle: 'Start your meal with a delicious appetizer.',
		classes: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-500'
	},
	soup: {
		title: 'Soups',
		icon: Soup,
		subtitle: 'Warm up with a comforting soup.',
		classes: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-500'
	},
	side: {
		title: 'Side Dishes',
		icon: EggFried,
		subtitle: 'Complement your meal with a tasty side dish.',
		classes: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-500'
	},
	prep: {
		title: 'Preparations',
		icon: Blocks,
		subtitle: 'Small recipes that can be combined with other dishes.',
		classes: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-500'
	},
	salad: {
		title: 'Salads',
		icon: Salad,
		subtitle: 'Enjoy a fresh and healthy salad.',
		classes: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-500'
	},
	dessert: {
		title: 'Desserts',
		icon: Cake,
		subtitle: 'End your meal with a sweet dessert.',
		classes: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-500'
	},
	snack: {
		title: 'Snacks',
		icon: Cookie,
		subtitle: 'Treat yourself to a tasty snack.',
		classes: 'bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-500'
	},
	drink: {
		title: 'Drinks',
		icon: CupSoda,
		subtitle: 'Quench your thirst with a refreshing drink.',
		classes: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-500'
	},
	default: {
		title: 'Other',
		icon: Clock,
		subtitle: 'Various courses and dishes.',
		classes: 'bg-slate-100 dark:bg-slate-950'
	}
} satisfies Record<RecipeCourseKey, UISectionHeader> & { default: UISectionHeader };

export const supermarketAisleSectionHeaders = {
	'fruits-vegetables': {
		title: 'Vegetables & Fruits',
		subtitle: 'Fresh produce',
		icon: Carrot,
		classes: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-500'
	},
	'meat-fish': {
		title: 'Meat & Fish',
		subtitle: 'Fresh and frozen meats',
		icon: Beef,
		classes: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-500'
	},
	'milk-cheese': {
		title: 'Milk & Cheese',
		subtitle: 'Dairy products',
		icon: Milk,
		classes: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-500'
	},
	'bread-pastries': {
		title: 'Bread & Pastries',
		subtitle: 'Freshly baked goods',
		icon: Croissant,
		classes: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-500'
	},
	'grain-products': {
		title: 'Grain Products',
		subtitle: 'Bread, rice, and pasta',
		icon: Wheat,
		classes: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-500'
	},
	'ingredients-spices': {
		title: 'Ingredients & Spices',
		subtitle: 'Cooking essentials',
		icon: Bean,
		classes: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-500'
	},
	beverages: {
		title: 'Beverages',
		subtitle: 'Drinks and refreshments',
		icon: CupSoda,
		classes: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-500'
	},
	'frozen-convenience': {
		title: 'Frozen & Convenience',
		subtitle: 'Frozen meals and quick snacks',
		icon: Snowflake,
		classes: 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-500'
	},
	'snacks-sweets': {
		title: 'Snacks & Sweets',
		subtitle: 'Chips, candy, and treats',
		icon: Candy,
		classes: 'bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-500'
	},
	'care-health': {
		title: 'Care & Health',
		subtitle: 'Health and personal care products',
		icon: Cross,
		classes: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-500'
	},
	default: {
		title: 'Anything else?',
		icon: ShoppingBag,
		subtitle: 'Various supermarket items',
		classes: 'bg-slate-100 dark:bg-slate-950'
	}
} satisfies Record<string, UISectionHeader> & { default: UISectionHeader };

export type SupermarketAisleKey = keyof typeof supermarketAisleSectionHeaders;
