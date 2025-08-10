<script lang="ts">
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import {
		CalendarPlus,
		Check,
		CheckCheck,
		EqualApproximately,
		Repeat,
		Scale,
		ShoppingBasket,
		Users
	} from 'lucide-svelte';
	import { capitalize, cn } from '$lib/utils';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';

	interface Props {
		recipe?: Tables<'recipes'> | null; // Allow recipe to be null for loading state
		class?: string;
	}

	let { recipe = null, class: className = '' }: Props = $props();
</script>

{#if recipe}
	<div
		class={cn(
			'w-52 group flex flex-col items-start bg-white dark:bg-muted rounded-md border shadow-sm hover:shadow-lg transition-shadow',
			className
		)}
	>
		{#if recipe.image_ids && recipe.image_ids.length > 0}
			<a href={'/recipes/' + recipe.id} class="relative">
				<img
					src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`}
					alt="Recipe"
					class="aspect-[1.618] rounded-md object-cover"
				/>

				<!-- <UserAvatar profile={recipe.author.profile} class="absolute bottom-2 right-2 size-5" /> -->

				{#if recipe.source_type === 'website'}
					<div
						class="absolute top-2 right-2 text-xs rounded-full bg-black/60 text-white py-0.5 px-1.5"
					>
						{recipe.source_type}
					</div>
				{/if}

				<!-- <CardBookmark class="absolute -top-[12px] right-[8px] size-10" /> -->
			</a>
		{:else}
			<div class="w-full aspect-[1.618] bg-gray-200 rounded-md"></div>
		{/if}
		<div class="flex items-center gap-2 p-2 w-full h-full">
			<a class="grid w-full" href={'/recipes/' + recipe.id}>
				<h3 class="text-sm font-semibold line-clamp-1">{recipe.title}</h3>

				<div class="text-xs text-muted-foreground flex items-center">
					<span class="mr-4">{recipe.time_total_minutes}min</span>

					<span class="mr-4">{capitalize(recipe.effort_level)}</span>

					<span>{recipe.servings}</span>
					<Users class="size-3 inline-block ml-0.5 mr-4" />
				</div>

				{#snippet status(status: string, Icon: any, color: string)}
					<div class="text-xs flex items-center {color}">
						<Icon class="size-3.5 inline-block mr-1" />
						<span>{status}</span>
						<!-- <Apple class="size-3.5 inline-block ml-auto text-muted-foreground" />
						<span class="ml-1 text-xs text-muted-foreground"> 4/5 </span> -->
					</div>
				{/snippet}

				{@render status('Ready to cook', CheckCheck, 'text-green-600 dark:text-green-500')}
				<!-- {@render status('Ready, required only', Check, 'text-teal-600 dark:text-teal-500')}
				{@render status(
					'Ready, 2 substitutions',
					EqualApproximately,
					'text-emerald-600 dark:text-emerald-500'
				)}
				{@render status('Ready, change of plans', Repeat, 'text-yellow-600 dark:text-yellow-500')}
				{@render status('Not enough', Scale, 'text-amber-600 dark:text-amber-500')}
				{@render status('1 missing', ShoppingBasket, 'text-red-600 dark:text-red-500')} -->
			</a>

			<ButtonThemed
				class="min-w-7 h-7 mr-2 hidden group-hover:flex"
				title="Add to plan"
				size="icon"
				type="outline"
				aria-label="Add to plan"
				onclick={() => {
					console.log('Add to plan', recipe.id);
				}}
			>
				<CalendarPlus class="size-4" />
			</ButtonThemed>
		</div>
	</div>
{:else}
	<div
		class={cn(
			'w-52 group flex flex-col items-start bg-white dark:bg-muted rounded-md border shadow-sm transition-shadow',
			className
		)}
	>
		<div class="w-full aspect-[1.618] bg-gray-200 rounded-md animate-pulse"></div>
		<div class="flex items-center gap-2 p-2 w-full h-full">
			<div class="grid w-full">
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
				<div class="flex items-center text-xs text-muted-foreground">
					<span class="mr-4 h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
					<span class="mr-4 h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
					<span class="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
					<span
						class="size-3 inline-block ml-0.5 mr-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
					></span>
				</div>
				<div class="flex flex-col gap-1 mt-2">
					<div class="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
				</div>
			</div>
			<div class="min-w-7 h-7 mr-2 hidden group-hover:flex">
				<div class="size-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
			</div>
		</div>
	</div>
{/if}
