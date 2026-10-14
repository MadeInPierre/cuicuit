<script lang="ts">
	import { siteConfig } from '$lib/shared/config/site-config';
	import { Loader2, RotateCw, WifiOff } from '@lucide/svelte';
</script>

<div
	class="flex h-screen w-screen flex-col items-center justify-center space-y-6 bg-background px-6 text-center text-muted-foreground"
>
	<div class="flex flex-col items-center space-y-2">
		<img src="/cuicuit_logo_transparent.png" alt={siteConfig.name} class="h-12" />
		<span class="grid w-min items-center text-xl font-medium text-foreground"> Cuicuit </span>
	</div>

	<div class="flex items-center gap-2 text-sm">
		<Loader2 class="h-4 w-4 animate-spin" />
		Loading...
	</div>

	<div class="flex max-w-sm flex-col items-center space-y-2">
		<div class="flex items-center gap-2 text-sm font-medium text-foreground">
			<WifiOff class="h-4 w-4" />
			You're offline
		</div>
		<p class="text-sm">
			This page hasn't been cached yet. Reconnect to load it, or jump to a page you've already
			visited.
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		<button
			type="button"
			onclick={() => location.reload()}
			class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
		>
			<RotateCw class="h-4 w-4" />
			Retry
		</button>
		<a
			href="/recipes"
			class="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
		>
			Recipes
		</a>
		<a
			href="/plan"
			class="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
		>
			Plan
		</a>
		<a
			href="/shopping-list"
			class="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
		>
			Shopping list
		</a>
	</div>
</div>
