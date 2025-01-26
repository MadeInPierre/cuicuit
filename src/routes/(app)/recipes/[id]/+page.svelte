<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Heart from 'lucide-svelte/icons/heart';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import {
		ArrowUpRight,
		Calendar,
		CalendarPlus,
		Camera,
		Clock,
		Equal,
		Grid,
		List,
		Pencil,
		Plus
	} from 'lucide-svelte';
	import { DocState } from '$lib/shared/db/doc-state.svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		recipeDocConverter,
		type DBRecipeDoc,
		type RecipeDoc,
		type RecipeIngredient
	} from '$lib/features/recipes/db/recipe-doc';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { page } from '$app/state';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import Separator from '$lib/shared/components/ui/separator/separator.svelte';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';

	// Load the recipe document
	const pageRecipeId = page.params.id;
	let recipeDocState = new DocState<RecipeDoc, DBRecipeDoc>(
		firestore,
		`recipes/${pageRecipeId}`,
		recipeDocConverter
	);

	const userDocState = getUserDocState();

	let ingredientsView = createPersistentState('view-recipe-ingredients-layout', 'grid');

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
					{#if doc?.author?.uid == userDocState.user?.uid}
						<Button variant="outline" size="sm" href={'/recipes/' + pageRecipeId + '/edit'}>
							<Pencil class="size-3.5" />
							Edit
						</Button>
					{/if}

					<ButtonThemed size="sm" type="submit" class="flex gap-2">
						<CalendarPlus class="size-4" />
						Add to plan
					</ButtonThemed>
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

						{#if (doc?.imageUrls?.length || 1) > 1}
							<Carousel.Previous class="absolute left-4" />
							<Carousel.Next class="absolute right-4" />
						{/if}
					</Carousel.Root>

					<div class="space-y-2">
						<h1 class="text-3xl font-bold">{doc?.title || 'Loading...'}</h1>
						<h3 class="text-lg text-muted-foreground">{doc?.description || ''}</h3>

						{#if doc?.source?.domain != 'cuicuit.fr'}
							<Button
								class="p-0 gap-1"
								variant="link"
								href={doc?.source.url}
								target="_blank"
								rel="noopener"
							>
								View the original recipe on {doc?.source.name}
								<ArrowUpRight class="size-4 inline-block ml-1" />
							</Button>
						{/if}
					</div>

					<div class="rounded-lg bg-muted flex items-center p-2">
						<div class="w-full flex flex-col">
							<span class="text-[7pt] text-muted-foreground text-center font-bold"> PREP </span>
							<div class="flex justify-center items-center text-center text-xl font-bold h-6">
								{doc?.time.prep}
								<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
							</div>
						</div>
						<Plus class="min-w-4 size-4 text-muted-foreground" />
						<div class="w-full flex flex-col">
							<span class="text-[7pt] text-muted-foreground text-center font-bold"> COOK </span>
							<div class="flex justify-center items-center text-center text-xl font-bold h-6">
								{doc?.time.cook}
								<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
							</div>
						</div>
						<Plus class="min-w-4 size-4 text-muted-foreground" />
						<div class="w-full flex flex-col">
							<span class="text-[7pt] text-muted-foreground text-center font-bold"> REST </span>
							<div class="flex justify-center items-center text-center text-xl font-bold h-6">
								{doc?.time.rest}
								<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
							</div>
						</div>
						<Equal class="min-w-4 size-4" />
						<div class="w-full flex flex-col">
							<span class="text-[7pt] text-muted-foreground text-center font-bold"> TOTAL </span>
							<div class="flex justify-center items-center text-center text-xl font-bold h-6">
								{doc?.time.total}
								<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
							</div>
						</div>
					</div>

					<div class="grid space-y-6">
						<h2 class="text-xl font-semibold">Instructions</h2>

						{#each doc?.steps || [] as step, i (step)}
							<div class="flex items-start min-h-12">
								<span
									class="text-md font-semibold text-primary bg-muted rounded-lg size-8 min-w-8 flex justify-center items-center"
								>
									{i + 1}
								</span>
								<span class="ml-4 pt-0.5 text-md">{step.description}</span>
							</div>
						{/each}
					</div>
				</div>

				<div class="grid auto-rows-max items-start gap-4 lg:gap-8">
					<div class="grid space-y-4">
						<h2 class="text-xl font-semibold flex items-center">
							<span class="">Ingredients</span>

							<Button
								variant="ghost"
								disabled={ingredientsView.value === 'grid'}
								size="icon"
								class="ml-auto h-7 w-7"
								onclick={() => {
									ingredientsView.set('grid');
								}}
							>
								<Grid class="min-w-4 h-4" />
								<span class="sr-only">Grid view</span>
							</Button>
							<Button
								variant="ghost"
								disabled={ingredientsView.value === 'list'}
								size="icon"
								class="h-7 w-7"
								onclick={() => {
									ingredientsView.set('list');
								}}
							>
								<List class="min-w-4 h-4" />
								<span class="sr-only">List view</span>
							</Button>
						</h2>

						{#if ingredientsView.value === 'grid'}
							{#snippet ingredientGrid(ing: RecipeIngredient)}
								<div class="flex-1 text-center">
									<div class="bg-muted aspect-square rounded-md mb-2"></div>
									<span class="text-sm font-medium">
										{ing.amount + ' ' + (ing.unit == 'whole' ? '' : ing.unit)}
									</span>
									<span class="text-xs text-balance line-clamp-2 px-1">{ing.name}</span>
								</div>
							{/snippet}

							<div class="w-full grid grid-cols-3 gap-x-2 gap-y-4">
								{#each doc?.ingredients || [] as ing, i (ing.name)}
									{@render ingredientGrid(ing)}
								{/each}
							</div>
						{:else}
							{#snippet ingredientList(ing: RecipeIngredient)}
								<div class="flex items-center gap-2">
									<div class="bg-muted aspect-square rounded-md min-w-14"></div>
									<div class="flex-1">
										<span class="text-sm font-medium">{ing.name}</span>
										<span class="text-xs text-balance line-clamp-2">
											{ing.amount + ' ' + (ing.unit == 'whole' ? '' : ing.unit)}
										</span>
									</div>
								</div>
							{/snippet}

							{#each doc?.ingredients || [] as ing, i (ing.name)}
								{@render ingredientList(ing)}
							{/each}
						{/if}
					</div>

					<!-- <div class="grid space-y-4">
						<h2 class="text-xl font-semibold">Optional</h2>

						<div class="w-full grid grid-cols-3 gap-2">
							<div class="bg-muted aspect-square rounded-md"></div>
							<div class="bg-muted aspect-square rounded-md"></div>
						</div>
					</div> -->
				</div>
			</div>

			<!-- <div
				class="justify-center flex-1 items-center gap-0.5 text-center text-xs text-muted-foreground"
			>
				<p>Recipe id: {pageRecipeId}</p>
				<p>Status: {doc?.status}</p>
			</div> -->
		</div>
	</main>
</div>
