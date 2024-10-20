<script>
	import SiteHeader from '$lib/components/common/SiteHeader.svelte';
	import NavContent from '$lib/components/marketing/header/HeaderContent.svelte';

	let { children } = $props();
</script>

<SiteHeader><NavContent /></SiteHeader>

{@render children()}
