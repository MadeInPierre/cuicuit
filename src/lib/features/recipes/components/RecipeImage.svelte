<script lang="ts">
	import { cn } from '$lib/utils';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import type { Recipe } from '../queries/get-recipe-detailed';

	interface Props {
		recipe?: Recipe | null; // null for loading state
		class?: string;
	}

	let { recipe = null, class: className = '' }: Props = $props();

	let error = $state(false);
</script>

{#if error}
	<div class={cn('aspect-square size-11 bg-gray-200 rounded-md', className)}></div>
{:else if recipe && recipe.image_ids && recipe.image_ids.length > 0}
	<!-- use:dragHandle -->
	<img
		src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`}
		alt="Recipe"
		class={cn('aspect-square size-11 rounded-md object-cover', className)}
		onerror={(e) => {
			if (!error && recipe.image_ids && recipe.image_ids[0]) {
				(e.currentTarget as HTMLImageElement).src =
					`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`;
				error = true;
			}
		}}
	/>
{/if}
