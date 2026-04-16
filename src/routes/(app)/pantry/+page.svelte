<script lang="ts">
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Pantry</h2>
			<p class="text-muted-foreground">Here's your pantry. Add items to get started.</p>
		</div>
	</div>

	<Separator class="my-6" />

	{@render children?.()}

	<div class="my-20 flex flex-col items-center gap-6 mx-auto max-w-lg">
		<div class="grid md:grid-cols-2 gap-2 md:gap-6 justify-items-start">
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
		</div>

		<p class="text-accent-foreground">Coming soon...</p>
	</div>
</div>
