<script lang="ts">
	import { Equal, Plus } from '@lucide/svelte';
	import { Skeleton } from '$lib/shared/components/ui/skeleton/index.js';

	type Props = {
		prep: number | null;
		cook: number | null;
		rest: number | null;
		total: number | null;
	};

	let { prep, cook, rest, total }: Props = $props();
</script>

{#if total == null}
	<Skeleton class="h-12 w-full rounded-lg" />
{:else}
	<div class="rounded-lg bg-muted flex items-center p-2">
		<div class="w-full flex flex-col">
			<span class="text-[7pt] text-muted-foreground text-center font-bold"> PREP </span>
			<div class="flex justify-center items-center text-center text-xl font-bold h-6">
				{prep || 0}
				<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
			</div>
		</div>
		<Plus class="min-w-4 size-4 text-muted-foreground" />
		<div class="w-full flex flex-col">
			<span class="text-[7pt] text-muted-foreground text-center font-bold"> COOK </span>
			<div class="flex justify-center items-center text-center text-xl font-bold h-6">
				{cook || 0}
				<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
			</div>
		</div>
		<Plus class="min-w-4 size-4 text-muted-foreground" />
		<div class="w-full flex flex-col">
			<span class="text-[7pt] text-muted-foreground text-center font-bold"> REST </span>
			<div class="flex justify-center items-center text-center text-xl font-bold h-6">
				{rest || 0}
				<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
			</div>
		</div>
		<Equal class="min-w-4 size-4" />
		<div class="w-full flex flex-col">
			<span class="text-[7pt] text-muted-foreground text-center font-bold"> TOTAL </span>
			<div class="flex justify-center items-center text-center text-xl font-bold h-6">
				{total || 0}
				<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
			</div>
		</div>
	</div>
{/if}
