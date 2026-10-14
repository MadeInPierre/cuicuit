<script lang="ts">
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { cn } from '$lib/utils';

	type Props = {
		id: string | null;
		name?: string | null;
		class?: string;
	};

	const { id, name = null, class: className }: Props = $props();

	let imgFailed = $state(false);

	// Reset on navigation between ingredients (same component instance).
	$effect(() => {
		void id;
		imgFailed = false;
	});

	const letter = $derived(name ? name.charAt(0).toUpperCase() : '?');
</script>

{#if id && !imgFailed}
	<img
		src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/ingredients/images/${id}.jpg`}
		alt={name}
		crossorigin="anonymous"
		loading="lazy"
		decoding="async"
		class={cn('aspect-square w-full object-contain rounded-lg p-0.5', className)}
		onerror={() => (imgFailed = true)}
	/>
{:else}
	<div
		class={cn(
			'w-full flex items-center justify-center transition-colors text-muted dark:text-muted-foreground/40 text-5xl',
			className
		)}
	>
		{letter}
	</div>
{/if}
