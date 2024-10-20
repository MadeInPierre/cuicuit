<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';

	let counter = $state(0);
</script>

<Button onclick={() => counter++ && toast('You clicked!')}>
	{counter} click{counter === 1 ? '' : 's'}
</Button>
