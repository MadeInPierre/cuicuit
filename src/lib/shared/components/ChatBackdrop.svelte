<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	onMount(() => {
		const scrollY = window.scrollY;

        // Lock scroll position
        document.body.style.overflow = 'hidden';

		return () => {
			window.scrollTo(0, scrollY);
			document.body.style.overflow = '';
		};
	});
</script>

<div
	class="fixed top-0 left-0 z-30 flex h-[100dvh] w-screen items-center justify-center overflow-hidden overscroll-contain touch-none backdrop-blur-2xl bg-background/40 text-foreground transition-all"
	transition:fade={{ duration: 150 }}
	aria-hidden="true"
>
	<!-- Welcome to the chat! -->
</div>
