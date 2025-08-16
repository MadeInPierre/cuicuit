<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import Dial from './dial.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Meal Plan</h2>
			<p class="text-muted-foreground">Here's your plan. Add meals to get started.</p>
		</div>
	</div>

	<Separator class="my-6" />

	<Dial subtitle="Pears" min={0} max={12} step={0.25} initial={1} value={1} />

	{@render children?.()}
</div>
