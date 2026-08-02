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
			'w-full rounded-lg flex items-center justify-center transition-colors text-muted dark:text-muted-foreground/40 text-5xl',
			className
		)
			el.insertAdjacentHTML('afterend', `<div class="${classes}">${name ? name.charAt(0).toUpperCase() : '?'}</div>`);
		}}
	/>
{:else}
	<div
		class={cn(
			'w-full bg-muted rounded-lg flex items-center justify-center transition-colors text-muted dark:text-muted-foreground/40 text-5xl',
			className
		)}
	>
		{name ? name.charAt(0).toUpperCase() : '?'}
	</div>
{/if}
