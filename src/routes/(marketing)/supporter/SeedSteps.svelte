<script lang="ts">
	import { FEATURE_COSTS, SEEDS_PER_UNIT } from '$lib/features/billing/consts';
	import { WEEKLY_COMMUNITY_SEEDS_LIMIT } from '$lib/core/operations/credits';
	import { cn } from '$lib/utils';
	import { HandHeart, Sparkles, Sprout } from '@lucide/svelte';

	let { sym = '€', class: className = '' }: { sym?: string; class?: string } = $props();

	const importCost = FEATURE_COSTS.import_recipe_from_website.seeds;

	const steps = $derived([
		{
			icon: HandHeart,
			title: 'Supporters chip in',
			text: `Every ${sym}1 adds ${SEEDS_PER_UNIT.private} seeds to your balance and ${SEEDS_PER_UNIT.public} to the community fund.`
		},
		{
			icon: Sprout,
			title: 'Everyone picks from the garden',
			text: `Anyone can use up to ${WEEKLY_COMMUNITY_SEEDS_LIMIT} shared seeds weekly while the community fund has seeds available.`
		},
		{
			icon: Sparkles,
			title: 'Seeds power recipe imports',
			text: `Each recipe import uses ${importCost} seed${importCost === 1 ? '' : 's'}. Planning, shopping lists and sharing stay free.`
		}
	]);
</script>

<ol class={cn('relative grid gap-6 md:grid-cols-3 md:gap-8', className)}>
	<span
		aria-hidden="true"
		class="absolute top-6 right-[16%] left-[16%] hidden border-t-2 border-dashed border-primary/40 md:block"
	></span>
	{#each steps as step, i (step.title)}
		<li class="relative flex gap-4 md:flex-col md:items-center md:text-center">
			<span
				class="relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
			>
				<step.icon class="size-5" aria-hidden="true" />
				<span
					aria-hidden="true"
					class="absolute -top-2 -right-2 font-hand text-2xl leading-none text-primary"
					>{i + 1}</span
				>
			</span>
			<div>
				<p class="font-display text-lg font-semibold">{step.title}</p>
				<p class="mt-1 text-sm text-foreground/80 md:mx-auto md:max-w-60">{step.text}</p>
			</div>
		</li>
	{/each}
</ol>
