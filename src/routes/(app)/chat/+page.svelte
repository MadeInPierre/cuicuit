<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Chat</h2>
			<p class="text-muted-foreground">
				Cuicuit can do it all! Ask it anything about recipes, meal plans, or shopping lists.
			</p>
		</div>
	</div>

	<Separator class="my-6" />

	{@render children?.()}
</div>
