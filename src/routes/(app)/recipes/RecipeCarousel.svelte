<script lang="ts">
	import RecipeCarouselCard from '$lib/features/recipes/components/RecipeCarouselCard.svelte';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import type { CarouselAPI } from '$lib/shared/components/ui/carousel/context.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { ArrowRight } from '@lucide/svelte';

	type Props = { recipes: Recipe[]; expand?: boolean; showSeeAll?: boolean; onSeeAll?: Function };
	const { recipes, expand = false, showSeeAll = true, onSeeAll = undefined }: Props = $props();

	// Check if we're in loading state
	const isLoading = $derived(recipes.length === 0);

	// Page size based on screen size
	const media = useMedia();
	const columnsPerPage = $derived.by(() => {
		if (media['2xl']) return 6;
		if (media.xl) return 5;
		if (media.lg) return 4;
		if (media.md) return 3;
		return 2;
	});

	// Rows per page based on screen size
	const rowsPerPage = $derived.by(() => {
		if (media['2xl']) return 3;
		if (media.xl) return 3;
		if (media.lg) return 2;
		if (media.md) return 2;
		return 2;
	});

	// Total items per carousel page
	const itemsPerCarouselPage = $derived(columnsPerPage * rowsPerPage);

	// Display only full pages of recipes (up to 4 pages)
	const displayRecipes = $derived(
		recipes.slice(
			0,
			Math.min(
				itemsPerCarouselPage * 4,
				Math.max(
					itemsPerCarouselPage,
					Math.floor(recipes.length / itemsPerCarouselPage) * itemsPerCarouselPage
				)
			)
		)
	);

	// Chunk into pages to render exactly rowsPerPage x columnsPerPage per slide
	const pages = $derived.by(() => {
		// If loading, create skeleton pages
		if (isLoading) {
			const skeletonPage: Recipe[] = Array(itemsPerCarouselPage).fill(undefined);
			return [skeletonPage];
		}

		const size = itemsPerCarouselPage;
		const res: Recipe[][] = [];
		for (let i = 0; i < displayRecipes.length; i += size) {
			res.push(displayRecipes.slice(i, i + size));
		}
		return res;
	});

	// Carousel state
	let api = $state<CarouselAPI>();
	let currentSlide = $state(0);
	const totalSlides = $derived(api?.scrollSnapList().length || 0);

	// Sync this component with the carousel API
	$effect(() => {
		if (api) {
			currentSlide = api.selectedScrollSnap() + 1;
			api.on('select', () => {
				currentSlide = api!.selectedScrollSnap() + 1;
			});
		}
	});
</script>

{#if isLoading || (!expand && recipes.length > itemsPerCarouselPage)}
	<Carousel.Root
		opts={{
			active: recipes.length > itemsPerCarouselPage && !isLoading && !expand,
			slidesToScroll: 1
		}}
		setApi={(emblaApi) => (api = emblaApi)}
		class="w-full overflow-x-hidden"
	>
		<Carousel.Content>
			{#each pages as page, i (i)}
				<Carousel.Item class="w-full">
					{@render recipeGrid(page, i === pages.length - 1)}
				</Carousel.Item>
			{/each}
		</Carousel.Content>

		{#if currentSlide > 1 && !isLoading}
			<Carousel.Previous class="left-8 -translate-y-10" />
		{/if}
		{#if currentSlide < totalSlides && !isLoading}
			<Carousel.Next class="right-8 -translate-y-10" />
		{/if}
	</Carousel.Root>
{:else}
	{@render recipeGrid(displayRecipes)}
{/if}

{#snippet recipeGrid(recipes: Recipe[], lastPage = false)}
	<div
		class="grid gap-3"
		style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); margin-top: 1rem;"
	>
		{#each recipes as recipe, idx (recipe?.id ?? `skeleton-${idx}`)}
			{#if showSeeAll && !expand && lastPage && idx === recipes.length - 1 && recipes.length > displayRecipes.length}
				<button
					onclick={() => onSeeAll?.()}
					class="flex aspect-4/3 mb-auto w-full flex-col justify-center rounded-xl bg-accent p-4 text-left transition-colors hover:bg-muted/90"
				>
					<div
						class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80"
					>
						<ArrowRight class="size-5 text-muted-foreground transition-transform" />
					</div>
					<p class="text-sm font-medium">See all</p>
					<p class="text-sm text-muted-foreground">Add new filter</p>
				</button>
			{:else}
				<RecipeCarouselCard {recipe} showAddToPlanButton />
			{/if}

			<!-- <div
				class="grid space-y-1 p-2 mb-4 rounded-2xl bg-gradient-to-br from-amber-200/60 to-amber-200 dark:from-amber-900/90 dark:to-amber-900 group"
			>
				<div class="bg-background rounded-2xl shadow-md p-2 pb-0">
					<RecipeCarouselCard {recipe} showAddToPlanButton />
				</div>
				<div
					class="p-2 pb-1 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
				>
					<BellRing class="size-4" />
					<span><strong>2</strong> ingredients expire!</span>

					<Star class="size-4" />
					<span class="">You love this recipe!</span> 

					<Button
						size="icon"
						variant="ghost"
						class="ml-auto w-6 h-6 text-amber-700 dark:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100 dark:hover:bg-amber-800"
					>
						<FunnelPlus class="size-4" />
					</Button>
				</div>
			</div> -->
		{/each}
	</div>
{/snippet}

<!-- <div class="text-muted-foreground py-2 text-center text-sm">
	Slide {currentSlide} of {totalSlides}, showing {displayRecipes.length} of {recipes.length} recipes
	({columnsPerPage} per row, {rowsPerPage} rows per page)
</div> -->
