<script>
	import SiteHeader from '$lib/features/marketing/components/SiteHeader.svelte';
	import NavContent from '$lib/features/marketing/components/navbar/MarketingNavbar.svelte';

	let { children } = $props();
</script>

<SiteHeader>
	<NavContent />
</SiteHeader>

{@render children()}
