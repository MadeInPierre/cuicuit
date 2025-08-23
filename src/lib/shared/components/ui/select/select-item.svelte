<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import { Select as SelectPrimitive, type WithoutChild } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		side = "left", // 'left' or 'right'
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> & { side?: "left" | "right" } = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	class={cn(
		"data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		side === "right" ? "pl-2 pr-8" : "",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		{#if side === "left"}
			<span class="absolute left-2 flex size-3.5 items-center justify-center">
				{#if selected}
					<Check class="size-4" />
				{/if}
			</span>
		{:else}
			<span class="absolute right-2 flex size-3.5 items-center justify-center">
				{#if selected}
					<Check class="size-4" />
				{/if}
			</span>
		{/if}
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
