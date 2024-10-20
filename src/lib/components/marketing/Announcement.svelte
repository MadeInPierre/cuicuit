<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { Icons } from '$lib/icons';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		message?: string;
		class?: string;
	}

	let { message = 'Announcement!', class: className }: Props = $props();

	// Launch the transition on page load
	let visible = $state(false);
	onMount(() => {
		visible = true;
	});
</script>

{#if visible}
	<a
		href="/changelog"
		class={cn(
			'inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium',
			className
		)}
		in:fly={{ y: -5 }}
	>
		🎉 <Separator class="mx-2 h-4" orientation="vertical" />

		<!-- Message for small screens -->
		<span class="sm:hidden"> {message} </span>

		<!-- Message for big screens -->
		<span class="hidden sm:inline"> {message} </span>
		<Icons.arrowRight class="ml-1 h-4 w-4" />
	</a>
{:else}
	<div class="py-1 text-sm">&nbsp;</div>
{/if}
