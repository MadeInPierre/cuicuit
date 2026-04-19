<script lang="ts">
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import { ScrollArea } from '$lib/shared/components/ui/scroll-area/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';

	const media = useMedia();

	let lastSelectedIngredientId = $state<string | null>(null);
	$effect(() => {
		// Save the last selected ingredient ID when it changes
		// This limits UI jitter when opening/closing the drawer
		lastSelectedIngredientId = selectedMealIngredient.value?.id || lastSelectedIngredientId;
	});
</script>

<Drawer.Root
	open={!media.md && !!selectedMealIngredient.value?.id}
	onOpenChange={(open) => {
		if (!open) selectedMealIngredient.value = null;
	}}
	disablePreventScroll
	shouldScaleBackground={false}
>
	<Drawer.Content class="max-h-[80%]">
		<!-- <Drawer.Header>
			<Drawer.Title>Are you sure absolutely sure?</Drawer.Title>
			<Drawer.Description>This action cannot be undone.</Drawer.Description>
		</Drawer.Header> -->

		<ScrollArea class="px-4 py-8 overflow-auto no-scrollbar">
			<PlanList filterOnIngredientId={lastSelectedIngredientId} />
		</ScrollArea>

		<!-- <Drawer.Footer>
			<Button>Submit</Button>
			<Drawer.Close>Cancel</Drawer.Close>
		</Drawer.Footer> -->
	</Drawer.Content>
</Drawer.Root>
