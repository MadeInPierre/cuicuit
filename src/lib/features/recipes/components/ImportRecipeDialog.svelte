<script lang="ts">
	import DialogResponsive from '$lib/shared/components/DialogResponsive.svelte';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { FileImage, FileText, Globe, Pencil } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import CreateRecipeManualForm from './CreateRecipeManualForm.svelte';
	import ImportRecipeFromTextForm from './ImportRecipeFromTextForm.svelte';
	import ImportRecipeUrlForm from './ImportRecipeUrlForm.svelte';

	type Props = {
		trigger?: Snippet<[any]> | undefined;
		openDialog?: boolean;
	};

	let { trigger = undefined, openDialog = $bindable(false) }: Props = $props();

	let activeTab: 'url' | 'image' | 'text' = $state('url');

	const media = useMedia();
</script>

{#snippet tabList()}
	<Tabs.List class="grid w-full grid-cols-4 mt-6 mb-4">
		<Tabs.Trigger value="url">
			<Globe class="mr-2 size-4" />
			Web
		</Tabs.Trigger>
		<Tabs.Trigger value="text">
			<FileText class="mr-2 size-4" />
			Text
		</Tabs.Trigger>
		<Tabs.Trigger value="image">
			<FileImage class="mr-2 size-4" />
			Image
		</Tabs.Trigger>
		<Tabs.Trigger value="manual">
			<Pencil class="mr-2 size-4" />
			Manual
		</Tabs.Trigger>
	</Tabs.List>
{/snippet}

<DialogResponsive {trigger} bind:open={openDialog}>
	{#snippet content()}
		<Tabs.Root bind:value={activeTab}>
			<Tabs.Content value="url" class="">
				<Dialog.Header class="w-full whitespace-nowrap my-4 sm:mt-0">
					<Dialog.Title class="flex gap-2 items-center justify-center sm:justify-start">
						<Globe class="size-5" />
						Import from the web
					</Dialog.Title>
					<Dialog.Description class="text-center sm:text-left">
						Grab the link of any recipe out there and paste it here.
					</Dialog.Description>
				</Dialog.Header>

				{#if media.md}
					{@render tabList()}
				{/if}

				<ImportRecipeUrlForm bind:openDialog />
			</Tabs.Content>

			<Tabs.Content value="image" class="">
				<Dialog.Header class="w-full whitespace-nowrap my-4 sm:mt-0">
					<Dialog.Title class="flex gap-2 items-center justify-center sm:justify-start">
						<FileImage class="size-5" />
						Import from a photo
					</Dialog.Title>
					<Dialog.Description class="text-center sm:text-left"
						>Upload a photo or PDF of a recipe to import it.</Dialog.Description
					>
				</Dialog.Header>

				{#if media.md}
					{@render tabList()}
				{/if}

				Coming soon!
			</Tabs.Content>

			<Tabs.Content value="text" class="">
				<Dialog.Header class="w-full whitespace-nowrap my-4 sm:mt-0">
					<Dialog.Title class="flex gap-2 items-center justify-center sm:justify-start">
						<FileText class="size-5" />
						Import from a document
					</Dialog.Title>
					<Dialog.Description class="text-center sm:text-left">
						Paste the text of a recipe or document to import it.
					</Dialog.Description>
				</Dialog.Header>

				{#if media.md}
					{@render tabList()}
				{/if}

				<ImportRecipeFromTextForm bind:openDialog />
			</Tabs.Content>

			<Tabs.Content value="manual" class="">
				<Dialog.Header class="w-full whitespace-nowrap my-4 sm:mt-0">
					<Dialog.Title class="flex gap-2 items-center justify-center sm:justify-start">
						<Pencil class="size-5" />
						Create manually
					</Dialog.Title>
					<Dialog.Description class="text-center sm:text-left">
						Start with a blank recipe and fill in the details yourself.
					</Dialog.Description>
				</Dialog.Header>

				{#if media.md}
					{@render tabList()}
				{/if}

				<CreateRecipeManualForm bind:openDialog />
			</Tabs.Content>

			{#if !media.md}
				{@render tabList()}
			{/if}
		</Tabs.Root>
	{/snippet}
</DialogResponsive>
