<script lang="ts">
	import { Play } from '@lucide/svelte';
	/**
	 * Glassmorphism Showcase Component
	 * Embeds desktop and mobile app screenshots with transparent backdrop blur,
	 * glossy translucent padding, and layered depth.
	 */
	import { fade, scale } from 'svelte/transition';

	export let desktopSrc: string = '/screenshots/demo_desktop.jpeg';
	export let desktopAlt: string = 'Desktop application preview';

	export let mobileSrc: string = '/screenshots/shoppinglist_mobile_487x911.png';
	export let mobileAlt: string = 'Mobile application preview';

	// Video demo URL (can be a direct mp4/webm URL or an embed source)
	export let videoUrl: string =
		'https://github.com/user-attachments/assets/8f880754-87fd-4342-91ce-7fc59808c708';

	let showVideo = false;

	function openVideo() {
		showVideo = true;
	}

	function closeVideo() {
		showVideo = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showVideo) closeVideo();
	}
</script>

<div class="relative w-full max-w-8xl mx-auto p-4 md:p-8 xl:p-0 mb-6 sm:mb-12">
	<!-- Desktop Glass Container -->
	<div
		class="glass-card relative rounded-md sm:rounded-lg lg:rounded-xl
           p-1.5 sm:p-2.5
           bg-gradient-to-br from-white/50 via-white/30 to-white/40
           backdrop-blur-xl sm:backdrop-blur-2xl
           border border-white/70
           shadow-[0_20px_60px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.06)]
           ring-1 ring-white/40"
	>
		<!-- Screenshot wrapper -->
		<div class="overflow-hidden rounded-lg sm:rounded-xl shadow-inner bg-white/10">
			<img
				src={desktopSrc}
				alt={desktopAlt}
				class="w-full h-auto object-cover block select-none pointer-events-none"
				loading="eager"
			/>
		</div>

		<!-- Small badge centered over desktop screenshot -->
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<button
				class="pointer-events-auto relative inline-flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-3 rounded-full bg-white/85 text-black text-sm font-medium shadow-lg transform transition duration-150 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/40 overflow-visible"
				aria-label="Watch a demo"
				on:click={openVideo}
			>
				<span class="relative z-10 inline-flex items-center gap-2">
					<Play class="size-4 md:size-6" />
					<span class="md:text-lg lg:text-xl">Watch demo</span>
				</span>
			</button>
		</div>
	</div>

	<!-- Mobile Glass Container (Overlaid) -->
	<div
		class="glass-card absolute -right-[0%] xl:-right-[3%] -bottom-[5%]
           w-[30%] max-w-[290px] min-w-[80px] z-10
           rounded-md sm:rounded-lg lg:rounded-xl
           p-1.5 sm:p-2.5
           bg-gradient-to-br from-white/60 via-white/35 to-white/45
           backdrop-blur-xl sm:backdrop-blur-2xl
           border border-white/80
           shadow-[0_25px_60px_rgba(0,0,0,0.18),0_12px_24px_rgba(0,0,0,0.1)]
           ring-1 ring-white/50"
	>
		<!-- Screenshot wrapper -->
		<div class="overflow-hidden rounded-lg sm:rounded-xl shadow-inner bg-white/10">
			<img
				src={mobileSrc}
				alt={mobileAlt}
				class="w-full h-auto object-cover block select-none pointer-events-none"
				loading="eager"
			/>
		</div>
	</div>
</div>

{#if showVideo}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
		on:click|self={closeVideo}
		transition:fade
	>
		<div
			class="relative w-[90vw] max-w-[90vw] mx-auto max-h-[94vh]"
			in:scale={{ duration: 180 }}
			out:scale={{ duration: 120 }}
		>
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={videoUrl}
				class="w-full h-auto rounded-lg shadow-2xl bg-black object-contain"
				controls
				autoplay
				playsinline
			></video>

			<button
				class="absolute -top-4 -right-4 bg-white/90 rounded-full p-2 shadow-md focus:outline-none"
				aria-label="Close video"
				on:click={closeVideo}
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	/* Fallback blur support for webkit browsers - scoped to glass cards */
	@supports (-webkit-backdrop-filter: none) or (backdrop-filter: none) {
		.glass-card {
			-webkit-backdrop-filter: blur(24px);
			backdrop-filter: blur(24px);
		}
	}
</style>
