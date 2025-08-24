<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { cn } from '$lib/utils';
	import { LoaderCircle, Search, X } from 'lucide-svelte';

	let { value = $bindable(''), loading = false, class: className = '', ...others } = $props();

	let inputRef: any;

	function focusInput() {
		inputRef && inputRef.focus();
	}
</script>

<div class={cn('relative', className)}>
	{#if loading}
		<LoaderCircle
			class="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10 animate-spin"
			onclick={focusInput}
		/>
	{:else}
		<Search
			class="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10"
			onclick={focusInput}
		/>
	{/if}

	<Input
		{...others}
		type="text"
		placeholder="Search recipes..."
		class="pl-10 pr-3 py-2"
		bind:value
		bind:this={inputRef}
	/>

	{#if value}
		<Button
			size="icon"
			variant="ghost"
			class="size-6 absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
			onclick={() => (value = '')}
		>
			<X class="size-4" />
		</Button>
	{/if}
</div>
