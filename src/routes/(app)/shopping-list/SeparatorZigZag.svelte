<script lang="ts">
	import { cn } from '$lib/utils';

	// Horizontal zigzag separator with constant pitch (in CSS pixels)
	interface Props {
		class?: string;
		pitch?: number; // horizontal distance between peaks
		amplitude?: number; // zigzag height
		strokeWidth?: number;
		color?: string;
		opacity?: number;
	}

	let {
		class: className = '',
		pitch = 8,
		amplitude = 4,
		strokeWidth = 1,
		color = 'currentColor',
		opacity = 0.3
	}: Props = $props();

	const patternId = `zigzag-${Math.random().toString(36).slice(2)}`;

	const height = $derived(amplitude + strokeWidth);
</script>

<div class={cn('w-full', className)}>
	<svg class="separator" width="100%" {height} aria-hidden="true">
		<defs>
			<!-- userSpaceOnUse => pitch stays in CSS px -->
			<pattern id={patternId} width={pitch * 2} {height} patternUnits="userSpaceOnUse">
				<path
					d={`M 0 0 L ${pitch} ${amplitude} L ${pitch * 2} 0`}
					fill="none"
					stroke={color}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round"
					{opacity}
					vector-effect="non-scaling-stroke"
				/>
			</pattern>
		</defs>

		<rect width="100%" height="100%" fill={`url(#${patternId})`} />
	</svg>
</div>

<style>
	.separator {
		display: block;
	}
</style>
