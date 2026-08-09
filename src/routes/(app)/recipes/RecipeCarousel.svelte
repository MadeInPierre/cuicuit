<script lang="ts">
	import RecipeCarouselCard from '$lib/features/recipes/components/RecipeCarouselCard.svelte';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import type { CarouselAPI } from '$lib/shared/components/ui/carousel/context.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import { ArrowRight } from '@lucide/svelte';
	import { chunkIntoPages, computeLayout, FALLBACK_WIDTH, MAX_PAGES } from './carousel-layout.js';

	type Props = {
		recipes: Recipe[];
		expand?: boolean;
		showSeeAll?: boolean;
		onSeeAll?: () => void;
		/** Optional explicit row count. Defaults to parent-width thresholds (2 below 768px, 3 above). */
		rows?: number;
	};
	const { recipes, expand = false, showSeeAll = true, onSeeAll, rows }: Props = $props();

	// Check if we're in loading state
	const isLoading = $derived(recipes.length === 0);

	// Measure the parent width — the single source of truth for the whole layout.
	// Falls back to FALLBACK_WIDTH before the ResizeObserver fires (SSR / first paint).
	let rootEl = $state<HTMLDivElement>();
	let containerWidth = $state(0);

	$effect(() => {
		const el = rootEl;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});
		observer.observe(el);
		containerWidth = el.getBoundingClientRect().width;
		return () => observer.disconnect();
	});

	const effectiveWidth = $derived(containerWidth > 0 ? containerWidth : FALLBACK_WIDTH);
	const layout = $derived(computeLayout(effectiveWidth, rows));
	const pageSize = $derived(layout.pageSize);

	// Chunk recipes into fixed-size pages (rows x columns). A See All card fills
	// the last cell of the last page when there are leftover recipes.
	const carousel = $derived.by(() => {
		if (isLoading) {
			const skeletonPage: (Recipe | undefined)[] = Array(pageSize).fill(undefined);
			return { pages: [skeletonPage], showSeeAll: false };
		}
		return chunkIntoPages(recipes, pageSize, MAX_PAGES, showSeeAll);
	});

	// Carousel state. Slide-count changes (e.g. parent resize changing the page
	// size) are handled by embla's built-in `watchSlides` auto re-init.
	let api = $state<CarouselAPI>();
	let currentSlide = $state(0);
	let totalSlides = $state(0);

	// Keep slide index + count in sync with the carousel API (select + reInit).
	$effect(() => {
		if (api) {
			const sync = () => {
				currentSlide = api!.selectedScrollSnap() + 1;
				totalSlides = api!.scrollSnapList().length;
			};
			sync();
			api.on('select', sync);
			api.on('reInit', sync);
			return () => {
				api!.off('select', sync);
				api!.off('reInit', sync);
			};
		}
	});
</script>

<div class="w-full" bind:this={rootEl}>
	{#if isLoading || (!expand && recipes.length > pageSize)}
		<Carousel.Root
			opts={{
				active: recipes.length > pageSize && !isLoading && !expand,
				slidesToScroll: 1
			}}
			setApi={(emblaApi) => (api = emblaApi)}
			class="w-full overflow-x-hidden"
		>
			<Carousel.Content>
				{#each carousel.pages as page, i (i)}
					<Carousel.Item class="w-full">
						{@render recipeGrid(page, i === carousel.pages.length - 1 && carousel.showSeeAll)}
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
		{@render recipeGrid(recipes)}
	{/if}

	{#snippet recipeGrid(recipes: (Recipe | undefined)[], showSeeAllButton = false)}
		<div
			class="grid gap-3"
			style="display: grid; grid-template-columns: repeat({layout.columns}, minmax(0, 1fr)); margin-top: 1rem;"
		>
			{#each recipes as recipe, idx (recipe?.id ?? `cell-${idx}`)}
				<RecipeCarouselCard {recipe} showAddToPlanButton />
			{/each}

			{#if showSeeAllButton}
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
			{/if}
		</div>
	{/snippet}
</div>
