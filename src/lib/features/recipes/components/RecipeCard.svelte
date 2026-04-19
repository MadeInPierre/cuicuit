<script lang="ts">
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import { cn } from '$lib/utils';
	import { Users } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { Recipe } from '../queries/get-recipe-detailed';
	import RecipeImage from './RecipeImage.svelte';

	interface Props {
		recipe?: Recipe | null; // null for loading state
		servings?: number | boolean; // If number, show servings. If false, don't show. If true, show if servings exist on recipe.
		endSnippet?: Snippet | null; // Optional snippet to render at the end of the item (e.g. for actions)
		size?: 'md' | 'lg';
		class?: string;
		[key: string]: any; // Allow additional props (e.g. on:click)
	}

	let {
		recipe = null,
		servings = recipe?.servings ?? false,
		endSnippet = null,
		size = 'md',
		class: className = '',
		...others
	}: Props = $props();
</script>

{#if recipe}
	<button
		class={cn(
			'relative z-10 flex w-full items-center rounded-md bg-white p-2 shadow-2xs transition-all group dark:bg-muted gap-2',
			size == 'lg' && 'rounded-lg gap-3 p-1.5 pr-4',
			className
		)}
		{...others}
	>
		<RecipeImage {recipe} class={size == 'lg' ? 'size-16' : 'size-11'} />

		<div class="grid mr-auto">
			<h3
				class={cn(
					'mb-0.5 line-clamp-1 text-start text-xs font-semibold leading-tight',
					size == 'lg' && 'mb-1 text-sm'
				)}
			>
				{recipe.title}
			</h3>

			<CookableStatus />
		</div>

		{#if endSnippet !== null}
			{@render endSnippet()}
		{:else if servings}
			<div
				class={cn(
					'flex shrink-0 items-center gap-1 text-xs font-semibold',
					size == 'lg' && 'gap-1.5 text-sm'
				)}
			>
				<div class="flex items-center gap-1">
					<span>{servings}</span>
					<Users class={cn('inline-block size-3', size == 'lg' && 'size-4')} />
				</div>
			</div>
		{/if}
	</button>
{:else}
	<div
		class={cn(
			'flex items-center rounded-md bg-white p-2 shadow-2xs animate-pulse dark:bg-muted space-x-2',
			size == 'lg' && 'rounded-lg p-3 space-x-3',
			className
		)}
	>
		<div
			class={cn(
				'aspect-square size-11 rounded-md bg-gray-200',
				size == 'lg' && 'size-12 rounded-lg'
			)}
		></div>
		<div class="grid w-full flex-1">
			<div class={cn('mb-1 h-3 w-3/4 rounded bg-gray-200', size == 'lg' && 'h-4')}></div>
			<div class={cn('h-3 w-1/2 rounded bg-gray-200', size == 'lg' && 'h-4')}></div>
		</div>
	</div>
{/if}
