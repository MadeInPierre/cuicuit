<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import * as Popover from '$lib/shared/components/ui/popover';
	import {
		toUnregionizedUnit,
		unitGroups,
		unitLabels,
		unitShortLabels,
		type UnitUnregionized
	} from '$lib/shared/utils/quantity';
	import { cn } from '$lib/utils';
	import { ChevronDown, Mouse } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		unit?: string;
		disabled?: boolean;
		class?: string;
		onchange?: (unit: string) => void;
	};

	let { unit = $bindable('whole'), disabled = false, class: className, onchange }: Props = $props();

	let open = $state(false);
	let hovered: UnitUnregionized | undefined = $state(undefined);
	const selected = $derived(toUnregionizedUnit(unit));

	function selectUnit(next: string) {
		unit = next;
		onchange?.(next);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		<Button
			variant="outline"
			size="sm"
			{disabled}
			class={cn('h-9 justify-between gap-1 bg-muted/60 px-2 font-normal', className)}
			aria-label="Choose unit"
		>
			<span class="truncate">{unitShortLabels[selected]}</span>
			<ChevronDown class="size-3.5 shrink-0 opacity-60" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="relative w-auto max-w-[min(92vw,365px)] p-2" align="start">
		{#if hovered}
			<span
				class="absolute top-2 right-2 text-xs font-medium flex items-center gap-1.5 text-muted-foreground"
				transition:fade={{ duration: 75 }}
			>
				{unitShortLabels[hovered]}
				<Mouse class="size-3" />
			</span>
		{/if}

		<div class="grid gap-3">
			{#each unitGroups as group (group.label)}
				<div class="grid gap-1">
					<p class="text-xs font-medium text-muted-foreground">{group.label}</p>
					<div class="flex flex-wrap gap-1">
						{#each group.units as key (key)}
							<Button
								type="button"
								variant={selected === key ? 'default' : 'outline'}
								size="sm"
								class="h-5 text-xs sm:text-[11px] min-w-9 px-2"
								onclick={() => selectUnit(key)}
								onmouseenter={() => {
									hovered = key;
								}}
								onmouseleave={() => {
									hovered = undefined;
								}}
							>
								{unitLabels[key]}
							</Button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
