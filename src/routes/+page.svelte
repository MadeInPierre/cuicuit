<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let counter = $state(0);
</script>

<Button onclick={() => counter++}>
	{counter} click{counter === 1 ? '' : 's'}
</Button>
