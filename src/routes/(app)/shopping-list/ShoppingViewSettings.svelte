<script lang="ts">
	import PillSelect from '$lib/shared/components/PillSelect.svelte';
	import SheetResponsive from '$lib/shared/components/SheetResponsive.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { ScrollArea } from '$lib/shared/components/ui/scroll-area';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import type { PersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { BetweenHorizonalEnd, Grid3x3, List, PanelBottom, Settings2 } from '@lucide/svelte';

	type Props = {
		itemsLayout: PersistentState<string>;
		checkedItemsLayout: PersistentState<string>;
		suggestionsLayout: PersistentState<string>;
	};

	let {
		itemsLayout = $bindable(),
		checkedItemsLayout = $bindable(),
		suggestionsLayout = $bindable()
	}: Props = $props();

	let open = $state(false);
	let media = useMedia();
</script>

<Button
	variant="secondary"
	size={media.sm ? 'default' : 'sm'}
	class="max-md:shadow-none max-md:rounded-lg"
	onclick={() => (open = true)}
>
	<Settings2 />
	View
</Button>

<SheetResponsive
	bind:open
	title="Shopping settings"
	description="Make it look just right"
	side="right"
>
	<ScrollArea class="flex-1 px-2 pb-3">
		<div class="py-4 px-2 grid gap-6">
			<PillSelect
				title="Items layout"
				type="single"
				values={itemsLayout.value ? [itemsLayout.value] : []}
				onChange={(val) => itemsLayout.set(val[0] ?? null)}
				options={[
					{ value: 'grid', label: 'Grid', icon: Grid3x3 },
					{ value: 'list', label: 'List', icon: List }
				]}
				displayColumns={2}
			/>

			<PillSelect
				title="Checked items"
				type="single"
				values={checkedItemsLayout.value ? [checkedItemsLayout.value] : []}
				onChange={(val) => checkedItemsLayout.set(val[0] ?? null)}
				options={[
					{ value: 'aisle', label: 'In aisle', icon: BetweenHorizonalEnd },
					{ value: 'bottom', label: 'At bottom', icon: PanelBottom }
				]}
				displayColumns={2}
			/>

			<PillSelect
				title="Suggestions"
				type="single"
				values={suggestionsLayout.value ? [suggestionsLayout.value] : []}
				onChange={(val) => suggestionsLayout.set(val[0] ?? null)}
				options={[
					{ value: 'aisle', label: 'In aisle', icon: BetweenHorizonalEnd },
					{ value: 'bottom', label: 'At bottom', icon: PanelBottom }
				]}
				displayColumns={2}
			/>

			<div class="bg-muted rounded-md p-3 text-muted-foreground text-xs text-center w-full md:mt-6">
				<strong>Tip:</strong> long-press an item on mobile to view linked recipes.
			</div>
		</div>
	</ScrollArea>
</SheetResponsive>
