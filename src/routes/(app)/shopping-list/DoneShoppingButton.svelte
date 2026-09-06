<script lang="ts">
	import { updatePlanItemDeleted } from '$lib/features/plans/actions/update-item';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Check } from '@lucide/svelte';
	import posthog from 'posthog-js';
	import { toast } from 'svelte-sonner';

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
			await Promise.all(
				activeSpace.activePlanItems
					?.filter((item) => item.checked_at)
					.map((item) =>
						updatePlanItemDeleted(activeSpace, item.id, true, {
							hideToast: true,
							skipRefresh: true
						})
					) ?? []
			);

			await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
			await activeSpace.refreshActivePlanMeals();
			toast.success('All done!', { description: 'Shopping items marked bought.' });
			posthog.capture('shopping_completed');
			onclick();
		}}
	>
		<Check class="size-4 mr-2" />
		Done shopping
	</Button>
{/if}
