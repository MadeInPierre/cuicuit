<script lang="ts">
	import { Check, Circle, Loader } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	type StepStatus = 'waiting' | 'loading' | 'done';

	type Props = {
		steps: string[];
		delays: number[];
		active: boolean;
	};

	let { steps, delays, active }: Props = $props();

	let statuses = $state<StepStatus[]>([]);
	let cancelled = false;

	function applyVariance(ms: number): number {
		const variance = ms * 0.3;
		return ms + (Math.random() * 2 - 1) * variance;
	}

	$effect(() => {
		if (!active) {
			statuses = steps.map(() => 'waiting');
			return;
		}
	});

	onMount(() => {
		cancelled = false;
		statuses = steps.map(() => 'waiting');

		async function run() {
			for (let i = 0; i < steps.length; i++) {
				if (cancelled) return;
				statuses[i] = 'loading';
				statuses = [...statuses];

				await new Promise((r) => setTimeout(r, applyVariance(delays[i] ?? 600)));

				if (cancelled) return;

				if (i === steps.length - 1 && active) {
					while (!cancelled && active) {
						await new Promise((r) => setTimeout(r, 200));
					}
					return;
				}

				statuses[i] = 'done';
				statuses = [...statuses];
			}
		}

		run();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="flex flex-col items-start gap-2 py-1">
	{#each steps as label, i}
		<div class="flex items-center gap-3" in:fly={{ y: 8, duration: 200, delay: i * 50 }}>
			{#if statuses[i] === 'done'}
				<div in:fly={{ y: -4, duration: 200 }}>
					<Check class="size-4 text-green-600" />
				</div>
			{:else if statuses[i] === 'loading'}
				<Loader class="size-4 animate-spin text-foreground" />
			{:else}
				<Circle class="size-4 text-muted-foreground/40" />
			{/if}
			<span
				class="text-sm transition-colors duration-200 {statuses[i] === 'done'
					? 'text-green-600'
					: statuses[i] === 'loading'
						? 'text-foreground font-medium'
						: 'text-muted-foreground/50'}"
			>
				{label}
			</span>
		</div>
	{/each}
</div>
