<script lang="ts">
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { CalendarPlus } from 'lucide-svelte';
	import { recipeTimesOfDay, type RecipeDoc } from '$lib/features/recipes/db/recipe-doc';
	import CardBookmark from '$lib/shared/icons/card-bookmark.svelte';

	interface Props {
		recipeId: string;
		recipeDoc: RecipeDoc;
	}

	let { recipeId, recipeDoc }: Props = $props();
</script>

{#if recipeDoc}
	<div
		class="flex flex-col items-start bg-white rounded-md border shadow-sm hover:shadow-lg transition-shadow"
	>
		{#if recipeDoc.imageUrls && recipeDoc.imageUrls.length > 0}
			<a href={'/recipes/edit/' + recipeId} class="relative">
				<img
					src={recipeDoc.imageUrls[0]}
					alt="Recipe"
					class="aspect-[1.618] rounded-md object-cover"
				/>

				<!-- <UserAvatar profile={recipeDoc.author.profile} class="absolute bottom-2 right-2 size-5" /> -->

				<CardBookmark class="absolute -top-[12px] right-[8px] size-10" />
			</a>
		{:else}
			<div class="w-full aspect-[1.618] bg-gray-200 rounded-md"></div>
		{/if}
		<div class="flex items-center gap-2 p-2 w-full h-full">
			<a class="grid w-full" href={'/recipes/edit/' + recipeId}>
				<h3 class="text-sm font-semibold line-clamp-1">{recipeDoc.title}</h3>
				<p class="text-xs text-muted-foreground flex items-center">
					<span class="mr-4">{recipeTimesOfDay[recipeDoc.timeOfDay]}</span>

					<!-- <span>{recipe.doc.servings}</span>
					<Users class="size-3 inline-block ml-0.5" /> -->
				</p>
			</a>
			<ButtonThemed
				class="rounded-full size-7 min-w-7 mr-2"
				size="icon"
				type="outline"
				aria-label="Add to plan"
				onclick={() => {
					console.log('Add to plan', recipeId);
				}}
			>
				<CalendarPlus class="size-4" />
			</ButtonThemed>
		</div>
	</div>
{/if}
