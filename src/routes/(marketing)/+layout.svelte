<script>
	import SiteHeader from '$lib/features/marketing/components/SiteHeader.svelte';
	import NavContent from '$lib/features/marketing/components/navbar/MarketingNavbar.svelte';

	let { children, data } = $props();
</script>

<SiteHeader>
	<NavContent isLoggedIn={!!data.claims?.sub} />
</SiteHeader>

{@render children()}
