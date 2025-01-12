<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { Plus, SquarePen, Download, CalendarPlus, Users } from 'lucide-svelte';
	import { createDraftRecipe } from '$lib/features/recipes/actions/create-draft-recipe';
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { collection, getDocs, query, where } from 'firebase/firestore';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		recipeDocConverter,
		recipeTimesOfDay,
		type RecipeDoc
	} from '$lib/features/recipes/db/recipe-doc';
	import { cn } from '$lib/utils';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import CardBookmark from '$lib/shared/icons/card-bookmark.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let userDocState = getUserDocState();

	// Get all recipes in the firestore recipes/ collection
	let recipes: { id: string; doc: RecipeDoc }[] = $state([]);
	$effect(() => {
		getRecipes();
	});
	async function getRecipes() {
		const ref = collection(firestore, 'recipes');
		const q = query(ref).withConverter(recipeDocConverter);
		const querySnapshot = await getDocs(q);
		recipes = querySnapshot.docs.map((doc) => {
			return { id: doc.id, doc: doc.data() as RecipeDoc };
		});
	}

	async function onNewRecipe() {
		const recipeId = await createDraftRecipe(userDocState);
		goto('/recipes/edit/' + recipeId);
	}

	let activeSpace = getActiveSpaceState();
</script>

<div class={cn('space-y-6 p-10 pb-16 min-h-full', `bg-${activeSpace.userHeader?.theme}-100/10`)}>
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
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-52" align="end">
				<DropdownMenu.Item onclick={onNewRecipe}>
					<SquarePen class="mr-2 h-4 w-4" />
					<span>Create manually</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled>
					<Download class="mr-2 h-4 w-4" />
					<span>Web import</span>
					<DropdownMenu.Shortcut class="tracking-normal">Coming soon</DropdownMenu.Shortcut>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<Separator class="my-6" />

	<div
		class="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
	>
		{#each recipes as recipe}
			<div
				class="flex flex-col items-start bg-white rounded-md border shadow-sm hover:shadow-lg transition-shadow"
			>
				{#if recipe.doc.imageUrls && recipe.doc.imageUrls.length > 0}
					<a href={'/recipes/edit/' + recipe.id} class="relative">
						<img
							src={recipe.doc.imageUrls[0]}
							alt="Recipe"
							class="aspect-[1.618] rounded-md object-cover"
						/>

						<!-- <UserAvatar
							profile={recipe.doc.author.profile}
							class="absolute bottom-2 right-2 size-5"
						/> -->

						<CardBookmark class="absolute -top-[12px] right-[8px] size-10" />
					</a>
				{:else}
					<div class="w-full aspect-[1.618] bg-gray-200 rounded-md"></div>
				{/if}
				<div class="flex items-center gap-2 p-2 w-full h-full">
					<a class="grid w-full" href={'/recipes/edit/' + recipe.id}>
						<h3 class="text-sm font-semibold line-clamp-1">{recipe.doc.title}</h3>
						<p class="text-xs text-muted-foreground flex items-center">
							<span class="mr-4">{recipeTimesOfDay[recipe.doc.timeOfDay]}</span>

							<!-- <span>{recipe.doc.servings}</span>
							<Users class="size-3 inline-block ml-0.5" /> -->
						</p>
					</a>
					<ButtonThemed
						class="rounded-full size-7 min-w-7 mr-2"
						size="icon"
						type="outline"
						aria-label="Add to plan"
						onclick={() => {
							console.log('Add to plan', recipe.id);
						}}
					>
						<CalendarPlus class="size-4" />
					</ButtonThemed>
				</div>
			</div>
		{/each}
	</div>

	{@render children?.()}
</div>
