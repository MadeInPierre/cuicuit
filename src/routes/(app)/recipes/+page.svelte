<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { Plus, SquarePen, Download } from 'lucide-svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="space-y-6 p-10 pb-16">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Recipes</h2>
			<p class="text-muted-foreground">
				Here's your daily dose of inspiration. Add a recipe to get started.
			</p>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<ButtonThemed builders={[builder]} class="ml-auto">
					<Plus class="size-4 mr-2" />
					Add
				</ButtonThemed>
				<!-- <Button builders={[builder]} variant="outline">Open</Button> -->
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-52" align="end">
				<!-- <DropdownMenu.Label>Add a recipe</DropdownMenu.Label> -->
				<!-- <DropdownMenu.Separator /> -->
				<!-- <DropdownMenu.Group> -->
				<DropdownMenu.Item href="/recipes/new">
					<SquarePen class="mr-2 h-4 w-4" />
					<span>Create manually</span>
					<!-- <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut> -->
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled>
					<Download class="mr-2 h-4 w-4" />
					<span>Web import</span>
					<DropdownMenu.Shortcut class="tracking-normal">Coming soon</DropdownMenu.Shortcut>
				</DropdownMenu.Item>
				<!-- </DropdownMenu.Group> -->
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<Separator class="my-6" />

	{@render children?.()}
</div>
