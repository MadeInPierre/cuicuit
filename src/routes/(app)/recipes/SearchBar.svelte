<script lang="ts">
	import * as InputGroup from '$lib/shared/components/ui/input-group/index.js';
	import { cn } from '$lib/utils';
	import { Mic, SearchIcon, X } from '@lucide/svelte';

	let { value = $bindable(''), loading = false, class: className = '', ...others } = $props();

	let inputRef: any;

	function focusInput() {
		inputRef && inputRef.focus();
	}
</script>

<InputGroup.Root
	class={cn('h-9 bg-white dark:bg-muted border-none shadow-2xs', className)}
	{...others}
>
	<InputGroup.Input class="" placeholder="Search recipes..." bind:value bind:this={inputRef} />
	<InputGroup.Addon>
		<SearchIcon />
	</InputGroup.Addon>
	{#if value}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				aria-label="Clear search"
				title="Clear search"
				size="icon-xs"
				onclick={() => {
					value = '';
					inputRef?.focus();
				}}
				tabindex={-1}
			>
				<X />
			</InputGroup.Button>
		</InputGroup.Addon>
	{:else}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				size="icon-xs"
				onclick={() => {
					value = '';
					inputRef?.focus();
				}}
				tabindex={-1}
			>
				<Mic />
			</InputGroup.Button>
		</InputGroup.Addon>
	{/if}
</InputGroup.Root>
