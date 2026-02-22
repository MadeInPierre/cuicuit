import type { Unit } from '$lib/shared/utils/quantity';

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
	drinks: 'Drinks'
} as const;
export type RecipeTimeOfDayKey = keyof typeof recipeTimesOfDay;

export const recipeCourses = {
	main: 'Main Course',
	appetizer: 'Appetizer',
	side: 'Side Dish',
	prep: 'Preparation',
	soup: 'Soup',
	salad: 'Salad',
	dessert: 'Dessert',
	snack: 'Snack',
	drink: 'Drink',
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
