<script>
	import SupportWall from './SupportWall.svelte';

	const { data } = $props();
</script>

<div class="mx-auto max-w-250 overflow-hidden bg-background">

    <SupportWall email={data.claims?.email || null}  />
</div>
