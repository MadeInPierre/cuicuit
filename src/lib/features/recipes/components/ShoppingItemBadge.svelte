<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		ingredientId: string | null;
		name?: string;
		score?: string;
		onclick?: () => void;
		class?: string;
	};

	let { ingredientId, name, score, onclick, class: className }: Props = $props();
</script>

<button
	class={cn("flex items-center gap-2 bg-white dark:bg-muted pl-2 pr-4 py-0 rounded-full shadow-2xs", className)}
	{onclick}
>
	<IngredientImage
		id={ingredientId || null}
		name={name || 'Unknown'}
		class="w-7 h-7 rounded-full"
	/>

	<span class="text-sm" title={score || ''}>
		{name || 'Unknown'}
	</span>
</button>
