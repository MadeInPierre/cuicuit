<script lang="ts">
	import { updatePlanItemDeleted } from '$lib/features/plans/actions/update-item';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Check } from 'lucide-svelte';

	type Props = {
		onclick?: () => void;
		class?: string;
	};
	let { onclick = () => {}, class: className = '' }: Props = $props();

	const activeSpace = getActiveSpaceState();
</script>

{#if activeSpace.activeShoppingList?.some((si) => si.items.some((item) => item.checked_at))}
	<Button
		class={className}
		variant="default"
		onclick={async () => {
			activeSpace.activePlanItems?.forEach((item) => {
				if (item.checked_at) updatePlanItemDeleted(activeSpace, item.id);
			});

			await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
			await activeSpace.refreshActivePlanMeals();
			onclick();
		}}
	>
		<Check class="size-4 mr-2" />
		Done shopping
	</Button>
{/if}
