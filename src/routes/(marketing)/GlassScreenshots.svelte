<script lang="ts">
	/**
	 * Glassmorphism Showcase Component
	 * Embeds desktop and mobile app screenshots with transparent backdrop blur,
	 * glossy translucent padding, and layered depth.
	 */
	export let desktopSrc: string = '/screenshots/demo_desktop.jpeg';
	export let desktopAlt: string = 'Desktop application preview';

	export let mobileSrc: string = '/screenshots/shoppinglist_mobile_487x911.png';
	export let mobileAlt: string = 'Mobile application preview';
</script>

<div class="relative w-full max-w-8xl mx-auto p-4 md:p-8 xl:p-0 mb-6 sm:mb-12">
	<!-- Desktop Glass Container -->
	<div
		class="relative rounded-md sm:rounded-lg lg:rounded-xl
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
	</div>

	<!-- Mobile Glass Container (Overlaid) -->
	<div
		class="absolute -right-[0%] xl:-right-[3%] -bottom-[5%]
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

<style>
	/* Fallback blur support for webkit browsers */
	@supports (-webkit-backdrop-filter: none) or (backdrop-filter: none) {
		div {
			-webkit-backdrop-filter: blur(24px);
			backdrop-filter: blur(24px);
		}
	}
</style>
