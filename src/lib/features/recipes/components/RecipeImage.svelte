<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { cn, youtubeUrlToThumbnailUrl } from '$lib/utils';
	import type { Recipe } from '../queries/get-recipe-detailed';

	interface Props {
		recipe?: Recipe | null; // null for loading state
		class?: string;
	}

	let { recipe = null, class: className = '' }: Props = $props();

	let error = $state(false);
	let triedFallbackUrl = $state(false);
</script>

{#if recipe && recipe.image_ids && recipe.image_ids.length > 0}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<img
		src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`}
		alt="Recipe"
		class={cn('size-11 rounded-md object-cover cursor-pointer', className)}
		onclick={(e) => {
			// Prevent clicks on the image from propagating to parent elements (e.g. RecipeCard)
			e.stopPropagation();

			// If we're already on the recipe page, go back instead of pushing a new entry to the history stack
			if (page.url.pathname === `/recipes/${recipe.id}`) history.back();
			else goto(`/recipes/${recipe.id}`);
		}}
		onerror={(e) => {
			if (!triedFallbackUrl && recipe.image_ids && recipe.image_ids[0]) {
				(e.currentTarget as HTMLImageElement).src =
					`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`;
				triedFallbackUrl = true;
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
	{:else}
		<div class={cn('aspect-square size-11 bg-gray-200 rounded-md', className)}></div>
	{/if}
{/if}
