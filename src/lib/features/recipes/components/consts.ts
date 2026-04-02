import type { UISectionHeader } from '$lib/shared/components/SectionHeader.svelte';
import { Bean } from '@lucide/svelte';
import {
    Beef, Blocks, Cake, Candy,
    Carrot, Clock, Cookie, Croissant,
    Cross,
    CupSoda, EggFried, Milk, Pizza, Salad, Sandwich, ShoppingBag, Snowflake, Soup, Wheat
} from 'lucide-svelte';
import type { RecipeCourseKey, RecipeCuisineKey, RecipeTimeOfDayKey } from '../db/recipe-doc';

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
	drinks: {
		title: 'Drinks',
		icon: CupSoda,
		subtitle: 'Quench your thirst with a refreshing drink recipe.',
		classes: 'bg-cyan-100 text-cyan-800'
	},
	default: {
		title: 'Others',
		icon: Clock,
		subtitle: 'Recipes for any time of the day.',
		classes: 'bg-slate-100'
	}
} satisfies Record<RecipeTimeOfDayKey, UISectionHeader> & { default: UISectionHeader };

export const recipeCuisineSectionHeaders = {
	italian: {
		title: 'Italian',
		icon: '🇮🇹',
		subtitle: 'Delicious Italian recipes.',
		classes: 'bg-green-100'
	},
	chinese: {
		title: 'Chinese',
		icon: '🇨🇳',
		subtitle: 'Tasty Chinese recipes.',
		classes: 'bg-red-100'
	},
	mexican: {
		title: 'Mexican',
		icon: '🇲🇽',
		subtitle: 'Spicy Mexican recipes.',
		classes: 'bg-green-100'
	},
	indian: {
		title: 'Indian',
		icon: '🇮🇳',
		subtitle: 'Flavorful Indian recipes.',
		classes: 'bg-orange-100'
	},
	brazilian: {
		title: 'Brazilian',
		icon: '🇧🇷',
		subtitle: 'Delicious Brazilian recipes.',
		classes: 'bg-green-100'
	},
	french: {
		title: 'French',
		icon: '🇫🇷',
		subtitle: 'Delicious French recipes.',
		classes: 'bg-blue-100'
	},
	american: {
		title: 'American',
		icon: '🇺🇸',
		subtitle: 'Delicious American recipes.',
		classes: 'bg-red-100'
	},
	default: {
		title: 'Around the World',
		icon: '🌍',
		subtitle: 'A variety of delicious recipes from around the world.',
		classes: 'bg-slate-100'
	}
} as Record<RecipeCuisineKey, UISectionHeader> & { default: UISectionHeader }; // TODO add all and change 'as' to 'satisfies'

export const recipeCoursesSectionHeaders = {
	main: {
		title: 'Main Courses',
		icon: Pizza,
		subtitle: 'Savor a hearty main course.',
		classes: 'bg-green-100 text-green-800'
	},
	appetizer: {
		title: 'Appetizers',
		icon: Sandwich,
		subtitle: 'Start your meal with a delicious appetizer.',
		classes: 'bg-orange-100 text-orange-800'
	},
	soup: {
		title: 'Soups',
		icon: Soup,
		subtitle: 'Warm up with a comforting soup.',
		classes: 'bg-blue-100 text-blue-800'
	},
	side: {
		title: 'Side Dishes',
		icon: EggFried,
		subtitle: 'Complement your meal with a tasty side dish.',
		classes: 'bg-yellow-100 text-yellow-800'
	},
	prep: {
		title: 'Preparations',
		icon: Blocks,
		subtitle: 'Small recipes that can be combined with other dishes.',
		classes: 'bg-teal-100 text-teal-800'
	},
	salad: {
		title: 'Salads',
		icon: Salad,
		subtitle: 'Enjoy a fresh and healthy salad.',
		classes: 'bg-green-100 text-green-800'
	},
	dessert: {
		title: 'Desserts',
		icon: Cake,
		subtitle: 'End your meal with a sweet dessert.',
		classes: 'bg-red-100 text-red-800'
	},
	snack: {
		title: 'Snacks',
		icon: Cookie,
		subtitle: 'Treat yourself to a tasty snack.',
		classes: 'bg-pink-100 text-pink-800'
	},
	drink: {
		title: 'Drinks',
		icon: CupSoda,
		subtitle: 'Quench your thirst with a refreshing drink.',
		classes: 'bg-blue-100 text-blue-800'
	},
	default: {
		title: 'Other',
		icon: Clock,
		subtitle: 'Various courses and dishes.',
		classes: 'bg-slate-100'
	}
} satisfies Record<RecipeCourseKey, UISectionHeader> & { default: UISectionHeader };

export const supermarketAisleSectionHeaders = {
	'fruits-vegetables': {
		title: 'Vegetables & Fruits',
		subtitle: 'Fresh produce',
		icon: Carrot,
		classes: 'bg-green-100 text-green-800'
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
	'bread-pastries': {
		title: 'Bread & Pastries',
		subtitle: 'Freshly baked goods',
		icon: Croissant,
		classes: 'bg-yellow-100 text-yellow-800'
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
	beverages: {
		title: 'Beverages',
		subtitle: 'Drinks and refreshments',
		icon: CupSoda,
		classes: 'bg-blue-100 text-blue-800'
	},
	'frozen-convenience': {
		title: 'Frozen & Convenience',
		subtitle: 'Frozen meals and quick snacks',
		icon: Snowflake,
		classes: 'bg-slate-100 text-slate-800'
	},
	'snacks-sweets': {
		title: 'Snacks & Sweets',
		subtitle: 'Chips, candy, and treats',
		icon: Candy,
		classes: 'bg-pink-100 text-pink-800'
	},
	'care-health': {
		title: 'Care & Health',
		subtitle: 'Health and personal care products',
		icon: Cross,
		classes: 'bg-red-100 text-red-800'
	},
	default: {
		title: 'Anything else?',
		icon: ShoppingBag,
		subtitle: 'Various supermarket items',
		classes: 'bg-slate-100'
	}
} satisfies Record<string, UISectionHeader> & { default: UISectionHeader };

export type SupermarketAisleKey = keyof typeof supermarketAisleSectionHeaders;
