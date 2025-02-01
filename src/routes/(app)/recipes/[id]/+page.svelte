<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import {
		ArrowUpRight,
		BicepsFlexed,
		CalendarPlus,
		Camera,
		Equal,
		ForkKnife,
		Globe,
		Grid,
		HandCoins,
		Leaf,
		LeafyGreen,
		List,
		Pencil,
		Plus,
		Salad
	} from 'lucide-svelte';
	import { DocState } from '$lib/shared/db/doc-state.svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		DishesLevel,
		recipeCuisines,
		recipeDocConverter,
		recipeFoodTypes,
		RecipeHealthyLevel,
		RecipeMotivationLevel,
		recipeTimesOfDay,
		type DBRecipeDoc,
		type RecipeDoc,
		type RecipeIngredient
	} from '$lib/features/recipes/db/recipe-doc';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { page } from '$app/state';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { capitalize } from '$lib/utils';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';

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

<div class="w-full flex flex-col mb-20">
	<main class="grid flex-1 items-start gap-4 md:gap-8">
		<div class="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
			<!-- <div class="flex items-center gap-4">
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
			</div> -->

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

						<div class="flex">
							<div class="mr-auto flex items-center gap-2 p-1 rounded-sm text-sm">
								<UserAvatar profile={doc?.author?.profile} class="ml-auto size-5" />
								<span class="">Added by {'@' + doc?.author?.profile.userName}</span>
							</div>
							{#if doc?.source?.domain && doc?.source?.domain != 'cuicuit.fr'}
								<Button
									class="p-0 gap-1"
									variant="link"
									href={doc?.source.url}
									target="_blank"
									rel="noopener"
								>
									View on {doc?.source.name}
									<ArrowUpRight class="size-4 inline-block ml-1" />
								</Button>
							{/if}
						</div>
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

					<div class="grid grid-cols-3 gap-6 justify-items-center">
						{#snippet recipeFilter(Icon: any, title: string, value: string)}
							<div class="flex gap-4 w-40">
								<div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
									<Icon class="size-5" />
								</div>
								<div class="flex flex-col gap-0.5">
									<span class="text-xs text-muted-foreground">{title}</span>
									<span class="text-sm font-semibold">{value}</span>
								</div>
							</div>
						{/snippet}

						{@render recipeFilter(
							ForkKnife,
							'Category',
							doc?.timeOfDay ? recipeTimesOfDay[doc.timeOfDay] : 'Unknown'
						)}

						{@render recipeFilter(
							Salad,
							'Type',
							doc?.foodType ? recipeFoodTypes[doc.foodType] : 'Unknown'
						)}

						{@render recipeFilter(
							Globe,
							'Cuisine',
							doc?.cuisine ? recipeCuisines[doc.cuisine] : 'Unknown'
						)}

						{@render recipeFilter(
							BicepsFlexed,
							'Motivation',
							capitalize(RecipeMotivationLevel[doc?.motivationLevel || 3])
						)}

						{@render recipeFilter(
							LeafyGreen,
							'Healthy',
							capitalize(RecipeHealthyLevel[doc?.healthyLevel || 3])
						)}

						{@render recipeFilter(
							HandCoins,
							'Dishes',
							capitalize(DishesLevel[doc?.dishesLevels.hand || 3])
						)}
					</div>

					<div class="grid mt-6 space-y-6">
						<h2 class="text-xl font-semibold">Steps</h2>

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

				<div class="grid auto-rows-max items-start gap-x-4 gap-y-12">
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
									<div class="bg-muted aspect-square rounded-md min-w-10"></div>
									<div class="flex-1">
										<span class="text-sm font-medium">{ing.name}</span>
										<span class="text-xs text-balance line-clamp-2">
											{ing.amount + ' ' + (ing.unit == 'whole' ? '' : ing.unit)}
										</span>
									</div>
								</div>
							{/snippet}

							<div class="w-full grid gap-y-2">
								{#each doc?.ingredients || [] as ing, i (ing.name)}
									{@render ingredientList(ing)}
								{/each}
							</div>
						{/if}
					</div>

					<div class="grid space-y-4">
						<div class="flex gap-2 items-center">
							<h2 class="text-xl font-semibold">Plan</h2>

							<ButtonThemed size="sm" type="submit" class="flex gap-2 ml-auto">
								<CalendarPlus class="size-4" />
								Add to plan
							</ButtonThemed>
						</div>

						<div
							class="flex items-center justify-center text-muted-foreground text-sm p-4 rounded-md border"
						>
							This recipe is not in your plan yet.
						</div>
					</div>

					<div class="grid space-y-4">
						<h2 class="text-xl font-semibold">Nutrition</h2>
						<div class="grid grid-cols-2 gap-4">TODO</div>
					</div>

					<div class="grid space-y-4">
						<h2 class="text-xl font-semibold">History</h2>
						<div class="grid grid-cols-2 gap-4">TODO History of personal makes</div>
					</div>
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
