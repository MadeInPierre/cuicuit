<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	type $$Props = SVGAttributes<SVGElement>;
</script>

<svg
	role="img"
	viewBox="0 0 24 24"
	{...$$restProps}
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="m16 16-5.5 5.5L8 19" />
	<path d="M4.5 17.365A7 7 0 1 1 15.709 10h1.79A4.5 4.5 0 0 1 19 18.741" />
</svg>
