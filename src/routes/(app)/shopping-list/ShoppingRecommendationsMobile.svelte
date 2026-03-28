<script lang="ts">
	import { Ellipsis, Lightbulb } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { slide } from 'svelte/transition';
	import { type ShoppingRecommendation } from '$lib/features/spaces/queries/get-shopping-recommendations';
	import ShoppingRecommendationsList from './ShoppingRecommendationsList.svelte';

	type Props = {
		recommendations: ShoppingRecommendation[];
		total: number;
		onShuffle: (currentRecommendations: ShoppingRecommendation[]) => void;
		loading: boolean;
	};
	let { recommendations, total, onShuffle, loading }: Props = $props();
</script>

{#if recommendations.length > 0 && !loading}
	<div class="relative xl:hidden overflow-hidden" transition:slide={{ axis: 'y', duration: 200 }}>
		<div
			class="h-8 w-full flex items-center gap-2 pr-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
		>
			<span class="text-sm font-medium text-muted-foreground italic shrink-0">
				<Lightbulb class="size-4" />
			</span>

			<ShoppingRecommendationsList {recommendations} {loading} />

			{#if total > 10}
				<Button variant="link" class="shrink-0" onclick={() => onShuffle(recommendations)}>
					<Ellipsis class="size-4" />
					More
				</Button>
			{/if}
		</div>

		<div
			class="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent"
		></div>
	</div>
{/if}
