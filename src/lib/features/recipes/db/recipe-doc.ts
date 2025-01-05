import type { UserProfile } from '$lib/features/auth/db/user-doc';
import type { Modify } from '$lib/utils';
import { Timestamp, type FirestoreDataConverter } from 'firebase/firestore';

// TODO Implement model versioning, see tutorial:
// https://www.captaincodeman.com/schema-versioning-with-google-firestore

/**
 * App model
 */

export type RecipeDoc = {
	// Metadata
	status: 'draft' | 'published';
	created_t: Date;
	modified_t: Date;
	author: {
		uid: string;
		profile: UserProfile;
	};
	// Cover info
	title: string;
	imageIds: string[]; // Cover image first
	imageUrls: string[]; // Cover image first
	ratings: {
		1: number;
		2: number;
		3: number;
		4: number;
		5: number;
		count: number;
		average: number;
	};
	// Search
	embedding: number[];
	// Filters
	// tags: string[]; // E.g. 'breakfast, vegan, gluten-free, party, birthday'
	timesOfDay: RecipeMealTime[]; // E.g. 'breakfast, lunch, dinner'
	motivationLevel: RecipeMotivationLevel;
	healthyLevel: RecipeHealthyLevel;
	dishesLevels: {
		dishwasher: DishesLevel;
		hand: DishesLevel;
		total: DishesLevel;
	};
	time: {
		total: number;
		prep: number;
		rest: number;
		cook: number;
	};
	nutritionFilters: {
		vegan: boolean;
		vegetarian: boolean;
		glutenFree: boolean;
		// TODO more filters
	};
	tools: RecipeTool[];
	// Recipe
	description: string;
	servings: number; // Number of servings for the quantities in the ingredients
	ingredients: RecipeIngredient[];
	instructions: RecipeInstruction[];
	// Community
	// TODO nutrition stats, allergens, etc.
	// TODO reviews, comments, etc. but in a separate collection?
	// TODO history of changes?
};

export enum RecipeMealTime {
	BREAKFAST = 'breakfast',
	LUNCH = 'lunch',
	DINNER = 'dinner',
	SNACK = 'snack',
	DESSERT = 'dessert',
	DRINK = 'drink'
}

export enum RecipeHealthyLevel {
	TERRIBLE = 1,
	BAD = 2,
	OK = 3,
	GOOD = 4,
	EXCELLENT = 5
}

export enum RecipeMotivationLevel {
	NONE = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
	VERY_HIGH = 4,
	EXTREME = 5
}

export enum DishesLevel {
	NONE = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
	VERY_HIGH = 4,
	EXTREME = 5
}

export type RecipeInstruction = {
	step: number;
	description: string;
	ingredients: RecipeIngredient[];
};

// export enum RecipeTool {
// 	OVEN = 'oven',
// 	STOVE = 'stove',
// 	FRYING_PAN = 'frying-pan',
// 	POT = 'pot'
// }

// Oven, Microwave, Stove, Fridge, Freezer, Blender, Mixer, Food processor, Toaster, Grill,
// Pressure cooker, Slow cooker, Rice cooker, Steamer, Coffee maker, Kettle, Juicer, Scale,
// Measuring cups, Measuring spoons, Cutting board, Knife, Peeler, Grater, Zester, Slicer,
// Strainer, Colander, Mixing bowl, Whisk, Spatula, Tongs, Ladle, Slotted spoon, Wooden spoon,
// Skillet, Saucepan, Pot, Baking dish, Baking sheet, Cake pan, Muffin tin, Pie dish, Casserole
// dish, Roasting pan, Cooling rack, Parchment paper, Aluminum foil, Plastic wrap, Wax paper,
// Parchment paper, Kitchen timer, Thermometer, Oven mitts, Pot holders, Apron, Kitchen scale,
// Blender, Food processor, Stand mixer, Hand mixer, Immersion blender, Toaster, Toaster oven,
// Coffee maker, Espresso machine, French press, Tea kettle.
export const recipeTools = [
	'Oven',
	'Microwave',
	'Stove',
	'Blender',
	'Fryer',
	'Grill',
	'Steamer',
	'Toaster',
	'Juicer',
	'Kettle'
] as const;

export type RecipeTool = typeof recipeTools[number];

export type RecipeIngredient = {
	name: string;
	quantity: Quantity;
};

export type Quantity = {
	value: number;
	unit: string; // TODO more complex
};

/**
 * Firestore model
 */

export type DBRecipeDoc = Modify<
	RecipeDoc,
	{
		created_t: Timestamp; // Override Date with Firestore Timestamp
		modified_t: Timestamp;
	}
>;

/**
 * Firestore data converter
 */

export const recipeDocConverter: FirestoreDataConverter<RecipeDoc, DBRecipeDoc> = {
	toFirestore(recipeDoc: RecipeDoc) {
		return {
			...recipeDoc,
			created_t: Timestamp.fromDate(recipeDoc.created_t),
			modified_t: Timestamp.fromDate(recipeDoc.modified_t)
		} satisfies DBRecipeDoc;
	},

	fromFirestore(snapshot, options) {
		const dbRecipeDoc = snapshot.data(options) as DBRecipeDoc;

		return {
			...dbRecipeDoc,
			created_t: dbRecipeDoc.created_t.toDate(),
			modified_t: dbRecipeDoc.modified_t.toDate()
		} satisfies RecipeDoc;
	}
};

// Example data
export const recipes = [
	{
		created_t: new Date(),
		author: {
			uid: '123',
			profile: {
				firstName: 'John',
				lastName: 'Doe',
				userName: 'john.doe',
				avatar: {
					type: 'icon',
					icon: 'user',
					url: null
				}
			}
		},
		title: 'Vegan pancakes',
		subtitle: 'Delicious vegan pancakes for breakfast',
		imageUrls: ['https://example.com/pancakes.jpg'],
		ratings: {
			1: 2,
			2: 0,
			3: 5,
			4: 10,
			5: 42,
			count: 59,
			average: 4.43
		},
		timesOfDay: [RecipeMealTime.BREAKFAST],
		motivationLevel: RecipeMotivationLevel.HIGH,
		healthyLevel: RecipeHealthyLevel.GOOD,
		dishesLevels: {
			dishwasher: DishesLevel.MEDIUM,
			hand: DishesLevel.LOW,
			total: DishesLevel.LOW
		},
		time: {
			prep: 10,
			rest: 0,
			cooking: 10,
			total: 20
		},
		nutritionFilters: {
			vegan: true,
			vegetarian: false,
			glutenFree: true
		},
		tools: ['Oven', 'Stove'],
		description: 'Delicious vegan pancakes for breakfast',
		servings: 2,
		ingredients: [
			{
				name: 'flour',
				quantity: { value: 200, unit: 'g' }
			},
			{
				name: 'water',
				quantity: { value: 200, unit: 'ml' }
			},
			{
				name: 'salt',
				quantity: { value: 1, unit: 'pinch' }
			}
		],
		instructions: [
			{
				step: 1,
				description: 'Mix the flour, water and salt in a bowl',
				ingredients: [
					{
						name: 'flour',
						quantity: { value: 200, unit: 'g' }
					},
					{
						name: 'water',
						quantity: { value: 200, unit: 'ml' }
					},
					{
						name: 'salt',
						quantity: { value: 1, unit: 'pinch' }
					}
				]
			},
			{
				step: 2,
				description: 'Cook the pancakes in a frying pan',
				ingredients: []
			}
		]
	},
	{
		created_t: new Date(),
		author: {
			uid: '123',
			profile: {
				firstName: 'John',
				lastName: 'Doe',
				userName: 'john.doe',
				avatar: {
					type: 'icon',
					icon: 'user',
					url: null
				}
			}
		},
		title: 'Vegan salad',
		subtitle: 'Delicious vegan salad for lunch',
		imageUrls: ['https://example.com/salad.jpg'],
		ratings: {
			1: 0,
			2: 0,
			3: 1,
			4: 2,
			5: 5,
			count: 8,
			average: 4.38
		},
		timesOfDay: [RecipeMealTime.LUNCH],
		motivationLevel: RecipeMotivationLevel.MEDIUM,
		healthyLevel: RecipeHealthyLevel.EXCELLENT,
		dishesLevels: {
			dishwasher: DishesLevel.LOW,
			hand: DishesLevel.NONE,
			total: DishesLevel.NONE
		},
		time: {
			prep: 10,
			rest: 0,
			cooking: 0,
			total: 10
		},
		nutritionFilters: {
			vegan: true,
			vegetarian: true,
			glutenFree: true
		},
		tools: [],
		description: 'Delicious vegan salad for lunch',
		servings: 2,
		ingredients: [
			{
				name: 'lettuce',
				quantity: { value: 100, unit: 'g' }
			},
			{
				name: 'tomato',
				quantity: { value: 1, unit: 'unit' }
			},
			{
				name: 'cucumber',
				quantity: { value: 1, unit: 'unit' }
			}
		],
		instructions: [
			{
				step: 1,
				description: 'Mix the lettuce, tomato and cucumber in a bowl',
				ingredients: [
					{
						name: 'lettuce',
						quantity: { value: 100, unit: 'g' }
					},
					{
						name: 'tomato',
						quantity: { value: 1, unit: 'unit' }
					},
					{
						name: 'cucumber',
						quantity: { value: 1, unit: 'unit' }
					}
				]
			}
		]
	}
];
