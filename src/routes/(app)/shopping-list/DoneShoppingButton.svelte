<script lang="ts">
	import { deletePlanItem } from '$lib/features/plans/actions/update-item';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Check } from 'lucide-svelte';

	type Props = {
		onclick?: () => void;
	};
	let { onclick = () => {} }: Props = $props();

	const activeSpace = getActiveSpaceState();
</script>

<Button
	variant="default"
	onclick={async () => {
		activeSpace.activePlanItems?.forEach((item) => {
			if (item.checked_at) deletePlanItem(activeSpace, item.id);
		});

		await activeSpace.refreshActivePlanItems();
		await activeSpace.refreshActivePlanMeals();
		onclick();
	}}
>
	<Check class="size-4 mr-2" />
	Done shopping
</Button>
