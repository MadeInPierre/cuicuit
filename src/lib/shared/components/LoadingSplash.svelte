<script>
	import { siteConfig } from '$lib/shared/config/site-config';
	import { Loader2 } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
</script>

<div
	class="absolute flex h-screen w-screen flex-col items-center justify-center space-y-6 bg-background text-muted-foreground"
	out:fade={{ duration: 200 }}
>
	<div class="flex flex-col items-center space-y-2">
		<!-- <CookingPot class="mr-2 h-8 w-8" /> -->
		<img src="/cuicuit_logo_transparent.png" alt={siteConfig.name} class="h-12" />
		<a href="/" class="grid w-min items-center text-xl font-medium"> Cuicuit </a>
	</div>

	<div class="flex items-center gap-2">
		<Loader2 class="h-4 w-4 animate-spin" />
		Loading...
	</div>
</div>
