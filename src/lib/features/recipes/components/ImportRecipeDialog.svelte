<script lang="ts">
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { Download, FileImage, FileText, Globe, Pencil } from 'lucide-svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import ImportRecipeUrlForm from './ImportRecipeUrlForm.svelte';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

	type Props = {
		trigger?: Snippet<[any]> | undefined;
		openDialog?: boolean;
		recipeId?: string | undefined;
		dropdownAlign?: 'start' | 'center' | 'end';
	};

	let {
		trigger = undefined,
		openDialog = $bindable(false),
		recipeId = undefined,
		dropdownAlign = 'start'
	}: Props = $props();

	let activeTab: 'url' | 'image' | 'text' = $state('url');

	const userDocState = getUserDocState();
</script>

{#snippet tabList()}
	<Tabs.List class="grid w-full grid-cols-3 mt-6 mb-4">
		<Tabs.Trigger value="url">
			<Globe class="mr-2 size-4" />
			Web
		</Tabs.Trigger>
		<Tabs.Trigger value="image">
			<FileImage class="mr-2 size-4" />
			Image
		</Tabs.Trigger>
		<Tabs.Trigger value="text">
			<FileText class="mr-2 size-4" />
			Text
		</Tabs.Trigger>
	</Tabs.List>
{/snippet}

<Dialog.Root bind:open={openDialog}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				{#if trigger}
					{@render trigger({ props })}
				{:else}
					<ButtonThemed {...props} class="ml-auto" size="sm">
						<Download class="mx-2 h-4 w-4" />
						<span>Import</span>
					</ButtonThemed>
				{/if}
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-[200px]" align={dropdownAlign}>
			<DropdownMenu.Item
				onclick={async () => {
					// const recipeId = await createDraftRecipe(userDocState)
					goto(`/recipes/new/edit`);
				}}
			>
				<Pencil class="mr-2 h-4 w-4" />
				<span>Create new...</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					activeTab = 'url';
					openDialog = true;
				}}
			>
				<Globe class="mr-2 h-4 w-4" />
				<span>From the web...</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					activeTab = 'image';
					openDialog = true;
				}}
			>
				<FileImage class="mr-2 h-4 w-4" />
				<span>Photo or PDF...</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					activeTab = 'text';
					openDialog = true;
				}}
			>
				<FileText class="mr-2 h-4 w-4" />
				<span>Text or document...</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Dialog.Content class="max-w-[425px]">
		<Tabs.Root bind:value={activeTab}>
			<Tabs.Content value="url" class="">
				<Dialog.Header class="w-min whitespace-nowrap">
					<Dialog.Title class="flex gap-2 items-center">
						<Globe class="size-5" />
						Import from the web
					</Dialog.Title>
					<Dialog.Description>
						Grab the link of any recipe out there and paste it here.
					</Dialog.Description>
				</Dialog.Header>

				{@render tabList()}

				<ImportRecipeUrlForm bind:openDialog {recipeId} />
			</Tabs.Content>

			<Tabs.Content value="image" class="">
				<Dialog.Header class="w-min whitespace-nowrap">
					<Dialog.Title class="flex gap-2 items-center">
						<FileImage class="size-5" />
						Import from a photo
					</Dialog.Title>
					<Dialog.Description>Upload a photo or PDF of a recipe to import it.</Dialog.Description>
				</Dialog.Header>

				{@render tabList()}

				TODO
			</Tabs.Content>

			<Tabs.Content value="text" class="">
				<Dialog.Header class="w-min whitespace-nowrap">
					<Dialog.Title class="flex gap-2 items-center">
						<FileText class="size-5" />
						Import from a document
					</Dialog.Title>
					<Dialog.Description>
						Paste the text of a recipe or document to import it.
					</Dialog.Description>
				</Dialog.Header>

				{@render tabList()}

				TODO
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
