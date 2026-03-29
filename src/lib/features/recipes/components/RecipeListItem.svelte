<script lang="ts">
	import { cn } from '$lib/utils';
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import type { Recipe } from '../queries/get-recipe-detailed';
	import { Users } from 'lucide-svelte';
	import RecipeImage from './RecipeImage.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		recipe?: Recipe | null; // null for loading state
		showServings?: boolean; // Whether to show servings count in collapsed view
		endSnippet?: Snippet | null; // Optional snippet to render at the end of the item (e.g. for actions)
		class?: string;
		[key: string]: any; // Allow additional props (e.g. on:click)
	}

	let {
		recipe = null,
		showServings = true,
		endSnippet = null,
		class: className = '',
		...others
	}: Props = $props();
</script>

{#if recipe}
	<button
		class={cn(
			'flex z-10 w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-md shadow-2xs relative group transition-all',
			className
		)}
		{...others}
	>
		<RecipeImage {recipe} />

		<div class="grid">
			<h3 class={cn('text-xs text-start font-semibold leading-tight mb-0.5 line-clamp-1')}>
				{recipe.title}
			</h3>

			<CookableStatus />
		</div>

		{#if showServings}
			<div class="flex gap-1 items-center text-xs font-semibold ml-auto shrink-0">
				<div class="flex items-center gap-1">
					<span>{recipe.servings}</span>
					<Users class="size-3 inline-block" />
				</div>
			</div>
		{:else if endSnippet}
			{@render endSnippet()}
		{/if}
	</button>
{:else}
	<div
		class={cn(
			'flex items-center p-2 space-x-2 bg-white dark:bg-muted rounded-md shadow-2xs animate-pulse',
			className
		)}
	>
		<div class="aspect-square size-11 rounded-md bg-gray-200"></div>
		<div class="grid flex-1 w-full">
			<div class="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
			<div class="h-3 bg-gray-200 rounded w-1/2"></div>
		</div>
	</div>
{/if}
