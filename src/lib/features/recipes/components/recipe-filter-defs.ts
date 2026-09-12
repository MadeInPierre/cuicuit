import type { RecipeFilterKey } from '$lib/features/recipes/state/recipes-search.svelte';
import { ChefHat, DollarSign, HandCoins, SignalHigh, SignalLow, SignalMedium, Sparkle } from '@lucide/svelte';
import type { Component } from 'svelte';
import {
	recipeCoursesSectionHeaders,
	recipeCuisineSectionHeaders,
	recipeTimesOfDaySectionHeaders
} from './consts';

export type RecipeFilterKind =
	/** Postgres array column, matched with `overlaps` */
	| 'array'
	/** Single-value (enum) column, matched with `in` */
	| 'enum'
	/** Integer minutes column, matched against the selected time buckets */
	| 'time';

export type RecipeFilterOption = {
	value: string;
	label: string;
	icon?: Component | string;
};

export type RecipeFilterDef = {
	key: RecipeFilterKey;
	/** DB column on `recipes` / `recipes_randomized` */
	column: string;
	kind: RecipeFilterKind;
	title: string;
	emptyLabel: string;
	description: string;
	options: RecipeFilterOption[];
};

/** Turn section headers into filter options, dropping the `default` display fallback. */
function sectionOptions(
	headers: Record<string, { title: string; icon: Component | string }>
): RecipeFilterOption[] {
	return Object.entries(headers)
		.filter(([key]) => key !== 'default')
		.map(([key, item]) => ({ value: key, label: item.title, icon: item.icon }));
}

function levelOptions(values: string[], icons: (Component | string)[]): RecipeFilterOption[] {
	return values.map((value, index) => ({
		value,
		label: value.charAt(0).toUpperCase() + value.slice(1),
		icon: icons[index]
	}));
}

const noneLowMedHighIcons = [Sparkle, SignalLow, SignalMedium, SignalHigh];

export const recipeTimeBucketOptions: RecipeFilterOption[] = [
	{ value: '0-15', label: '0-15 min', icon: '⚡' },
	{ value: '15-30', label: '15-30 min', icon: '⏱️' },
	{ value: '30-60', label: '30-60 min', icon: '🕒' },
	{ value: '60-120', label: '1-2 h', icon: '⏳' },
	{ value: '120+', label: '2-4 h', icon: '🍲' },
	{ value: '240+', label: '4 h+', icon: '👨‍🍳' }
];

/**
 * Minute ranges for each time bucket. Times are stored as integers, so
 * boundaries are split without overlap (15 belongs to "0-15", 30 to "15-30", ...).
 */
export const recipeTimeBucketRanges: Record<string, { min: number; max: number | null }> = {
	'0-15': { min: 0, max: 15 },
	'15-30': { min: 16, max: 30 },
	'30-60': { min: 31, max: 60 },
	'60-120': { min: 61, max: 120 },
	'120-240': { min: 121, max: 240 },
	'240+': { min: 241, max: null }
};

/**
 * Build a PostgREST `or` filter matching any of the selected time buckets
 * on the given column. Returns null when nothing matches.
 */
export function buildTimeRangeOrFilter(column: string, buckets: string[]): string | null {
	const parts: string[] = [];
	for (const bucket of buckets) {
		const range = recipeTimeBucketRanges[bucket];
		if (!range) continue;
		if (range.max == null) {
			parts.push(`${column}.gte.${range.min}`);
		} else {
			parts.push(`and(${column}.gte.${range.min},${column}.lte.${range.max})`);
		}
	}
	return parts.length > 0 ? parts.join(',') : null;
}

function timeFilterDef(
	key: Extract<RecipeFilterKey, 'prepTime' | 'cookTime' | 'restTime' | 'totalTime'>,
	column: string,
	title: string,
	emptyLabel: string,
	description: string
): RecipeFilterDef {
	return {
		key,
		column,
		kind: 'time',
		title,
		emptyLabel,
		description,
		options: recipeTimeBucketOptions
	};
}

/**
 * Single source of truth for every recipe filter: UI labels/options and
 * the DB column + match strategy used by the recipes page query.
 */
export const recipeFilterDefs: RecipeFilterDef[] = [
	{
		key: 'timeOfDay',
		column: 'times_of_day',
		kind: 'array',
		title: 'Time of Day',
		emptyLabel: 'When',
		description: '',
		options: sectionOptions(recipeTimesOfDaySectionHeaders)
	},
	{
		key: 'course',
		column: 'courses',
		kind: 'array',
		title: 'Course',
		emptyLabel: 'Course',
		description: '',
		options: sectionOptions(recipeCoursesSectionHeaders)
	},
	// timeFilterDef(
	// 	'prepTime',
	// 	'time_prep_minutes',
	// 	'Prep Time',
	// 	'Prep',
	// 	''
	// ),
	// timeFilterDef(
	// 	'cookTime',
	// 	'time_cook_minutes',
	// 	'Cook Time',
	// 	'Cook',
	// 	''
	// ),
	// timeFilterDef(
	// 	'restTime',
	// 	'time_rest_minutes',
	// 	'Rest Time',
	// 	'Rest',
	// 	''
	// ),
	timeFilterDef('totalTime', 'time_total_minutes', 'Total Time', 'Time', ''),
	{
		key: 'cuisine',
		column: 'cuisines',
		kind: 'array',
		title: 'Cuisine',
		emptyLabel: 'Cuisine',
		description: '',
		options: sectionOptions(recipeCuisineSectionHeaders)
	},
	{
		key: 'effort',
		column: 'effort_level',
		kind: 'enum',
		title: 'Effort',
		emptyLabel: 'Effort',
		description: '',
		options: levelOptions(['none', 'low', 'medium', 'high'], noneLowMedHighIcons)
	},
	{
		key: 'cleanup',
		column: 'cleanup_level',
		kind: 'enum',
		title: 'Cleanup',
		emptyLabel: 'Cleanup',
		description: '',
		options: levelOptions(['none', 'low', 'medium', 'high'], noneLowMedHighIcons)
	},
	{
		key: 'skill',
		column: 'skill_level',
		kind: 'enum',
		title: 'Skill',
		emptyLabel: 'Skill',
		description: '',
		options: levelOptions(
			['beginner', 'intermediate', 'advanced', 'chef'],
			[SignalLow, SignalMedium, SignalHigh, ChefHat]
		)
	},
	{
		key: 'cost',
		column: 'cost_level',
		kind: 'enum',
		title: 'Cost',
		emptyLabel: 'Cost',
		description: '',
		options: levelOptions(
			['minimal', 'budget', 'average', 'premium'],
			[SignalLow, SignalMedium, SignalHigh, DollarSign]
		)
	}
];
