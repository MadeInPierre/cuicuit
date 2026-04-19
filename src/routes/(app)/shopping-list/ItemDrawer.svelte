<script lang="ts">
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { openMealCardId } from '$lib/features/plans/state/open-meal-card.svelte';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { type RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import { ScrollArea } from '$lib/shared/components/ui/scroll-area/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { X } from 'lucide-svelte';

	const media = useMedia();

	let lastSelectedIngredient = $state<RecipeIngredientWithTranslations | null>(null);
	$effect(() => {
		// Save the last selected ingredient ID when it changes
		// This limits UI jitter when opening/closing the drawer
		lastSelectedIngredient = selectedMealIngredient.value || lastSelectedIngredient;
	});
</script>

{#snippet itemHeader(ingredient: RecipeIngredientWithTranslations)}
	<div class="flex items-center gap-4 mt-2 mb-4">
		<IngredientImage id={ingredient.id} class="size-12 rounded-md" />

		<div class="grid">
			<h1 class="text-md font-semibold">
				{ingredient.translations[0]?.name_plural || ingredient.translations[0]?.name_singular}
			</h1>
			<p class="text-xs text-muted-foreground">Detailed recipes and items</p>
		</div>

		<Button
			variant="ghost"
			size="icon"
			class="ml-auto size-8"
			onclick={() => (selectedMealIngredient.value = null)}
		>
			<X class="size-4" size="icon" />
			<span class="sr-only">Close detailed view</span>
		</Button>
	</div>
{/snippet}

<Drawer.Root
	open={!media.md && !!selectedMealIngredient.value?.id}
	onOpenChange={(open) => {
		if (!open) {
			selectedMealIngredient.value = null;
			openMealCardId.value = null; // Close any expanded meal cards
		}
	}}
	handleOnly
	shouldScaleBackground={false}
>
	<Drawer.Content class="max-h-[80%]">
		<!-- <Drawer.Header>
			<Drawer.Title>Are you sure absolutely sure?</Drawer.Title>
			<Drawer.Description>This action cannot be undone.</Drawer.Description>
		</Drawer.Header> -->

		<ScrollArea class="px-4 pb-8 overflow-auto no-scrollbar">
			{#if lastSelectedIngredient}
				{@render itemHeader(lastSelectedIngredient)}

				<PlanList filterOnIngredientId={lastSelectedIngredient.id} disableAnimations />
			{/if}
		</ScrollArea>

		<!-- <Drawer.Footer>
			<Button>Submit</Button>
			<Drawer.Close>Cancel</Drawer.Close>
		</Drawer.Footer> -->
	</Drawer.Content>
</Drawer.Root>
