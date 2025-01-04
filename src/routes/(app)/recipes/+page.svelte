<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { Plus, SquarePen, Download } from 'lucide-svelte';
	import { createDraftRecipe } from '$lib/features/recipes/actions/create-draft-recipe';
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { collection, getDocs, query, where } from 'firebase/firestore';
	import { firestore } from '$lib/shared/db/firebase-client';
	import { recipeDocConverter, type RecipeDoc } from '$lib/features/recipes/db/recipe-doc';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';

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

	<div class="w-full grid grid-cols-6 gap-2">
		{#each recipes as recipe}
			<a
				class="flex flex-col items-start bg-white rounded-md border"
				href={'/recipes/edit/' + recipe.id}
			>
				{#if recipe.doc.imageUrls && recipe.doc.imageUrls.length > 0}
					<img
						src={recipe.doc.imageUrls[0]}
						alt="Recipe"
						class="aspect-square rounded-md object-cover"
					/>
				{:else}
					<div class="w-full aspect-square bg-gray-200 rounded-md"></div>
				{/if}
				<div class="flex px-4 py-2 w-full h-full">
					<h3 class="text-md font-semibold">{recipe.doc.title}</h3>
					<!-- <p class="text-sm text-muted-foreground">{recipe.id}</p> -->
					<UserAvatar profile={recipe.doc.author.profile} class="ml-auto my-auto size-6" />
				</div>
			</a>
		{/each}
	</div>

	{@render children?.()}
</div>
