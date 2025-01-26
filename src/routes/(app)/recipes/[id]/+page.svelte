<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Heart from 'lucide-svelte/icons/heart';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import { Camera, Pencil } from 'lucide-svelte';
	import { DocState } from '$lib/shared/db/doc-state.svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		recipeDocConverter,
		type DBRecipeDoc,
		type RecipeDoc
	} from '$lib/features/recipes/db/recipe-doc';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { page } from '$app/state';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import Separator from '$lib/shared/components/ui/separator/separator.svelte';

	// Load the recipe document
	const pageRecipeId = page.params.id;
	let recipeDocState = new DocState<RecipeDoc, DBRecipeDoc>(
		firestore,
		`recipes/${pageRecipeId}`,
		recipeDocConverter
	);

	const userDocState = getUserDocState();

	let doc = $derived(recipeDocState.data);
</script>

<div class="w-full flex flex-col">
	<main class="grid flex-1 items-start gap-4 md:gap-8">
		<div class="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
			<div class="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					class="h-7 w-7"
					onclick={() => {
						if (window) window.history.back();
					}}
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="sr-only">Back</span>
				</Button>

				<h1
					class="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0"
				>
					Recipe
				</h1>

				{#if doc?.status == 'draft'}
					<Badge class="ml-auto sm:ml-0 bg-yellow-600 text-white dark:bg-yellow-900">Draft</Badge>
				{/if}

				<div class="hidden items-center gap-2 md:ml-auto md:flex">
					{#if doc?.author.uid == userDocState.user?.uid}
						<Button variant="outline" size="sm" href={'/recipes/' + pageRecipeId + '/edit'}>
							<Pencil class="size-3.5" />
							Edit
						</Button>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
				<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
					<Carousel.Root class="w-full relative">
						<Carousel.Content>
							{#each doc?.imageUrls || [] as url, i (url)}
								<Carousel.Item>
									<Card.Root>
										<img
											src={url}
											alt="Recipe"
											class="w-full aspect-[1.618] object-cover rounded-md"
										/>
									</Card.Root>
								</Carousel.Item>
							{/each}
						</Carousel.Content>

						<div
							class="absolute top-4 right-4 bg-black/40 text-white flex items-center px-2 py-0.5 rounded-sm"
						>
							{doc?.imageUrls?.length || 1}
							<Camera class="size-4 ml-1.5" />
						</div>

						<Carousel.Previous class="absolute left-4" />
						<Carousel.Next class="absolute right-4" />
					</Carousel.Root>

					<div class="space-y-2">
						<h1 class="text-3xl font-bold">{doc?.title || 'Loading...'}</h1>
						<h3 class="text-lg text-muted-foreground">{doc?.description || ''}</h3>
					</div>

					<div class="rounded-md bg-muted flex items-center p-2">
						<div class="grid gap-1 w-full text-center">
							<p class="font-semibold text-sm">Prep</p>
							<span class="text-sm">{doc?.time.prep} min</span>
						</div>
						<Separator orientation="vertical" class="bg-muted-foreground h-10" />
						<div class="grid gap-1 w-full text-center">
							<p class="font-semibold text-sm">Cook</p>
							<span class="text-sm">{doc?.time.cook} min</span>
						</div>
						<Separator orientation="vertical" class="bg-muted-foreground h-10" />
						<div class="grid gap-1 w-full text-center">
							<p class="font-semibold text-sm">Rest</p>
							<span class="text-sm">{doc?.time.rest} min</span>
						</div>
					</div>
				</div>
				<div class="grid auto-rows-max items-start gap-4 lg:gap-8">Hey</div>
			</div>

			<div
				class="justify-center flex-1 items-center gap-0.5 text-center text-xs text-muted-foreground"
			>
				<p>Recipe id: {pageRecipeId}</p>
				<p>Status: {doc?.status}</p>
			</div>
		</div>
	</main>
</div>
