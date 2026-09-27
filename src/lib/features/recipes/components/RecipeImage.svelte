<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import {
		getRecipeImageUrl,
		type RecipeImageVariant
	} from '$lib/core/operations/recipes/image-shared.js';
	import { cn, youtubeUrlToThumbnailUrl } from '$lib/utils';
	import { ChefHat } from '@lucide/svelte';
	import type {
		Recipe,
		RecipeIngredientDetailed,
		RecipeSummary,
		RecipeSummaryIngredient
	} from '../queries/get-recipe-detailed';
	import IngredientImage from './IngredientImage.svelte';

	interface Props {
		recipe?: Recipe | RecipeSummary | null; // null for loading state
		ingredients?: RecipeIngredientDetailed[] | RecipeSummaryIngredient[] | null; // Used for the no-image fallback
		variant?: RecipeImageVariant; // 'thumb' (480px WebP, cards/lists) or 'full' (detail page)
		class?: string;
	}

	let {
		recipe = null,
		ingredients = null,
		variant = 'thumb',
		class: className = ''
	}: Props = $props();

	let error = $state(false);
	let fellBackToFull = $state(false);

	// The {#key} below resets the <img> element, but not this state: reset it
	// whenever the image changes so one missing thumbnail doesn't pin the
	// next recipe to full resolution.
	$effect(() => {
		void recipe?.id;
		void recipe?.image_ids?.[0];
		void variant;
		fellBackToFull = false;
		error = false;
	});

	let firstImageId = $derived(recipe?.image_ids?.find((id): id is string => !!id) ?? null);

	const displayIngredients = $derived(
		(ingredients || [])
			.filter((i) => !i.is_optional && (i.ingredient?.id || i.custom_name))
			.sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
			.slice(0, 6)
	);

	const ingredientName = (ing: RecipeIngredientDetailed | RecipeSummaryIngredient) =>
		ing.ingredient?.translations?.[0]?.name_singular ||
		ing.ingredient?.translations?.[0]?.name_plural ||
		ing.custom_name;
</script>

{#if recipe && firstImageId}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<img
		src={getRecipeImageUrl(
			PUBLIC_SUPABASE_URL,
			// `?? ''` only satisfies the type checker (postgrest infers
			// nullable ids); the {#if} above guarantees non-null at runtime.
			recipe.id ?? '',
			// Guaranteed non-null by the {#if} above (`?? ''` is only for the type checker,
			// which doesn't narrow $derived bindings in templates).
			firstImageId ?? '',
			fellBackToFull ? 'full' : variant
		)}
		alt="Recipe"
		crossorigin="anonymous"
		loading={variant === 'thumb' ? 'lazy' : 'eager'}
		decoding="async"
		class={cn('size-11 aspect-square rounded-md object-cover cursor-pointer', className)}
		onclick={(e) => {
			// Prevent clicks on the image from propagating to parent elements (e.g. RecipeCard)
			e.stopPropagation();

			// If we're already on the recipe page, go back instead of pushing a new entry to the history stack
			if (page.url.pathname === `/recipes/${recipe.id}`) history.back();
			else goto(`/recipes/${recipe.id}`);
		}}
		onerror={(e) => {
			// No thumbnail yet (legacy images, failed resize)? Fall back to
			// the full-resolution image once before giving up.
			if (variant === 'thumb' && !fellBackToFull && recipe && firstImageId) {
				fellBackToFull = true;
				(e.currentTarget as HTMLImageElement).src = getRecipeImageUrl(
					PUBLIC_SUPABASE_URL,
					recipe.id ?? '',
					firstImageId ?? '',
					'full'
				);
			} else {
				error = true;
			}
		}}
	/>
{:else if error || recipe?.image_ids?.length === 0}
	{#if recipe?.source_url?.includes('youtu')}
		<img
			src={youtubeUrlToThumbnailUrl(recipe.source_url)}
			class={cn('w-full aspect-[1.618] object-cover rounded-md cursor-pointer', className)}
			alt="Youtube Thumbnail"
		/>
	{:else if displayIngredients.length > 0}
		<div
			class={cn(
				'bg-white rounded-md grid space-x-2 p-2 place-content-center justify-items-center',
				displayIngredients.length >= 5 && 'grid-cols-3',
				displayIngredients.length == 4 && 'grid-cols-4',
				displayIngredients.length == 3 && 'grid-cols-3',
				displayIngredients.length == 2 && 'grid-cols-2',
				className
			)}
		>
			{#each displayIngredients as ing (ing.id)}
				<IngredientImage
					id={ing.ingredient?.id ?? null}
					name={ingredientName(ing)}
					class="rounded-none max-w-14"
				/>
			{/each}
		</div>
	{:else}
		<div
			class={cn(
				'aspect-square size-11 bg-muted rounded-md flex items-center justify-center',
				className
			)}
		>
			<ChefHat class="w-1/4 min-w-4 text-muted-foreground" />
		</div>
	{/if}
{/if}
