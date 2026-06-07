<script lang="ts">
	import { type ShoppingRecommendation } from '$lib/features/spaces/queries/get-shopping-recommendations';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Tooltip from '$lib/shared/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { Plus, Shuffle } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import ShoppingRecommendationsList from './ShoppingRecommendationsList.svelte';

	type Props = {
		recommendations: ShoppingRecommendation[];
		total: number;
		onShuffle: (currentRecommendations: ShoppingRecommendation[]) => void;
		loading: boolean;
	};
	let { recommendations, total, onShuffle, loading }: Props = $props();

	let showSkeleton = $state(false);
	let _skeletonTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		if (loading) {
			if (_skeletonTimer) clearTimeout(_skeletonTimer);
			_skeletonTimer = setTimeout(() => (showSkeleton = true), 500);
		} else {
			if (_skeletonTimer) {
				clearTimeout(_skeletonTimer);
				_skeletonTimer = null;
			}
			showSkeleton = false;
		}
	});

	onDestroy(() => {
		if (_skeletonTimer) clearTimeout(_skeletonTimer);
	});
</script>

{#if recommendations.length > 0 || showSkeleton}
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
							<Shuffle class="size-4 mr-2" />
						{:else}
							<Plus class="size-4 group-hover:hidden" />
							<Shuffle class="size-4 hidden group-hover:block" />
						{/if}
					{:else if typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0}
						<Plus class="size-4 rotate-45 mr-2" />
					{:else}
						<Plus class="size-4 group-hover:rotate-45 transition-transform" />
					{/if}
				</Button>
			</Tooltip.Trigger>
			<!-- <Tooltip.Content>
				{recommendations.length > 4 ? 'Shuffle' : 'Dismiss'}
			</Tooltip.Content> -->
		</Tooltip.Root>

		<ShoppingRecommendationsList {recommendations} />
	</div>
{/if}
