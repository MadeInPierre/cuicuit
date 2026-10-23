<script lang="ts">
	interface Props {
		data: unknown;
	}

	const { data }: Props = $props();

	// Escape HTML-significant characters so the JSON can never close the script tag.
	const json = $derived(
		JSON.stringify(data)
			.replaceAll('&', '\\u0026')
			.replaceAll('<', '\\u003c')
			.replaceAll('>', '\\u003e')
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags, no-useless-escape -->
	{@html `<script type="application/ld+json">${json}<\/script>`}
</svelte:head>
