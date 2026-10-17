<script lang="ts">
	import SupportWall from './SupportWall.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>Support Cuicuit — Recipe imports for you and the community</title>
	<meta
		name="description"
		content="Support independent, open-source cooking from €3, $3 or £3. Get recipe imports for yourself and help fund imports for the community."
	/>
</svelte:head>

<div class="mx-auto max-w-250 overflow-hidden bg-background">
	<SupportWall email={data.claims?.email || null} />
</div>
