<script module lang="ts">
	export const statuses = {
		cookable: {
			key: 'cookable',
			label: 'Cookable',
			icon: CheckCheck,
			color: 'text-green-600 dark:text-green-500'
		},
		'cookable-required': {
			key: 'cookable-required',
			label: 'Cookable, no optionals',
			icon: Check,
			color: 'text-teal-600 dark:text-teal-500'
		},
		'cookable-almost': {
			key: 'cookable-almost',
			label: 'Cookable, close quantities',
			icon: Check,
			color: 'text-teal-600 dark:text-teal-500'
		},
		'cookable-close': {
			key: 'cookable-close',
			label: 'Cookable, 2 close subs.',
			icon: EqualApproximately,
			color: 'text-emerald-600 dark:text-emerald-500'
		},
		'cookable-far': {
			key: 'cookable-far',
			label: 'Cookable, 2 far subs.',
			icon: EqualApproximately,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		'cookable-enough': {
			key: 'cookable-enough',
			label: 'Enough for 2 servings',
			icon: Scale,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		'change-of-plans': {
			key: 'change-of-plans',
			label: 'Change of plans',
			icon: Repeat,
			color: 'text-amber-600 dark:text-amber-500'
		},
		missing: {
			key: 'missing',
			label: 'Missing ingredients',
			icon: ShoppingBasket,
			color: 'text-red-600 dark:text-red-500'
		},
		unknown: {
			key: 'unknown',
			label: 'Unknown',
			icon: CircleQuestionMark,
			color: 'text-gray-600 dark:text-gray-500'
		}
	} as const;

	export type CookableStatusKey = (typeof statuses)[keyof typeof statuses]['key'];

	export const statusKeys: CookableStatusKey[] = Object.keys(statuses) as CookableStatusKey[];
</script>

<script lang="ts">
	import {
		formatIngredientDisplayName,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import {
		Check,
		CheckCheck,
		CircleQuestionMark,
		EqualApproximately,
		Repeat,
		Scale,
		ShoppingBasket
	} from '@lucide/svelte';

	type Props = {
		status?: CookableStatusKey | null;
		ingredients?: ShoppingIngredient[];
	};

	const { status: statusKey = null, ingredients = [] }: Props = $props();

	function formatMissingIngredients(ingredients: ShoppingIngredient[]) {
		if (!ingredients || ingredients.length === 0) return 'Missing ingredients';

		const names = ingredients.map((si) => formatIngredientDisplayName(si));
		if (names.length === 0) return 'Missing ingredients';

		const visible = names.slice(0, 3);
		const remaining = names.length - visible.length;

		return visible.join(', ') + (remaining > 0 ? ` +${remaining}` : '');
	}

	const status = $derived(statuses[statusKey || 'unknown']);
	const missingLabel = $derived(formatMissingIngredients(ingredients));
</script>

<div class="text-xs flex items-center {status.color}">
	<status.icon class="size-3.5 min-w-3.5 inline-block mr-1" />

	<span class="line-clamp-1 text-left">
		{#if statusKey === ('missing' as CookableStatusKey)}
			{missingLabel}
		{:else}
			{status.label}
		{/if}
	</span>
</div>
