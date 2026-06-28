<script lang="ts">
	import { spaceIcons } from '$lib/features/spaces/consts';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import {
		Candy,
		EllipsisVertical,
		ExternalLink,
		Flower,
		House,
		PawPrint,
		Salad,
		UsersRound
	} from 'lucide-svelte';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';

	const space = getActiveSpaceState();
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Cookbooks</h2>
			<p class="text-muted-foreground">All your favorite recipes in one place.</p>
		</div>
	</div>

	<SeparatorZigZag class="my-6" />

	<div class="my-20 flex flex-col gap-3 items-center justify-center px-20">
		<div class="text-center space-y-2">
			<p class="text-xl font-semibold">Interested in cookbooks?</p>
			<p class="text-muted-foreground max-w-90">
				Cookbooks are coming soon! Help us prioritize this feature by voting for it.
			</p>
		</div>

		<Button href="https://github.com/MadeInPierre/cuicuit2/discussions" target="_blank">
			Vote for this feature
			<ExternalLink class="size-4" />
		</Button>
	</div>

	<div class="grid space-y-12 pt-6 opacity-40">
		<div class="grid space-y-6">
			<SectionHeader
				header={{
					title: `Shared with ${space.activeSpace?.name || 'your space'}`,
					subtitle: 'Members can see recipes from these cookbooks.',
					icon: spaceIcons[(space.activeSpace?.icon || 'house') as keyof typeof spaceIcons] || '🏠'
				}}
			/>

			<div
				class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
			>
				{@render book('Family Favorites', 'blue')}
				{@render book('Holiday Recipes', 'green', House)}
				{@render book('Weeknight Meals', 'amber', PawPrint)}
			</div>
		</div>

		<div class="grid space-y-6">
			<SectionHeader
				header={{
					title: `Shared with other spaces`,
					subtitle: `Visible to members of other spaces you've joined.`,
					icon: '🏠'
				}}
			/>

			<div
				class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
			>
				{@render book('Party Ideas', 'red', UsersRound)}
			</div>
		</div>

		<div class="grid space-y-6">
			<SectionHeader
				header={{
					title: `Private to you`,
					subtitle: 'Only you can see recipes in these cookbooks.',
					icon: '🙈'
				}}
			/>

			<div
				class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
			>
				{@render book('Healthy & Fresh', 'purple', Salad)}
				{@render book('Halloween Ideas', 'orange', Candy)}
			</div>
		</div>
	</div>
</div>

{#snippet book(
	title: string,
	color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'orange' = 'amber',
	Icon: any = Flower
)}
	<a
		href="/cookbooks#"
		class="group flex flex-col items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
	>
		<div
			class="relative transition-all hover:scale-105 w-32 h-40 bg-{color}-100 dark:bg-{color}-900 rounded-r-lg border-l-4 border-{color}-800 dark:border-{color}-700 group-hover:bg-{color}-200 dark:group-hover:bg-{color}-800 hover:shadow-md"
		>
			<div class="absolute inset-y-0 left-2 w-0.5 bg-{color}-800/20 dark:bg-{color}-700/30"></div>
			<div class="absolute inset-0 flex items-center justify-center opacity-50 dark:opacity-30">
				<Icon class="size-12 text-{color}-800 dark:text-{color}-700" />
			</div>
			<button
				class="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-{color}-300 dark:hover:bg-{color}-700 transition-opacity"
				aria-label="Cookbook options"
			>
				<EllipsisVertical class="size-4 text-{color}-800 dark:text-{color}-700" />
			</button>
		</div>
		<div class="flex flex-col gap-1 items-center">
			<span class="text-sm font-medium text-center max-w-32 truncate">{title}</span>
			<span class="text-xs text-muted-foreground">12 recipes</span>
		</div>
	</a>
{/snippet}
