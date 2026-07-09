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
		direction?: 'horizontal' | 'vertical';
	}

	let {
		class: className = '',
		pitch = 8,
		amplitude = 4,
		strokeWidth = 1,
		color = 'currentColor',
		opacity = 0.3,
		direction = 'horizontal'
	}: Props = $props();

	const patternId = `zigzag-${Math.random().toString(36).slice(2)}`;

	const thickness = $derived(amplitude + strokeWidth);
	const cycleLength = $derived(pitch * 2);

	const svgWidth = $derived(direction === 'horizontal' ? '100%' : thickness);
	const svgHeight = $derived(direction === 'vertical' ? '100%' : thickness);

	const patternWidth = $derived(direction === 'horizontal' ? cycleLength : thickness);
	const patternHeight = $derived(direction === 'horizontal' ? thickness : cycleLength);

	const pathD = $derived(
		direction === 'horizontal'
			? `M 0 0 L ${pitch} ${amplitude} L ${pitch * 2} 0`
			: `M 0 0 L ${amplitude} ${pitch} L 0 ${pitch * 2}`
	);
</script>

<div class={cn(direction === 'horizontal' ? 'w-full' : 'h-full', className)}>
	<svg class="separator" width={svgWidth} height={svgHeight} aria-hidden="true">
		<defs>
			<!-- userSpaceOnUse => pitch stays in CSS px -->
			<pattern
				id={patternId}
				width={patternWidth}
				height={patternHeight}
				patternUnits="userSpaceOnUse"
			>
				<path
					d={pathD}
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
