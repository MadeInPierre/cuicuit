import type { Unit } from '$lib/shared/utils/quantity';
import { Cake, Cookie, Croissant, CupSoda, EggFried, Icon, Salad, Soup } from 'lucide-svelte';

// Oven, Microwave, Stove, Fridge, Freezer, Blender, Mixer, Food processor, Toaster, Grill,
// Pressure cooker, Slow cooker, Rice cooker, Steamer, Coffee maker, Kettle, Juicer, Scale,
// Measuring cups, Measuring spoons, Cutting board, Knife, Peeler, Grater, Zester, Slicer,
// Strainer, Colander, Mixing bowl, Whisk, Spatula, Tongs, Ladle, Slotted spoon, Wooden spoon,
// Skillet, Saucepan, Pot, Baking dish, Baking sheet, Cake pan, Muffin tin, Pie dish, Casserole
// dish, Roasting pan, Cooling rack, Parchment paper, Aluminum foil, Plastic wrap, Wax paper,
// Parchment paper, Kitchen timer, Thermometer, Oven mitts, Pot holders, Apron, Kitchen scale,
// Blender, Food processor, Stand mixer, Hand mixer, Immersion blender, Toaster, Toaster oven,
// Coffee maker, Espresso machine, French press, Tea kettle.
export const recipeTools = {
	oven: 'Oven',
	microwave: 'Microwave',
	stove: 'Stove',
	blender: 'Blender',
	fryer: 'Fryer',
	scale: 'Scale',
	mixer: 'Mixer',
	toaster: 'Toaster',
	juicer: 'Juicer',
	kettle: 'Kettle'
} as const;
export type RecipeToolKey = keyof typeof recipeTools;

export const recipeTimesOfDay = {
	breakfast: 'Breakfast',
	brunch: 'Brunch',
	lunch: 'Lunch',
	dinner: 'Dinner',
	snack: 'Snacks',
	dessert: 'Desserts',
	drink: 'Drinks'
} as const;
export type RecipeTimeOfDayKey = keyof typeof recipeTimesOfDay;

export const recipeTimesOfDayCards = {
	breakfast: {
		icon: Croissant,
		description: 'Start your day with a delicious breakfast recipe.',
		classes: 'bg-orange-100 text-orange-800'
	},
	brunch: {
		icon: EggFried,
		description: 'Had a great sleep? Enjoy a delightful brunch recipe.',
		classes: 'bg-amber-100 text-amber-800'
	},
	lunch: {
		icon: Salad,
		description: 'Savor a fresh lunch recipe.',
		classes: 'bg-green-100 text-green-800'
	},
	dinner: {
		icon: Soup,
		description: 'Indulge in a hearty dinner recipe.',
		classes: 'bg-purple-100 text-purple-800'
	},
	snack: {
		icon: Cookie,
		description: 'Treat yourself to a tasty snack recipe.',
		classes: 'bg-pink-100 text-pink-800'
	},
	dessert: {
		icon: Cake,
		description: 'End your meal with a sweet dessert recipe.',
		classes: 'bg-fuchsia-100 text-fuchsia-800'
	},
	drink: {
		icon: CupSoda,
		description: 'Quench your thirst with a refreshing drink recipe.',
		classes: 'bg-cyan-100 text-cyan-800'
	}
} satisfies Record<
	RecipeTimeOfDayKey,
	{
		icon: typeof Icon;
		description: string;
		classes: string;
	}
>;

export const recipeCourses = {
	appetizer: 'Appetizer',
	soup: 'Soup',
	main: 'Main Course',
	side: 'Side Dish',
	salad: 'Salad',
	dessert: 'Dessert',
	drink: 'Drink',
	snack: 'Snack'
} as const;
export type RecipeCourseKey = keyof typeof recipeCourses;

export const recipeCuisines = {
	italian: 'Italian',
	mexican: 'Mexican',
	indian: 'Indian',
	chinese: 'Chinese',
	french: 'French',
	japanese: 'Japanese',
	mediterranean: 'Mediterranean',
	american: 'American',
	spanish: 'Spanish',
	thai: 'Thai',
	greek: 'Greek',
	korean: 'Korean',
	vietnamese: 'Vietnamese',
	middleeast: 'Middle Eastern',
	british: 'British',
	brazilian: 'Brazilian',
	caribbean: 'Caribbean',
	african: 'African'
} as const;
export type RecipeCuisineKey = keyof typeof recipeCuisines;

export type RecipeIngredient = {
	id: string;
	name: string;
	amount: number;
	unit: Unit;
};
