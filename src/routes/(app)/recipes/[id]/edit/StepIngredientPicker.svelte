<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { cn } from '$lib/utils';
	import type { StepIngredientOption } from './step-hints';

	type Props = {
		options: readonly StepIngredientOption[];
		onSelect: (option: StepIngredientOption) => void;
		emptyMessage?: string;
	};

	let { options, onSelect, emptyMessage = 'All ingredients are linked.' }: Props = $props();
</script>

{#if options.length === 0}
	<p class="px-2 py-3 text-center text-xs text-muted-foreground">{emptyMessage}</p>
{:else}
	<div class="grid max-h-64 gap-0.5 overflow-y-auto">
		{#each options as option (option.key)}
			<button
				type="button"
				class={cn(
					'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent'
				)}
				onclick={() => onSelect(option)}
			>
				<IngredientImage
					id={option.ingredientId}
					name={option.name}
					class="size-7 min-w-7 rounded-md text-xs"
				/>
				<span class="truncate">{option.name}</span>
			</button>
		{/each}
	</div>
{/if}
