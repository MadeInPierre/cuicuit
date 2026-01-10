<script lang="ts">
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/shared/components/ui/carousel/context.js';
	import RecipeCard from '$lib/features/recipes/components/RecipeCard.svelte';
	import type { RecipeDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';

	const { recipes }: { recipes: RecipeDetailed[] } = $props();

	let api = $state<CarouselAPI>();

	const itemsPerPage = 6;
	const totalItems = recipes.length;

	const totalSlides = $derived(api ? api.scrollSnapList().length : 0);
	let currentSlide = $state(0);

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
		slidesToScroll: itemsPerPage
	}}
	setApi={(emblaApi) => (api = emblaApi)}
	class="mt-4 w-full overflow-x-hidden"
>
	<Carousel.Content class="w-full">
		{#each recipes as recipe (recipe.id)}
			<Carousel.Item class="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6 my-1">
				<RecipeCard {recipe} showAddToPlanButton class="" />
			</Carousel.Item>
		{/each}
	</Carousel.Content>

	{#if currentSlide > 1}
		<Carousel.Previous class="left-8 -translate-y-10" />
	{/if}
	{#if currentSlide < totalSlides}
		<Carousel.Next class="right-8 -translate-y-10" />
	{/if}
</Carousel.Root>

<!-- <div class="text-muted-foreground py-2 text-center text-sm">
	Slide {currentSlide} of {totalSlides}
</div> -->
