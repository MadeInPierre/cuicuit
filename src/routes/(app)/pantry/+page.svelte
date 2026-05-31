<script lang="ts">
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { ExternalLink } from 'lucide-svelte';

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
		<div class="grid md:grid-cols-2 gap-2 md:gap-4 justify-items-start">
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
			<CookableStatus />
		</div>
	</div>

	<div class="flex flex-col gap-3 items-center justify-center px-20">
		<div class="text-center space-y-2">
			<p class="text-xl font-semibold">Interested in meal recommendations?</p>
			<p class="text-muted-foreground max-w-120">
				Pantry management & automatic meal recommendations are coming soon! Help us prioritize this
				feature by voting for it.
			</p>
		</div>

		<Button href="https://github.com/MadeInPierre/cuicuit2/discussions" target="_blank">
			Vote for this feature
			<ExternalLink class="size-4" />
		</Button>
	</div>
</div>
