<script lang="ts">
	import { Globe } from '@lucide/svelte';

	type Props = {
		badgeClass?: string;
		logoClass?: string;
		withBlogsPill?: boolean;
	};

	let { badgeClass = 'size-10', logoClass = 'size-5', withBlogsPill = true }: Props = $props();

	const sources = [
		{ name: 'YouTube', src: '/sources/youtube.svg' },
		{ name: 'TikTok', src: '/sources/tiktok.svg' },
		{ name: 'Instagram', src: '/sources/instagram.svg' },
		{ name: 'X', src: '/sources/x.svg' },
		{ name: 'Facebook', src: '/sources/facebook.svg' }
	];
</script>

<div class="flex items-center">
	{#each sources as source, i (source.name)}
		<span
			title={source.name}
			style="z-index: {sources.length - i}; margin-left: {i === 0 ? '0' : '-0.5rem'}"
			class="flex {badgeClass} items-center justify-center rounded-full bg-white dark:bg-accent-foreground shadow-sm ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-1 hover:scale-110"
		>
			<img
				src={source.src}
				alt="{source.name} logo"
				class={logoClass}
				loading="lazy"
				draggable="false"
			/>
		</span>
	{/each}
	{#if withBlogsPill}
		<span
			title="Any blog or website"
			style="z-index: 0; margin-left: -0.5rem;"
			class="flex h-10 items-center gap-1 rounded-full bg-white dark:bg-accent-foreground py-0 pr-3.5 pl-4 text-xs font-medium whitespace-nowrap text-muted-foreground dark:text-muted shadow-sm ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-1"
		>
			<Globe class="size-4" />
			websites
		</span>
	{/if}
</div>
