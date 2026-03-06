<script lang="ts">
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/shared/components/ui/carousel/context.js';
	import RecipeCard from '$lib/features/recipes/components/RecipeCard.svelte';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';

	const { recipes }: { recipes: Recipe[] } = $props();

	// Check if we're in loading state
	const isLoading = $derived(recipes.length === 0);

	// Page size based on screen size
	const media = useMedia();
	const itemsPerPage = $derived.by(() => {
		if (media['2xl']) return 5;
		if (media.xl) return 5;
		if (media.lg) return 4;
		if (media.md) return 3;
		return 2;
	});

	// Rows per page based on screen size
	const rowsPerPage = $derived.by(() => {
		if (media['2xl']) return 2;
		if (media.xl) return 2;
		if (media.lg) return 2;
		if (media.md) return 2;
		return 2;
	});

	// Total items per carousel page
	const itemsPerCarouselPage = $derived(itemsPerPage * rowsPerPage);

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

	// Chunk into pages to render exactly rowsPerPage x itemsPerPage per slide
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
	const totalSlides = $derived(api ? api.scrollSnapList().length : 0);
	let currentSlide = $state(0);

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

<Carousel.Root
	opts={{
		active: recipes.length > itemsPerCarouselPage && !isLoading,
		slidesToScroll: 1
	}}
	setApi={(emblaApi) => (api = emblaApi)}
	class="w-full overflow-x-hidden"
>
	<Carousel.Content class="w-full">
		{#each pages as page, i (i)}
			<Carousel.Item class="">
				<div
					class="grid gap-4"
					style={`grid-template-columns: repeat(${itemsPerPage}, minmax(0, 1fr)); grid-template-rows: repeat(${rowsPerPage}, auto);`}
				>
					{#each page as recipe, idx (recipe?.id ?? `skeleton-${idx}`)}
						<RecipeCard {recipe} showAddToPlanButton class="" />
					{/each}
				</div>
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

<!-- <div class="text-muted-foreground py-2 text-center text-sm">
	Slide {currentSlide} of {totalSlides}, showing {displayRecipes.length} of {recipes.length} recipes
	({itemsPerPage} per row, {rowsPerPage} rows per page)
</div> -->
