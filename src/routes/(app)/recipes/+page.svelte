<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { Plus, SquarePen, Download } from 'lucide-svelte';
	import { createDraftRecipe } from '$lib/features/recipes/actions/create-draft-recipe';
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { collection, getDocs, query } from 'firebase/firestore';
	import { firestore } from '$lib/shared/db/firebase-client';
	import { recipeDocConverter, type RecipeDoc } from '$lib/features/recipes/db/recipe-doc';
	import { cn } from '$lib/utils';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import RecipeCard from './RecipeCard.svelte';

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

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Recipes</h2>
			<p class="text-muted-foreground">
				Here's your daily dose of inspiration. Add a recipe to get started.
			</p>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<ButtonThemed {...props} class="ml-auto">
						<Plus class="size-4 mr-2" />
						Add
					</ButtonThemed>
				{/snippet}
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
		class="w-full grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"
	>
		{#each recipes as recipe}
			<RecipeCard recipeId={recipe.id} recipeDoc={recipe.doc} />
		{/each}
	</div>

	{@render children?.()}
</div>
