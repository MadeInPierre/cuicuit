<script>
	import { Input } from '$lib/shared/components/ui/input';
	import { cn } from '$lib/utils';
	import { LoaderCircle, Search } from 'lucide-svelte';

	let { value = $bindable(''), loading = false, class: className = '', ...others } = $props();
</script>

<div class={cn('relative', className)}>
	{#if loading}
		<LoaderCircle
			class="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10 animate-spin"
		/>
	{:else}
		<Search
			class="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10"
		/>
	{/if}

	<Input
		{...others}
		type="text"
		placeholder="Search recipes..."
		class="pl-10 pr-3 py-2"
		bind:value
	/>
</div>
