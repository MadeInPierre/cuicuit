<script module lang="ts">
	export const statuses = {
		cookable: {
			key: 'cookable',
			label: 'Cookable',
			icon: CheckCheck,
			color: 'text-green-600 dark:text-green-500'
		},
		'cookable-required': {
			key: 'cookable-required',
			label: 'Cookable, no optionals',
			icon: Check,
			color: 'text-teal-600 dark:text-teal-500'
		},
		'cookable-almost': {
			key: 'cookable-almost',
			label: 'Cookable, close quantities',
			icon: Check,
			color: 'text-teal-600 dark:text-teal-500'
		},
		'cookable-close': {
			key: 'cookable-close',
			label: 'Cookable, 2 close subs.',
			icon: EqualApproximately,
			color: 'text-emerald-600 dark:text-emerald-500'
		},
		'cookable-far': {
			key: 'cookable-far',
			label: 'Cookable, 2 far subs.',
			icon: EqualApproximately,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		'cookable-enough': {
			key: 'cookable-enough',
			label: 'Enough for 2 servings',
			icon: Scale,
			color: 'text-yellow-600 dark:text-yellow-500'
		},
		'change-of-plans': {
			key: 'change-of-plans',
			label: 'Change of plans',
			icon: Repeat,
			color: 'text-amber-600 dark:text-amber-500'
		},
		'missing-ingredients': {
			key: 'missing-ingredients',
			label: 'Eggs, Milk, Flour +1',
			icon: ShoppingBasket,
			color: 'text-red-600 dark:text-red-500'
		}
	} as const;

	type StatusKey = (typeof statuses)[keyof typeof statuses]['key'];

	export const statusKeys: StatusKey[] = Object.keys(statuses) as StatusKey[];
</script>

<script lang="ts">
	import {
		Check,
		CheckCheck,
		EqualApproximately,
		Repeat,
		Scale,
		ShoppingBasket
	} from 'lucide-svelte';

	type Props = {
		status?: StatusKey | null;
	};

	const { status: statusKey = null }: Props = $props();

	const randomStatus = $derived(
		statusKey
			? statuses[statusKey]
			: statuses[statusKeys[Math.floor(Math.random() * statusKeys.length)]]
	);
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
