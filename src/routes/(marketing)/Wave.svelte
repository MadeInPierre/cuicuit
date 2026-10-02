<script lang="ts">
	const { flip = false }: { flip?: boolean } = $props();
</script>

<!-- Hand-cut paper edge; inherits the section color via currentColor -->
<svg
	aria-hidden="true"
	viewBox="0 0 1440 48"
	preserveAspectRatio="none"
	class="block h-6 w-full md:h-10 {flip ? 'rotate-180' : ''}"
	fill="currentColor"
>
	<path
		d="M0 48V22C90 6 170 34 280 20S470 2 560 22 740 40 840 18 1010 4 1110 24 1300 38 1440 14V48Z"
	/>
</svg>
