<script lang="ts">
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { CalendarPlus, CheckCheck } from 'lucide-svelte';
	import { type RecipeDoc } from '$lib/features/recipes/db/recipe-doc';
	import { cn } from '$lib/utils';

	interface Props {
		recipeId: string;
		recipeDoc: RecipeDoc;
		class?: string;
	}

	let { recipeId, recipeDoc, class: className = '' }: Props = $props();
</script>

{#if recipeDoc}
	<div
		class={cn(
			'w-52 group flex flex-col items-start bg-white dark:bg-muted rounded-md border shadow-sm hover:shadow-lg transition-shadow',
			className
		)}
	>
		{#if recipeDoc.imageUrls && recipeDoc.imageUrls.length > 0}
			<a href={'/recipes/' + recipeId} class="relative">
				<img
					src={recipeDoc.imageUrls[0]}
					alt="Recipe"
					class="aspect-[1.618] rounded-md object-cover"
				/>

				<!-- <UserAvatar profile={recipeDoc.author.profile} class="absolute bottom-2 right-2 size-5" /> -->

				{#if recipeDoc.source && recipeDoc.source.name != 'Cuicuit'}
					<div
						class="absolute top-2 right-2 text-xs rounded-full bg-black/60 text-white py-0.5 px-1.5"
					>
						{recipeDoc.source.name}
					</div>
				{/if}

				<!-- <CardBookmark class="absolute -top-[12px] right-[8px] size-10" /> -->
			</a>
		{:else}
			<div class="w-full aspect-[1.618] bg-gray-200 rounded-md"></div>
		{/if}
		<div class="flex items-center gap-2 p-2 w-full h-full">
			<a class="grid w-full" href={'/recipes/edit/' + recipeId}>
				<h3 class="text-sm font-semibold line-clamp-1">{recipeDoc.title}</h3>
				<!-- <div class="text-xs text-muted-foreground flex items-center">
					<span class="mr-4">{recipeDoc.time.total}min</span>

					<span>{recipeDoc.servings}</span>
					<Users class="size-3 inline-block ml-0.5 mr-4" />

					<span class="mr-4">{recipeCuisines[recipeDoc.cuisine]}</span>
				</div> -->
				<div class="text-xs flex items-center text-green-600 dark:text-green-500">
					<CheckCheck class="size-3.5 inline-block mr-1" />
					<span>Ready to cook</span>
				</div>
				<!-- <div class="text-xs flex items-center text-teal-600 dark:text-teal-500">
					<Check class="size-3.5 inline-block mr-1" />
					<span>Required ingredients only</span>
				</div> -->
				<!-- <div class="text-xs flex items-center text-emerald-600 dark:text-emerald-500">
					<Check class="size-3.5 inline-block mr-1" />
					<span>2 substitutions</span>
				</div> -->
				<!-- <div class="text-xs flex items-center text-yellow-600 dark:text-yellow-500">
					<Repeat class="size-3.5 inline-block mr-1" />
					<span>Change of plans</span>
				</div> -->
				<!-- <div class="text-xs flex items-center text-red-600 dark:text-red-500">
					<ShoppingBasket class="size-3.5 inline-block mr-1" />
					<span>1 missing</span>
				</div> -->
			</a>
			<ButtonThemed
				class="min-w-7 h-7 mr-2 hidden group-hover:flex"
				title="Add to plan"
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
