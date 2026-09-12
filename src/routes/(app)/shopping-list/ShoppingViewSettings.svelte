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
		ChevronDown,
		ChevronUp,
		Grid3x3,
		List,
		PanelBottom,
		Settings2
	} from '@lucide/svelte';
	import { flip } from 'svelte/animate';

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

	let aisleOrder = $state<SupermarketAisleKey[]>(
		resolveSupermarketAisleOrder(userState.preferences?.aisle_order)
	);

	// Keep local order in sync with the saved preference (initial load, refresh
	// after save).
	let lastSyncedAisleOrder = $state<string | null>(null);
	$effect(() => {
		const saved = resolveSupermarketAisleOrder(userState.preferences?.aisle_order);
		if (saved.join() === lastSyncedAisleOrder) return;
		lastSyncedAisleOrder = saved.join();
		aisleOrder = saved;
	});

	async function moveAisle(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= aisleOrder.length) return;

		const next = [...aisleOrder];
		[next[index], next[nextIndex]] = [next[nextIndex], next[index]];
		aisleOrder = next;

		const userId = userState.user?.id;
		if (!userId) return;

		try {
			await updateAisleOrder(userId, next);
			await userState.refresh();
		} catch {
			// Error already toasted in the action; revert to the saved order
			aisleOrder = resolveSupermarketAisleOrder(userState.preferences?.aisle_order);
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

				<div class="grid gap-1">
					{#each aisleOrder as aisleKey, index (aisleKey)}
						{@const header = supermarketAisleSectionHeaders[aisleKey]}
						<div
							class="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1.5 pl-4 shadow-xs"
							animate:flip={{ duration: 150 }}
						>
							<header.icon class="size-4 shrink-0 text-muted-foreground mr-2" />
							<span class="min-w-0 flex-1 truncate text-sm">{header.title}</span>
							<div class="flex shrink-0 items-center">
								<Button
									variant="ghost"
									size="icon"
									class="size-6"
									disabled={index === 0}
									onclick={() => moveAisle(index, -1)}
									aria-label={`Move ${header.title} up`}
								>
									<ChevronUp class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-6"
									disabled={index === aisleOrder.length - 1}
									onclick={() => moveAisle(index, 1)}
									aria-label={`Move ${header.title} down`}
								>
									<ChevronDown class="size-4" />
								</Button>
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
