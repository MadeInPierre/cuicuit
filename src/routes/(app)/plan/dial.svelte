<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<{
		confirm: { value: number };
		cancel: void;
		change: { value: number };
	}>();

	// Public API
	export let open = true;
	export let subtitle = 'Pears';
	export let min = 1;
	export let max = 12;
	export let step = 1;
	export let initial = 2;
	export let value = 2;

	// Dial geometry
	const ARC = 360; // degrees spanned by visible ticks
	const TICKS = 36; // total tick marks (every 4th is "major")

    // degrees the tick group can rotate
	const rotationRange = 270; 

	// State
	let container: HTMLDivElement;
	let dialPx = 280; // updated from ResizeObserver
	let dragging = false;
	let startX = 0;
	let startContinuous = 0;
	let continuous = value;
	let pxPerStep = 28; // recalculated from dial size

	// helpers
	const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
	const range = (n: number) => Array.from({ length: n }, (_, i) => i);

	// responsive sensitivity
	function recalcSensitivity() {
		// ~ one full sweep from min→max takes ~80% of dial width
		pxPerStep = (dialPx * 1.8) / Math.max(1, (max - min) / step);
	}

	// reactivity
	// $: continuous = clamp(continuous, min, max);

	// rotation from value
	$: ratio = (continuous - min) / (max - min || 1);
	$: ringRotation = clamp(-ratio * rotationRange, -rotationRange, 0);

	$: value =
		Math.round((-(startDeg + ringRotation - (TICKS - 1) / (2 * ARC)) * (TICKS - 1)) / ARC) * step;
	$: dispatch('change', { value });

	// dragging
	function beginDrag(e: PointerEvent) {
		dragging = true;
		startX = e.clientX;
		startContinuous = continuous;
		(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
		document.body.style.userSelect = 'none';
	}
	function moveDrag(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - startX;
		const deltaSteps = -dx / pxPerStep;
		continuous = startContinuous + deltaSteps * step;
	}
	function endDrag() {
		dragging = false;
		document.body.style.userSelect = '';
	}

	// wheel & keys
	function nudge(dir: number) {
		continuous = clamp(continuous + dir * step, min, max);
	}
	function onWheel(e: WheelEvent) {
		e.preventDefault();
		nudge(e.deltaY > 0 ? -1 : 1);
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			nudge(-1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			nudge(1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			continuous = min;
		} else if (e.key === 'End') {
			e.preventDefault();
			continuous = max;
		} else if (e.key === 'Escape') dispatch('cancel');
		else if (e.key === 'Enter') dispatch('confirm', { value });
	}
	function reset() {
		continuous = clamp(initial, min, max);
	}
	function confirm() {
		dispatch('confirm', { value });
	}

	// global listeners so drag works outside the dial
	const onMove = (e: PointerEvent) => moveDrag(e);
	const onUp = () => endDrag();

	let ro: ResizeObserver | null = null;
	onMount(() => {
		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('pointerup', onUp, { passive: true });

		ro = new ResizeObserver((entries) => {
			for (const ent of entries) {
				const box = ent.contentBoxSize?.[0] ?? ent.contentRect;
				// dialPx = min(container width, height) but keep some padding
				const w = 'inlineSize' in box ? box.inlineSize : (box as any).width;
				dialPx = Math.max(220, Math.min(360, w - 48));
				recalcSensitivity();
			}
		});
		ro.observe(container);

		recalcSensitivity();
	});
	onDestroy(() => {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		ro?.disconnect();
	});

	// SVG math for tick positions on the bottom arc centered at 90°
	const startDeg = -0.8; // Offset to center ticks
	const radius = 120; // rendered radius inside the SVG viewBox
	function tickSpec(i: number) {
		const a = startDeg + (i * ARC) / (TICKS - 1);
		const major = i % 4 === 0;
		const len = major ? 14 : 8;
		return { a, len, major };
	}
</script>

{#if open}
	<!-- Dialog -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="place-items-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="scale-title"
		on:keydown={onKey}
	>
		<div
			class="w-full max-w-2xl rounded-[28px] bg-neutral-900/95 text-neutral-100 shadow-2xl ring-1 ring-white/10"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-6 pt-4">
				<button
					class="rounded-full p-2 text-neutral-300 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-white/30"
					aria-label="Reset"
					on:click={reset}
				>
					<svg viewBox="0 0 24 24" class="h-6 w-6"
						><path
							fill="currentColor"
							d="M12 5v2.5a.75.75 0 0 0 1.28.53l3.9-3.9a.75.75 0 0 0 0-1.06l-3.9-3.9A.75.75 0 0 0 12 .7V3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7z"
						/></svg
					>
				</button>
				<div class="py-1 text-center">
					<h2 id="scale-title" class="text-3xl font-extrabold">Scale Recipe</h2>
					<p class="mt-1 text-base text-neutral-300">{subtitle} {continuous}</p>
				</div>
				<button
					class="rounded-full p-2 text-neutral-300 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-white/30"
					aria-label="Confirm"
					on:click={confirm}
				>
					<svg viewBox="0 0 24 24" class="h-6 w-6"
						><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21.6 6.4 20.2 5z" /></svg
					>
				</button>
			</div>

			<!-- Buttons -->
			<div class="mt-3 flex items-center justify-center gap-4">
				<button
					class="rounded-2xl bg-neutral-800 px-4 py-2 text-xl shadow-sm hover:bg-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-white/20"
					on:click={() => nudge(-1)}
					aria-label="Decrease">−</button
				>
				<div class="rounded-2xl bg-neutral-800 px-5 py-2 text-xl font-semibold shadow-sm">{value}</div>
				<button
					class="rounded-2xl bg-neutral-800 px-4 py-2 text-xl shadow-sm hover:bg-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-white/20"
					on:click={() => nudge(1)}
					aria-label="Increase">+</button
				>
			</div>

			<!-- Dial -->
			<div class="mt-6 px-6 pb-0" bind:this={container}>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="relative mx-auto select-none outline-hidden"
					style={`width:${dialPx}px;height:${120}px`}
					on:wheel={onWheel}
					on:pointerdown|preventDefault={beginDrag}
					on:pointermove={moveDrag}
					on:pointerup={endDrag}
					tabindex="0"
				>
					<!-- SVG ring -->
					<svg viewBox="-150 -150 300 100" class="absolute left-0 top-0" role="presentation">
						<!-- outer circle -->
						<!-- <circle
							cx="0"
							cy="0"
							r={radius}
							class="fill-none"
						/> -->

						<!-- rotating tick group -->
						<g transform={`rotate(${ringRotation})`}>
							{#each range(TICKS) as i (i)}
								{#key i}
									{#await Promise.resolve(tickSpec(i)) then spec}
										<g transform={`rotate(${spec.a}) translate(0 ${-radius})`}>
											<rect
												x="-1"
												y={-spec.len}
												width={spec.major ? 5 : 3}
												height={spec.len}
												rx="1"
												fill={spec.major ? 'rgba(209,213,219,0.9)' : 'rgba(156,163,175,0.7)'}
											/>
										</g>
									{/await}
								{/key}
							{/each}
						</g>
					</svg>

					<!-- needle -->
					<div class="absolute left-1/2 bottom-0 -translate-x-1/2">
						<div class="h-12 w-3 rounded-t-full bg-red-500"></div>
					</div>

					<!-- drag surface -->
					<div class="absolute inset-0 cursor-ew-resize rounded-b-[42px]" aria-hidden="true"></div>
				</div>
			</div>
		</div>
	</div>
{/if}
