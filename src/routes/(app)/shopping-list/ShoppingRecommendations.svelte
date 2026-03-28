<script lang="ts">
	import { Plus, Shuffle } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import * as Tooltip from '$lib/shared/components/ui/tooltip/index.js';
	import { fade } from 'svelte/transition';
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
	<div class="hidden xl:flex items-center group" transition:fade={{ duration: 200 }}>
		<Tooltip.Root delayDuration={600}>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="icon"
					class={cn(
						'size-7 text-muted-foreground group-hover:mr-2',
						typeof navigator !== 'undefined' &&
							navigator.maxTouchPoints > 0 &&
							recommendations.length > 4 &&
							'mr-2'
					)}
					onclick={() => onShuffle(recommendations)}
				>
					{#if total > 4}
						{#if typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0}
							<Shuffle class="size-4" />
						{:else}
							<Plus class="size-4 group-hover:hidden" />
							<Shuffle class="size-4 hidden group-hover:block" />
						{/if}
					{:else if typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0}
						<Plus class="size-4 group-hover:rotate-45 transition-transform" />
					{:else}
						<Plus class="size-4 rotate-45" />
					{/if}
				</Button>
			</Tooltip.Trigger>
			<!-- <Tooltip.Content>
				{recommendations.length > 4 ? 'Shuffle' : 'Dismiss'}
			</Tooltip.Content> -->
		</Tooltip.Root>

		{#key total}
			<div in:fade={{ duration: 200 }}>
				<ShoppingRecommendationsList {recommendations} {loading} />
			</div>
		{/key}
	</div>
{/if}
