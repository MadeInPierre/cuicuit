<script lang="ts">
	import {
		CheckCheck,
		Check,
		EqualApproximately,
		Scale,
		Repeat,
		ShoppingBasket,
		CircleQuestionMark
	} from 'lucide-svelte';

	const statuses = [
		{ label: 'Cookable', icon: CheckCheck, color: 'text-green-600 dark:text-green-500' },
		{
			label: 'Cookable, missing optionals',
			icon: Check,
			color: 'text-teal-600 dark:text-teal-500'
		},
		{
			label: 'Cookable, 2 close substitutions',
			icon: EqualApproximately,
			color: 'text-emerald-600 dark:text-emerald-500'
		},
		{
			label: 'Cookable, limited quantities',
			icon: Scale,
			color: 'text-emerald-600 dark:text-emerald-500'
		},
		{
			label: 'Cookable, 2 far substitutions',
			icon: EqualApproximately,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		{
			label: 'Enough for 2 servings',
			icon: Scale,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		{
			label: 'Change of plans',
			icon: Repeat,
			color: 'text-amber-600 dark:text-amber-500'
		},
		{
			label: '1 missing',
			icon: ShoppingBasket,
			color: 'text-red-600 dark:text-red-500'
		}
	];

	// TODO - Replace with actual logic to determine the status of the recipe
	const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
</script>

{#snippet status(status: string, Icon: any, color: string)}
	<div class="text-xs flex items-center {color}">
		<Icon class="size-3.5 inline-block mr-1" />
		<span class="line-clamp-1 text-left">{status}</span>
		<!-- <Apple class="size-3.5 inline-block ml-auto text-muted-foreground" />
						<span class="ml-1 text-xs text-muted-foreground"> 4/5 </span> -->
	</div>
{/snippet}

{@render status(randomStatus.label, randomStatus.icon, randomStatus.color)}
