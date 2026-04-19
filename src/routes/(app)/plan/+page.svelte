<script lang="ts">
	import SearchShoppingItemBar from '$lib/shared/components/SearchShoppingItemBar.svelte';
	import PlanList from '../../../lib/features/plans/components/PlanList.svelte';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Meal Plan</h2>
			<p class="text-muted-foreground">Here's your plan. Add meals to get started.</p>
		</div>
	</div>

	<!-- <SearchShoppingItemBar class="md:hidden" /> -->

	<SeparatorZigZag />

	<!-- <Dial subtitle="Pears" min={0} max={12} step={0.25} initial={1} value={1} /> -->

	<PlanList displayMode="plan" />
</div>
