<script lang="ts">
	import SupportWall from './SupportWall.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>Support Cuicuit — Plant a few seeds</title>
	<meta
		name="description"
		content="Support independent, open-source cooking. Choose a contribution from 3 and grow recipe imports for you and the community."
	/>
</svelte:head>

<div class="mx-auto max-w-250 overflow-hidden bg-background">
	<SupportWall email={data.claims?.email || null} />
</div>
