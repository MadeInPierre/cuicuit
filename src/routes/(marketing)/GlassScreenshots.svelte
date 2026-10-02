<script lang="ts">
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Play } from '@lucide/svelte';

	type Props = {
		desktopSrc: string;
		desktopAlt: string;
		mobileSrc: string;
		mobileAlt: string;
		videoUrl: string;
	};
	const { desktopSrc, desktopAlt, mobileSrc, mobileAlt, videoUrl }: Props = $props();

	let open = $state(false);

	// Annotations point at real UI regions of the desktop screenshot (positions in %).
	type Pt = [number, number];
	const arrow = (from: Pt, c1: Pt, c2: Pt, to: Pt) => ({
		d: `M${from} C${c1} ${c2} ${to}`,
		// Arrowhead is aligned to the curve's end tangent
		angle: (Math.atan2(to[1] - c2[1], to[0] - c2[0]) * 180) / Math.PI,
		to
	});
	const callouts = [
		{ text: 'Throw meal ideas', top: '20%', ...arrow([2, 26], [24, 6], [50, 4], [84, 16]) },
		{ text: 'Live cookability', top: '43%', ...arrow([2, 12], [26, 34], [54, 32], [84, 22]) },
		{ text: 'Extras, one tap', top: '66%', ...arrow([2, 30], [26, 8], [56, 38], [84, 18]) }
	];
</script>

<div class="relative">
	<!-- Laptop frame: dark bezel + base, on an offset paper cut-out -->
	<div class="hidden md:block md:px-8 xl:px-0 xl:ml-auto xl:w-[77%]">
		<div class="relative">
			<div
				aria-hidden="true"
				class="absolute -inset-x-4 -top-4 bottom-3 -rotate-1 rounded-4xl bg-primary/15"
			></div>
			<div
				class="relative rounded-t-2xl rounded-b-[0.3rem] bg-foreground p-[7px] pt-[9px] shadow-(--shadow-lift) ring-1 ring-foreground/60 xl:p-2 xl:pt-[11px]"
			>
				<span
					aria-hidden="true"
					class="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-background/25"
				></span>
				<div class="overflow-hidden rounded-[0.35rem] bg-card">
					<img
						src={desktopSrc}
						alt={desktopAlt}
						width="1600"
						height="1009"
						fetchpriority="high"
						decoding="async"
						class="block w-full h-auto"
					/>
				</div>
			</div>
			<div
				aria-hidden="true"
				class="relative mx-[-3.5%] h-[0.9rem] rounded-b-[1.1rem] rounded-t-[2px] bg-linear-to-b from-[#e4e1dc] via-[#c9c5be] to-[#a9a59e] shadow-(--shadow-soft)"
			>
				<span
					class="absolute left-1/2 top-0 h-[5px] w-[16%] -translate-x-1/2 rounded-b-lg bg-[#8f8b84]/70"
				></span>
			</div>
		</div>
	</div>

	<div class="md:hidden mx-auto w-[80%] overflow-hidden">
		<img
			src={mobileSrc}
			alt={mobileAlt}
			width="700"
			height="1389"
			fetchpriority="high"
			decoding="async"
			class="block w-full h-auto"
		/>
	</div>

	{#each callouts as c (c.text)}
		<!-- Wide screens: handwritten note in the empty left column, arrow pointing at the screenshot -->
		<span
			aria-hidden="true"
			class="pointer-events-none absolute left-0 hidden xl:flex w-[22%] items-center justify-end gap-4 font-hand text-2xl leading-tight whitespace-nowrap text-foreground pr-4"
			style="top:{c.top}"
		>
			<span class="-rotate-2">{c.text}</span>
			<svg
				viewBox="0 0 90 44"
				fill="none"
				class="h-9 w-16 shrink-0 text-primary"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d={c.d} />
				<path
					d="M-11 -7 L0 0 L-11 7"
					transform="translate({c.to[0]} {c.to[1]}) rotate({c.angle})"
				/>
			</svg>
		</span>
		<!-- Narrower screens: chip over the screenshot -->
		<span
			aria-hidden="true"
			class="pointer-events-none absolute left-[24.5%] hidden md:inline-flex xl:hidden items-center rounded-full bg-foreground px-3 py-1.5 font-hand text-lg leading-none text-background shadow-(--shadow-soft)"
			style="top:{c.top}"
		>
			← {c.text}
		</span>
	{/each}

	<Dialog.Root bind:open>
		<Dialog.Trigger
			class="mx-auto mt-6 md:mt-0 md:absolute md:bottom-[9%] md:left-1/2 xl:left-[61.5%] md:-translate-x-1/2 flex w-fit min-h-12 md:min-h-14 items-center gap-2.5 rounded-full bg-primary px-6 md:px-8 text-base md:text-lg font-semibold text-primary-foreground shadow-(--shadow-lift) ring-4 ring-background/80 transition hover:scale-105 motion-reduce:transition-none"
		>
			<Play class="h-5 w-5" fill="currentColor" /> Watch the demo
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-5xl p-2">
			<Dialog.Title class="sr-only">Cuicuit demo video</Dialog.Title>
			<Dialog.Description class="sr-only">A short walkthrough of Cuicuit.</Dialog.Description>
			{#if open}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={videoUrl} class="w-full rounded-lg bg-black" controls autoplay playsinline
				></video>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
</div>
