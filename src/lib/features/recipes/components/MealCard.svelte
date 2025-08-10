<script lang="ts">
	import { CheckCheck, Minus, Plus, Users } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { Button } from '$lib/shared/components/ui/button';
	import { slide } from 'svelte/transition';

	interface Props {
		meal?: { recipe: Tables<'recipes'>; servings: number } | null; // Allow recipe to be null for loading state
		class?: string;
	}

	let { meal = null, class: className = '' }: Props = $props();

	let expanded = $state(false);
</script>

{#if meal}
	<div class="grid w-full">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class={cn(
				'flex w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-sm border relative group',
				className
			)}
			onclick={() => (expanded = !expanded)}
		>
			<a href={'/recipes/' + meal.recipe.id} class="flex-shrink-0">
				{#if meal.recipe.image_ids && meal.recipe.image_ids.length > 0}
					<img
						src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${meal.recipe.id}/${meal.recipe.image_ids[0]}`}
						alt="Recipe"
						class="aspect-square size-10 rounded-md object-cover border"
					/>
				{:else}
					<div class="aspect-square size-10 bg-gray-200 rounded-md"></div>
				{/if}
			</a>

			<div class="grid flex-1 min-w-0">
				<h3 class="text-xs text-primary font-semibold leading-tight mb-0.5 line-clamp-1">
					{meal.recipe.title}
				</h3>

				<div class="flex items-center gap-1">
					{#snippet status(status: string, Icon: any, color: string)}
						<div class="text-xs flex items-center {color}">
							<Icon class="size-3.5 inline-block mr-1" />
							<span>{status}</span>
						</div>
					{/snippet}

					{@render status('Ready to cook', CheckCheck, 'text-green-600 dark:text-green-500')}
				</div>
			</div>

			<div class="flex gap-1 items-center text-xs font-semibold ml-auto flex-shrink-0 relative">
				<Button
					class="absolute -top-5 -translate-y-1/2 rounded-full size-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
					variant="outline"
					size="icon"
				>
					<Plus class="size-4" />
				</Button>

				<div class="flex items-center gap-1">
					<span>{meal.servings}</span>
					<Users class="size-3 inline-block" />
				</div>

				<Button
					class="absolute -bottom-5 translate-y-1/2 rounded-full size-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
					variant="outline"
					size="icon"
				>
					<Minus class="size-4" />
				</Button>
			</div>
		</div>

		{#if expanded}
			<div
				class="w-full bg-muted rounded-b-sm px-4 -translate-y-1 -z-10 pt-3 pb-2 border"
				transition:slide
			>
				<span class="text-xs text-muted-foreground line-clamp-3">{meal.recipe.description}</span>
			</div>
		{/if}
	</div>
{/if}
