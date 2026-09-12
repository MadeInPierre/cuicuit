<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import {
		resolveSupermarketAisleOrder,
		supermarketAisleSectionHeaders,
		type SupermarketAisleKey
	} from '$lib/features/recipes/components/consts';
	import { updateAisleOrder } from '$lib/features/user-settings/actions/update-aisle-order';
	import PillSelect from '$lib/shared/components/PillSelect.svelte';
	import SheetResponsive from '$lib/shared/components/SheetResponsive.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Label } from '$lib/shared/components/ui/label';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import type { PersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import {
		BetweenHorizonalEnd,
		Grid3x3,
		GripVertical,
		List,
		PanelBottom,
		Settings2
	} from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';

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

	const userState = getUserState();

	type AisleDndItem = { id: SupermarketAisleKey };
	// svelte-dnd-action needs `{ id }` items, the aisle key doubles as the id.
	// Single writable array: the same reference feeds both the zone and the
	// each-block, and the handlers assign `e.detail.items` back directly
	// (preserving object identities) so the library can track the dragged element.
	let dndItems = $state<AisleDndItem[]>(
		resolveSupermarketAisleOrder(userState.preferences?.aisle_order).map((key) => ({ id: key }))
	);

	// Keep local order in sync with the saved preference (initial load, refresh
	// after save). Keyed on the saved order so in-progress drags are untouched.
	let lastSyncedAisleOrder = $state<string | null>(null);
	$effect(() => {
		const saved = resolveSupermarketAisleOrder(userState.preferences?.aisle_order);
		if (saved.join() === lastSyncedAisleOrder) return;
		lastSyncedAisleOrder = saved.join();
		dndItems = saved.map((key) => ({ id: key }));
	});

	function handleDndConsider(e: { detail: { items: AisleDndItem[] } }) {
		if (e.detail.items.length < 2) return;
		dndItems = e.detail.items;
	}

	async function handleDndFinalize(e: { detail: { items: AisleDndItem[] } }) {
		if (e.detail.items.length < 2) return;
		dndItems = e.detail.items;

		// Skip the write when the order didn't change
		const next = dndItems.map((item) => item.id);
		const saved = resolveSupermarketAisleOrder(userState.preferences?.aisle_order);
		if (next.join() === saved.join()) return;

		const userId = userState.user?.id;
		if (!userId) return;

		try {
			await updateAisleOrder(userId, next);
			await userState.refresh();
		} catch {
			// Error already toasted in the action; revert to the saved order
			dndItems = saved.map((key) => ({ id: key }));
		}
	}
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

<SheetResponsive bind:open title="Shopping view" description="Make it look just right" side="right">
	<!-- Plain overflow-auto (per vaul-svelte docs) so the drawer content scrolls natively -->
	<div class="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
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

			<div class="grid space-y-3">
				<Label class="text-base font-semibold">Aisle order</Label>

				<!-- Opt out of the drawer's drag-to-close gesture so aisle drags don't move the drawer -->
				<div
					class="grid gap-1"
					data-vaul-no-drag
					use:dragHandleZone={{
						items: dndItems,
						flipDurationMs: 200,
						delayTouchStart: 300,
						dropTargetStyle: {
							'outline-width': '0px',
							'background-color': '#c9644210',
							outline: 'rgba(201, 100, 66, 0.4) solid 4px'
						},
						type: 'shopping-aisles'
					}}
					onconsider={handleDndConsider}
					onfinalize={handleDndFinalize}
				>
					{#each dndItems as item (item.id)}
						{@const header = supermarketAisleSectionHeaders[item.id]}
						<div animate:flip={{ duration: 200 }}>
							<div
								class="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1.5 pl-4 shadow-xs"
							>
								<header.icon class="size-5 shrink-0 text-muted-foreground mr-2" />
								<span class="min-w-0 flex-1 truncate text-sm">{header.title}</span>
								<div use:dragHandle class="flex shrink-0 cursor-grab active:cursor-grabbing p-1">
									<GripVertical class="size-4 text-muted-foreground" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="bg-muted rounded-md p-3 text-muted-foreground text-xs text-center w-full md:mt-6">
				<strong>Tip:</strong> long-press an item on mobile to view linked recipes.
			</div>
		</div>
	</div>
</SheetResponsive>
