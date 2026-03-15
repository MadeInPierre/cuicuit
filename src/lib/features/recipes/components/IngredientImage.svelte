<script lang="ts">
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { cn } from '$lib/utils';

	type Props = {
		id: string | null;
		name?: string | null;
		class?: string;
	};

	const { id, name = null, class: className }: Props = $props();
</script>

{#if id}
	<img
		src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/ingredients/images-marmiton/${id}.jpg`}
		alt={name}
		class={cn('aspect-square w-full object-contain rounded-lg bg-white p-0.5', className)}
		onerror={(e) => {
			const el = e.currentTarget as HTMLImageElement;
			el.style.display = 'none';

			const classes = cn(
				'bg-muted aspect-square w-full rounded-md flex items-center justify-center text-muted-foreground',
				className
			);
			el.insertAdjacentHTML('afterend', `<div class="${classes}">?</div>`);
		}}
	/>
{:else}
	<div class={cn('w-full flex items-center justify-center text-muted text-6xl', className)}>
		{name ? name.charAt(0).toUpperCase() : '?'}
	</div>
{/if}
