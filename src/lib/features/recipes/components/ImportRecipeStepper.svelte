<script lang="ts">
	import { Check, Circle, Loader } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	type StepStatus = 'waiting' | 'loading' | 'done';

	type Props = {
		steps: string[];
		currentStep?: number;
	};

	let { steps, currentStep = $bindable(-1) }: Props = $props();

	let statuses: StepStatus[] = $derived.by(() => {
		if (currentStep >= 0) {
			return steps.map((_, i) => {
				if (i < currentStep) return 'done';
				if (i === currentStep) return 'loading';
				return 'waiting';
			});
		}

		return steps.map(() => 'waiting');
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
