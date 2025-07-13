<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Heart from 'lucide-svelte/icons/heart';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import { Input } from '$lib/shared/components/ui/input/index.js';
	import { Label } from '$lib/shared/components/ui/label/index.js';
	import * as Form from '$lib/shared/components/ui/form';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { superForm, defaults, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import {
		ChevronDown,
		ChevronUp,
		Plus,
		X,
		Loader2,
		Users,
		Minus,
		GripVertical,
		Camera,
		Trash2
	} from 'lucide-svelte';
	import { unitLabels, type Unit } from '$lib/shared/utils/quantity';
	import {
		createRecipeFormSchema,
		type CreateRecipeFormSchema
	} from '$lib/features/recipes/models/schemas';
	import ImgUploadButton from './ImgUploadButton.svelte';
	import { page } from '$app/state';
	import { DocState } from '$lib/shared/db/doc-state.svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		DishesLevel,
		recipeCourses,
		recipeCuisines,
		recipeDocConverter,
		RecipeHealthyLevel,
		RecipeMotivationLevel,
		recipeTimesOfDay,
		recipeTools,
		type DBRecipeDoc,
		type RecipeCourseKey,
		type RecipeCuisineKey,
		type RecipeDoc,
		type RecipeStep,
		type RecipeTimeOfDayKey,
		type RecipeToolKey
	} from '$lib/features/recipes/db/recipe-doc';
	import { capitalize, cn } from '$lib/utils';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { deleteRecipe } from '$lib/features/recipes/actions/delete-recipe';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Badge } from '$lib/shared/components/ui/badge';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import { slide } from 'svelte/transition';
	import { languages, type LanguageKey } from '$lib/features/user-settings/consts';
	import IngredientSearch from './IngredientSearch.svelte';
	import type { ParsedSearchInput } from './parse-ingredient-input';
	import type { Database, Tables } from '$lib/shared/db/supabase.types';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { onMount } from 'svelte';

	// Load the recipe document
	const pageRecipeId = page.params.id;
	const isNewRecipe = pageRecipeId === 'new';

	const banner = page.url.searchParams.get('banner') || undefined;
	let openBanner = $state(banner ? true : false);

	const activeSpace = getActiveSpaceState();

	// Validate the form data using zod
	const form = superForm(defaults(zod(createRecipeFormSchema)), {
		SPA: true,
		validators: zod(createRecipeFormSchema),
		resetForm: false,
		taintedMessage: 'Leave this page without saving your changes?',
		async onUpdate({ form }) {
			if (form.valid) {
				await onSubmit(form.data);
				toast.success('Recipe saved! 👨‍🍳');
			} else {
				console.error('Form validation failed:', form.errors);
				toast.error('Please fix the errors in the form.');
			}
		}
	});
	const { form: formData, enhance, errors, tainted, isTainted } = form;

	let dirty = $derived(isTainted($tainted));

	// Update the form data with the recipe document data whenever it changes

	onMount(async () => {
		// If it's a new recipe, we don't need to fetch the recipe data
		if (isNewRecipe) return;

		// Fetch the recipe from Supabase
		const { data: recipeData, error: recipeError } = await supabase
			.from('recipes')
			.select(
				`*, 
				language:languages(*), 
				ingredients:recipe_ingredients(*), 
				courses:recipe_courses(*), 
				cuisines:recipe_cuisines(*), 
				times_of_day:recipe_times_of_day(*), 
				tags:recipe_tags(*), 
				tools:recipe_tools(*)`
			)
			.eq('id', pageRecipeId)
			.single();

		if (recipeError) {
			console.error('Error fetching recipe:', recipeError);
			return;
		}

		console.log('Fetched recipe:', recipeData);

		formData.update(
			(f) => {
				// General info
				f.language = (recipeData.language.lang as LanguageKey) || 'fr-FR';
				f.title = recipeData.title || 'New recipe';
				f.description = recipeData.description || 'Delicious new recipe';

				// Images
				f.imageIds = recipeData.image_ids || [];

				// Filters
				f.course_ids = recipeData.courses.map((course) => course.course_id.toString()) || [];
				f.cuisine_ids = recipeData.cuisines.map((cuisine) => cuisine.cuisine_id.toString()) || [];
				f.tag_ids = recipeData.tags.map((tag) => tag.tag_id.toString()) || [];
				f.timesofday_ids = recipeData.times_of_day.map((tod) => tod.timeofday_id.toString()) || [];
				f.tool_ids = recipeData.tools.map((tool) => tool.tool_id.toString()) || [];

				// Levels
				f.effortLevel = recipeData.effort_level || 'low';
				f.skillLevel = recipeData.skill_level || 'beginner';
				f.cleanupLevel = recipeData.cleanup_level || 'none';
				f.costLevel = recipeData.cost_level || 'budget';

				// Cook times
				f.timePrep = recipeData.time_prep_minutes || 0;
				f.timeCook = recipeData.time_cook_minutes || 0;
				f.timeRest = recipeData.time_rest_minutes || 0;

				// Servings & Ingredients
				f.servings = recipeData.servings || 4;
				f.ingredientIds = recipeData.ingredients.map((ing) => ing.ingredient_id);
				f.ingredientAmounts = recipeData.ingredients.map((ing) => ing.quantity || 1);
				f.ingredientUnits = recipeData.ingredients.map((ing) => ing.unit || 'whole');
				f.ingredientNames = recipeData.ingredients.map((ing) => ing.raw_input || '');

				// Steps
				f.stepDescriptions = recipeData.steps || [''];
				return f;
			},
			{ taint: false }
		);
	});

	function onAddIngredient({
		ingredient,
		parsedInput
	}: {
		ingredient: Tables<'ingredient_translations'>;
		parsedInput: ParsedSearchInput | null;
	}) {
		formData.update((f) => {
			f.ingredientIds.push(ingredient.ingredient_id);
			f.ingredientAmounts.push(parsedInput?.parsed.quantity?.amount ?? 1);
			f.ingredientUnits.push(parsedInput?.parsed.quantity?.unitKey ?? 'whole');
			f.ingredientNames.push(ingredient.name_singular ?? parsedInput?.parsed.ingredientText ?? '');
			return f;
		});
	}

	let loading = $state(false);

	async function onSubmit(data: Infer<CreateRecipeFormSchema>) {
		loading = true;
		const { data: langData, error: langError } = await supabase
			.from('languages')
			.select('id')
			.eq('lang', data.language)
			.single();

		if (langError || !langData) {
			console.error('Error fetching language ID:', langError);
			toast.error('Failed to fetch language ID.');
			return;
		}

		// Create the recipe
		const { data: recipeIdData, error: recipeIdError } = await supabase
			.from('recipes')
			.upsert({
				// ID if we are updating an existing recipe
				id: isNewRecipe ? undefined : pageRecipeId,

				// Source
				source_type: 'user-manual',

				// General info
				title: data.title,
				description: data.description,
				notes: '',
				author_id: '01b12743-d908-46ff-b239-332438cb4c4d', // TODO connect auth
				language_id: langData.id,
				slug: '', // Will be generated by a db trigger

				// Filters (single select enums)
				cleanup_level: data.cleanupLevel,
				cost_level: data.costLevel,
				effort_level: data.effortLevel,
				skill_level: data.skillLevel,

				// Cook times
				time_prep_minutes: data.timePrep,
				time_cook_minutes: data.timeCook,
				time_rest_minutes: data.timeRest,

				// Servings (ingredients will be inserted in another table)
				servings: data.servings,

				// Steps
				steps: data.stepDescriptions
			} as Tables<'recipes'>)
			.select('id')
			.single();

		if (recipeIdError || !recipeIdData) {
			console.error('Error creating recipe:', recipeIdError);
			toast.error('Failed to create recipe.');
			return;
		}

		// If it's an existing recipe, we need to delete the old relations first
		if (!isNewRecipe) {
			const { error: deleteError } = await supabase
				.from('recipe_ingredients')
				.delete()
				.eq('recipe_id', pageRecipeId);

			if (deleteError) {
				console.error('Error deleting old ingredients:', deleteError);
				toast.error('Failed to delete old ingredients.');
				return;
			}
		}

		// Add the ingredients to the recipe_ingredients table
		const { error: ingredientsError } = await supabase
			.from('recipe_ingredients')
			.insert(
				data.ingredientIds.map(
					(id, i) =>
						({
							recipe_id: recipeIdData.id,
							ingredient_id: id,
							quantity: data.ingredientAmounts[i],
							unit: data.ingredientUnits[i],
							details: '',
							notes: '',
							raw_input: data.ingredientNames[i]
						}) as Tables<'recipe_ingredients'>
				)
			)
			.select();

		if (ingredientsError) {
			console.error('Error adding ingredients:', ingredientsError);
			toast.error('Failed to add ingredients.');
			return;
		}

		// Add the other relations like courses, cuisines, times of day, tags, and tools
		const relations = [
			{ table: 'recipe_courses', ids: data.course_ids, column: 'course_id' },
			{ table: 'recipe_cuisines', ids: data.cuisine_ids, column: 'cuisine_id' },
			{ table: 'recipe_times_of_day', ids: data.timesofday_ids, column: 'timeofday_id' },
			{ table: 'recipe_tags', ids: data.tag_ids, column: 'tag_id' },
			{ table: 'recipe_tools', ids: data.tool_ids, column: 'tool_id' }
		] as {
			table: keyof Database['public']['Tables'];
			ids: (number | string)[];
			column: string;
		}[];

		for (const { table, ids, column } of relations) {
			// Always delete existing relations for this recipe before upserting
			const { error: deleteRelationError } = await supabase
				.from(table)
				.delete()
				.eq('recipe_id', recipeIdData.id);

			if (deleteRelationError) {
				console.error(`Error deleting old ${table}:`, deleteRelationError);
				toast.error(`Failed to delete old ${table}.`);
				return;
			}

			if (ids.length > 0) {
				const { error: relationError } = await supabase
					.from(table)
					.insert(
						ids.map(
							(id) =>
								({
									recipe_id: recipeIdData.id,
									[column]: id
								}) as Tables<typeof table>
						)
					)
					.select();

				if (relationError) {
					console.error(`Error adding ${table}:`, relationError);
					toast.error(`Failed to add ${table}.`);
					return;
				}
			}
		}

		// Go to the recipe view page
		console.log('Created or edited recipe ID:', recipeIdData?.id);
		loading = false;
		goto(`/recipes/${recipeIdData?.id}`);
	}

	function onImagesChanged(imageIds: string[]) {
		formData.update(
			(f) => {
				f.imageIds = imageIds;
				return f;
			},
			{ taint: false }
		);
	}

	let showDismissDialog = $state(false);
	let dismissDialogMode: 'discard' | 'delete' = $state('discard');
</script>

<form method="POST" use:enhance class="space-y-8">
	<div class="w-full min-h-screen flex flex-col">
		<main class="grid flex-1 items-start gap-4 md:gap-8">
			<div class="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
				<div class="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						onclick={() => {
							if (isNewRecipe) dismissDialogMode = 'delete';
							else {
								// Check if the form is dirty before showing the dialog when dismissing only
								if (!dirty && window) window.history.back();
								dismissDialogMode = 'discard';
							}
							showDismissDialog = true;
						}}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="sr-only">Back</span>
					</Button>
					<h1
						class="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0"
					>
						{#if isNewRecipe}
							New recipe
						{:else}
							Edit recipe
						{/if}
					</h1>

					{#if isNewRecipe}
						<Badge class="ml-auto sm:ml-0 bg-yellow-600 text-white dark:bg-yellow-900">Draft</Badge>
					{/if}

					<div class="hidden items-center gap-2 md:ml-auto md:flex">
						{#if !isNewRecipe}
							<Button
								variant="outline"
								size="sm"
								disabled={loading}
								onclick={() => {
									showDismissDialog = true;
									dismissDialogMode = 'delete';
								}}
							>
								<Trash2 class="size-3.5" />
								Delete
							</Button>
						{/if}

						<ButtonThemed size="sm" type="submit" class="w-14 flex gap-2" disabled={loading}>
							{#if loading}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Save
							{/if}
						</ButtonThemed>
					</div>
				</div>

				{#if banner == 'import-incomplete' && openBanner}
					<div class="w-full bg-yellow-50 flex gap-8 p-4 items-start text-yellow-800" out:slide>
						<div class="rounded-md text-sm">
							<span class="font-semibold">Missing information:</span>
							<span>
								Almost there! It seems like the imported recipe is missing some information required
								for Cuicuit recipes. Please take a moment to fill in the remaining details and save
								the recipe.
							</span>
						</div>
						<button class="ml-auto" onclick={() => (openBanner = false)}>
							<X class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						<Card.Root>
							<Card.Header class="flex-row items-center">
								<div class="grid space-y-1.5">
									<Card.Title>Recipe Details</Card.Title>
									<Card.Description>This is the main information about the recipe</Card.Description>
								</div>
								<!-- <ImportRecipeDialog recipeId={recipeDocState.id} /> -->
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<div class="flex gap-4">
										<Form.Field {form} name="title" class="w-full grid">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Title</Form.Label>
													<Input
														disabled={loading}
														{...props}
														bind:value={$formData.title}
														placeholder="Chocolate cookies"
													/>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>

										<Form.Field {form} name="language" class="grid">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Language</Form.Label>

													<Select.Root
														{...props}
														type="single"
														name="language"
														bind:value={$formData.language}
													>
														<Select.Trigger class="w-20">
															{languages[$formData.language]?.emoji || '?'}
														</Select.Trigger>
														<Select.Content>
															<Select.Group>
																<Select.GroupHeading>Recipe language</Select.GroupHeading>
																{#each Object.entries(languages) as [value, lang] (value)}
																	<Select.Item
																		{value}
																		label={lang.label}
																		class="flex gap-2 items-center"
																	>
																		<span>{lang.emoji}</span>
																		<span>{lang.label}</span>
																	</Select.Item>
																{/each}
															</Select.Group>
														</Select.Content>
													</Select.Root>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<Form.Field {form} name="description" class="grid">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Description</Form.Label>
												<Textarea
													disabled={loading}
													{...props}
													bind:value={$formData.description}
													placeholder="A delicious recipe for chocolate cookies that will make your day! It is easy to make and will be ready in no time."
													class="min-h-32 text-wrap"
												/>
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<div class="flex">
									<div class="flex flex-col space-y-1.5">
										<Card.Title>Ingredients</Card.Title>
										<Card.Description>
											List all the ingredients required for the recipe
										</Card.Description>
									</div>
									<div class="flex gap-2 items-center ml-auto p-2 bg-muted rounded-md">
										<Button
											variant="outline"
											size="icon"
											class="size-8 rounded-full"
											disabled={loading}
											onclick={() => ($formData.servings = Math.max(1, $formData.servings - 1))}
										>
											<Minus class="size-4" />
											<span class="sr-only">Decrease servings</span>
										</Button>
										<div class="w-12 flex flex-col">
											<div class="flex justify-center text-center text-xl font-bold h-6">
												{$formData.servings}
												<Users class="ml-2 size-4" />
											</div>
											<span class="text-[7pt] text-muted-foreground text-center font-bold">
												SERVING{$formData.servings > 1 ? 'S' : ''}
											</span>
										</div>
										<Button
											variant="outline"
											size="icon"
											class="size-8 rounded-full"
											disabled={loading}
											onclick={() => ($formData.servings = Math.min(20, $formData.servings + 1))}
										>
											<Plus class="size-4" />
											<span class="sr-only">Increase servings</span>
										</Button>
									</div>
								</div>
							</Card.Header>
							<Card.Content class="grid gap-3">
								<Label>Type to add:</Label>

								<IngredientSearch
									language={$formData.language}
									onSelect={onAddIngredient}
									class="mb-3"
								/>

								<!-- <Label>Required</Label> -->

								{#each $formData.ingredientIds as id, i (id)}
									<div class="grid gap-3">
										<div class="grid gap-2">
											<div class="w-full flex gap-2 items-center">
												<GripVertical class="size-6 text-muted-foreground cursor-grab" />
												<!-- <IngredientSelectDropdown /> -->

												<IngredientImage
													id={$formData.ingredientIds[i]}
													name={$formData.ingredientNames[i]}
													class="w-10 h-10"
												/>

												<div class="flex">
													<Form.Field {form} name="ingredientAmounts" class="space-y-0">
														<Form.Control>
															{#snippet children({ props })}
																<Input
																	{...props}
																	disabled={loading}
																	name="ingredientAmounts"
																	type="number"
																	step="0.1"
																	class="w-20 rounded-r-none border-r-0"
																	bind:value={$formData.ingredientAmounts[i]}
																/>
															{/snippet}
														</Form.Control>
													</Form.Field>

													<Form.Field {form} name="ingredientUnits" class="space-y-0">
														<Form.Control>
															{#snippet children({ props })}
																<Select.Root
																	type="single"
																	bind:value={$formData.ingredientUnits[i]}
																	name={props.name}
																>
																	<Select.Trigger
																		{...props}
																		class="gap-1 bg-muted/40 rounded-l-none w-20"
																	>
																		{$formData.ingredientUnits[i]}
																	</Select.Trigger>
																	<Select.Content>
																		{#each Object.entries(unitLabels) as [key, label]}
																			<Select.Item value={key} {label} />
																		{/each}
																	</Select.Content>
																</Select.Root>
																<!-- <input hidden bind:value={$formData.foodType} name={props.name} /> -->
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
												</div>

												<Form.Field {form} name="ingredientNames" class="space-y-0 w-full">
													<Form.Control>
														{#snippet children({ props })}
															<Input
																{...props}
																disabled={loading}
																name="ingredientNames"
																type="text"
																placeholder="Tomatoes, Flour, ..."
																bind:value={$formData.ingredientNames[i]}
															/>
														{/snippet}
													</Form.Control>
												</Form.Field>

												<Button
													variant="ghost"
													size="icon"
													class="ml-auto h-6 w-6 min-w-6"
													disabled={loading || $formData.ingredientAmounts.length <= 2}
													onclick={() => {
														$formData.ingredientIds = $formData.ingredientIds.filter(
															(_, j) => j !== i
														);
														$formData.ingredientAmounts = $formData.ingredientAmounts.filter(
															(_, j) => j !== i
														);
														$formData.ingredientUnits = $formData.ingredientUnits.filter(
															(_, j) => j !== i
														);
														$formData.ingredientNames = $formData.ingredientNames.filter(
															(_, j) => j !== i
														);
													}}
												>
													<X class="size-4" />
													<span class="sr-only">Delete</span>
												</Button>
											</div>
										</div>

										{#if $errors.ingredientAmounts?.[i]}
											<p class="ml-6 text-destructive text-sm font-medium">
												{$errors.ingredientAmounts[i]}
											</p>
										{/if}
										{#if $errors.ingredientUnits?.[i]}
											<p class="ml-6 text-destructive text-sm font-medium">
												{$errors.ingredientUnits[i]}
											</p>
										{/if}
										{#if $errors.ingredientNames?.[i]}
											<p class="ml-6 text-destructive text-sm font-medium">
												{$errors.ingredientNames[i]}
											</p>
										{/if}
									</div>
								{/each}

								<!-- <Label>Optional</Label>
								<p class="text-xs text-muted-foreground text-center bg-muted/40 p-4 rounded-md">
									Drag ingredients here to mark them as optional
								</p> -->
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Tools</Card.Title>
								<Card.Description>
									Please select the tools needed to make this recipe
								</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
									{#snippet toolButton(key: RecipeToolKey, label: string)}
										<button
											disabled={loading}
											class={$formData.tool_ids.includes(key)
												? 'aspect-square rounded-md text-center border-2 font-semibold ' +
													`border-${activeSpace!.userHeader!.theme}-600 text-${activeSpace!.userHeader!.theme}-600`
												: 'border-2 aspect-square rounded-md text-center'}
											onclick={(e) => {
												e.preventDefault(); // Don't submit the form
												$formData.tool_ids = $formData.tool_ids.includes(key)
													? $formData.tool_ids.filter((tool) => tool !== key)
													: [...$formData.tool_ids, key];
											}}
										>
											<img src={`/appliances/${key}.jpg`} alt="" class="size-12 mx-auto mb-1" />
											{label}
										</button>
									{/snippet}
									{#each Object.entries(recipeTools) as [key, label]}
										{@render toolButton(key as RecipeToolKey, label)}
									{/each}
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Instructions</Card.Title>
								<Card.Description>
									Step by step detailed instructions to make the recipe
								</Card.Description>
							</Card.Header>
							<Card.Content class="grid gap-6">
								{#each $formData.stepDescriptions as desc, i}
									<Form.Field {form} name="stepDescriptions" class="grid">
										<Form.Control>
											{#snippet children({ props })}
												<div class="grid gap-1.5">
													<div class="flex items-center">
														<Form.Label
															class={cn(
																'mr-auto',
																$errors.stepDescriptions?.[i] && 'text-destructive'
															)}>Step {i + 1}</Form.Label
														>
														{#if i > 0}
															<Button
																variant="ghost"
																size="icon"
																class="size-6"
																onclick={() => {
																	const temp = $formData.stepDescriptions[i];
																	$formData.stepDescriptions[i] = $formData.stepDescriptions[i - 1];
																	$formData.stepDescriptions[i - 1] = temp;
																}}
															>
																<ChevronUp class="size-4" />
																<span class="sr-only">Move up</span>
															</Button>
														{/if}
														{#if i < $formData.stepDescriptions.length - 1}
															<Button
																variant="ghost"
																size="icon"
																class="size-6 ml-2"
																onclick={() => {
																	const temp = $formData.stepDescriptions[i];
																	$formData.stepDescriptions[i] = $formData.stepDescriptions[i + 1];
																	$formData.stepDescriptions[i + 1] = temp;
																}}
															>
																<ChevronDown class="size-4" />
																<span class="sr-only">Move down</span>
															</Button>
														{/if}
														{#if $formData.stepDescriptions.length > 1}
															<Button
																variant="ghost"
																size="icon"
																class="size-6 ml-2"
																onclick={() =>
																	($formData.stepDescriptions = $formData.stepDescriptions.filter(
																		(_, j) => j !== i
																	))}
															>
																<X class="size-4" />
																<span class="sr-only">Delete</span>
															</Button>
														{/if}
													</div>

													<div class="flex gap-2 min-h-24">
														<Textarea
															{...props}
															id="description"
															placeholder="In a large bowl, cream together the butter, brown sugar, and white sugar until smooth."
															class="min-h-24 max-h-52"
															bind:value={$formData.stepDescriptions[i]}
														/>

														<!-- <Separator orientation="vertical" /> -->

														<label
															class="h-24 aspect-square rounded-md border border-dashed cursor-pointer bg-muted flex items-center justify-center"
														>
															<Camera class="text-muted-foreground size-4" />
														</label>
													</div>

													<!-- <div class="w-full grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
														<div class="bg-muted w-full aspect-square rounded-md"></div>
														<div
															class="border w-full aspect-square rounded-md flex flex-col justify-center items-center text-muted-foreground"
														>
															<Plus class="size-8 mb-1" />
														</div>
													</div> -->

													{#if $errors.stepDescriptions?.[i]}
														<p class="text-destructive text-sm font-medium">
															{$errors.stepDescriptions[i]}
														</p>
													{/if}
												</div>
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								{/each}
							</Card.Content>
							<!-- <Card.Footer class="grid gap-3 border-t p-6">
								<div class="flex flex-col space-y-1.5">
									<div class="flex items-center">
										<Label class="text-yellow-600 flex gap-2 items-center">
											4 unlinked ingredients
											<TriangleAlert class="size-4" />
										</Label>
										<Button variant="ghost" size="icon" class="size-6 ml-auto">
											<ChevronUp class="size-4 text-yellow-600" />
											<span class="sr-only">Delete</span>
										</Button>
									</div>
									<Card.Description>
										These ingredients are not linked to any step yet:
									</Card.Description>
								</div>
								<div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
									<div
										class="w-full aspect-square rounded-md dark:bg-yellow-900/40 bg-yellow-100"
									></div>
									<div
										class="w-full aspect-square rounded-md dark:bg-yellow-900/40 bg-yellow-100"
									></div>
									<div
										class="w-full aspect-square rounded-md dark:bg-yellow-900/40 bg-yellow-100"
									></div>
									<div
										class="w-full aspect-square rounded-md dark:bg-yellow-900/40 bg-yellow-100"
									></div>
								</div>
							</Card.Footer> -->
							<Card.Footer class="justify-center border-t p-4">
								<Button
									size="sm"
									variant="ghost"
									class="gap-1"
									onclick={() => ($formData.stepDescriptions = [...$formData.stepDescriptions, ''])}
									disabled={$formData.stepDescriptions.length >= 10}
								>
									<CirclePlus class="h-3.5 w-3.5" />
									Add Step
								</Button>
							</Card.Footer>
						</Card.Root>
					</div>
					<div class="grid auto-rows-max items-start gap-4 lg:gap-8">
						<Card.Root class="overflow-hidden">
							<Card.Header>
								<Card.Title>Images</Card.Title>
								<Card.Description>Make your recipe stand out!</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-2">
									<ImgUploadButton
										recipeId={pageRecipeId}
										currentImageIds={$formData.imageIds}
										{onImagesChanged}
									/>
									<div class="grid grid-cols-3 gap-2">
										{#each Array.from( { length: Math.min($formData.imageIds?.length || 0, 3) } ) as _, i}
											<ImgUploadButton
												recipeId={pageRecipeId}
												currentImageIds={$formData.imageIds}
												size="small"
												position={i + 1}
												{onImagesChanged}
											/>
										{/each}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Filters</Card.Title>
								<Card.Description>Helpful information for search</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-3">
									<div class="grid gap-3">
										<Form.Field {form} name="skillLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Skill needed</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.skillLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize($formData.skillLevel).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="beginner" label="Beginner" />
															<Select.Item value="intermediate" label="Intermediate" />
															<Select.Item value="advanced" label="Advanced" />
															<Select.Item value="chef" label="Chef" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.skillLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="effortLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Effort needed</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.effortLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize($formData.effortLevel).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="none" label="None" />
															<Select.Item value="low" label="Low" />
															<Select.Item value="medium" label="Medium" />
															<Select.Item value="high" label="High" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.effortLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="costLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Cost</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.costLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize($formData.costLevel).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="minimal" label="Minimal" />
															<Select.Item value="budget" label="Budget" />
															<Select.Item value="average" label="Average" />
															<Select.Item value="premium" label="Premium" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.costLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="cleanupLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Cleanup effort</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.cleanupLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize($formData.cleanupLevel).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="none" label="None" />
															<Select.Item value="low" label="Low" />
															<Select.Item value="medium" label="Medium" />
															<Select.Item value="high" label="High" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.cleanupLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-2">
										<Label>Time</Label>

										<Form.Field {form} name="timePrep" class="pl-4 flex items-center gap-3">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label class="font-normal text-muted-foreground">Prep</Form.Label>
													<Input
														{...props}
														placeholder="10"
														type="number"
														class="w-24 ml-auto"
														bind:value={$formData.timePrep}
													/>
													<p>min</p>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>

										<Form.Field {form} name="timeCook" class="pl-4 flex items-center gap-3">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label class="font-normal text-muted-foreground">Cook</Form.Label>
													<Input
														{...props}
														placeholder="10"
														type="number"
														class="w-24 ml-auto"
														bind:value={$formData.timeCook}
													/>
													<p>min</p>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>

										<Form.Field {form} name="timeRest" class="pl-4 flex items-center gap-3">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label class="font-normal text-muted-foreground">Rest</Form.Label>
													<Input
														{...props}
														placeholder="10"
														type="number"
														class="w-24 ml-auto"
														bind:value={$formData.timeRest}
													/>
													<p>min</p>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Categories</Card.Title>
								<Card.Description>Select the closest matches</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<div class="grid gap-3">
										<Form.Field {form} name="timesofday_ids">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Time of day</Form.Label>
													<Select.Root
														type="multiple"
														bind:value={$formData.timesofday_ids}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{#if $formData.timesofday_ids.length == 0}
																<span class="text-muted-foreground">Select...</span>
															{:else if $formData.timesofday_ids.length == 1}
																{recipeTimesOfDay[
																	$formData.timesofday_ids[0] as RecipeTimeOfDayKey
																]}
															{:else}
																{$formData.timesofday_ids.length} selected
															{/if}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeTimesOfDay) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.timesofday_ids} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="course_ids">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Courses</Form.Label>
													<Select.Root
														type="multiple"
														bind:value={$formData.course_ids}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{#if $formData.course_ids.length == 0}
																<span class="text-muted-foreground">Select...</span>
															{:else if $formData.course_ids.length == 1}
																{recipeCourses[$formData.course_ids[0] as RecipeCourseKey]}
															{:else}
																{$formData.course_ids.length} selected
															{/if}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeCourses) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.course_ids} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="cuisine_ids">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Cuisines</Form.Label>
													<Select.Root
														type="multiple"
														bind:value={$formData.cuisine_ids}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{#if $formData.cuisine_ids.length == 0}
																<span class="text-muted-foreground">Select...</span>
															{:else if $formData.cuisine_ids.length == 1}
																{recipeCuisines[$formData.cuisine_ids[0] as RecipeCuisineKey]}
															{:else}
																{$formData.cuisine_ids.length} selected
															{/if}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeCuisines) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.cuisine_ids} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Detected information</Card.Title>
								<Card.Description>Based on ingredients</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-1.5 text-muted-foreground text-sm">
									<div class="flex items-center gap-2">
										<input type="checkbox" disabled />
										<span>Nutrition categories (e.g. vegan)</span>
									</div>
									<div class="flex items-center gap-2">
										<input type="checkbox" disabled />
										<span>Nutrition stats (e.g. calories)</span>
									</div>
									<div class="flex items-center gap-2">
										<input type="checkbox" disabled />
										<span>(Recipe variants e.g. vegan version, web import, ratings & comments)</span
										>
									</div>
								</div>
							</Card.Content>
						</Card.Root>

						<div class="flex-1 gap-2 text-center text-xs text-muted-foreground">
							<p>Recipe id: {pageRecipeId}</p>
							<!-- <p>Status: {recipeDocState.data?.status}</p> -->
						</div>
					</div>
				</div>

				<div class="text-muted-foreground text-xs justify-center flex items-center gap-0.5">
					Built with{' '}
					<Heart class="size-3.5 inline-block align-middle" /> by{' '}
					<Button
						variant="link"
						href="https://laclau.dev"
						target="_blank"
						rel="noopener noreferrer"
						class="p-0 text-xs text-muted-foreground"
					>
						Pierre Laclau
					</Button>
				</div>
			</div>
		</main>
	</div>
</form>

<AlertDialog.Root bind:open={showDismissDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				{#if dismissDialogMode == 'delete'}
					Delete recipe?
				{:else}
					Discard changes?
				{/if}
			</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to discard the changes you made to this recipe?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class={dismissDialogMode == 'delete' ? 'bg-destructive' : ''}
				onclick={() => {
					// TODO if (dismissDialogMode == 'delete') deleteRecipe(recipeDocState);
					goto('/recipes');
				}}
			>
				{#if dismissDialogMode == 'delete'}
					Delete
				{:else}
					Discard
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
