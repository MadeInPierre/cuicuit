<script lang="ts">
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { cn } from '$lib/utils';

	type Props = {
		id: string;
		name: string;
		class?: string;
	};

	const { id, name, class: className }: Props = $props();
</script>

<img
	src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/ingredients/images-marmiton/${id}.jpg`}
	alt={name}
	class={cn('aspect-square w-full object-cover rounded-md', className)}
	onerror={(e) => {
		const el = e.currentTarget as HTMLImageElement;
		el.style.display = 'none';
		el.insertAdjacentHTML(
			'afterend',
			`<div
                class="bg-muted aspect-square w-full rounded-md flex items-center justify-center text-muted-foreground"
            >
                ?
            </div>`
		);
	}}
/>
