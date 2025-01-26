<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Heart from 'lucide-svelte/icons/heart';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import { Input } from '$lib/shared/components/ui/input/index.js';
	import { Label } from '$lib/shared/components/ui/label/index.js';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import * as Form from '$lib/shared/components/ui/form';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
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
		Camera
	} from 'lucide-svelte';
	import { Quantity, unitLabels, type Unit } from '$lib/shared/utils/quantity';
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
		recipeCuisines,
		recipeDocConverter,
		recipeFoodTypes,
		RecipeHealthyLevel,
		RecipeMotivationLevel,
		recipeTimesOfDay,
		recipeTools,
		type DBRecipeDoc,
		type RecipeCuisineKey,
		type RecipeDoc,
		type RecipeFoodTypeKey,
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

	// Load the recipe document
	const pageRecipeId = page.params.id;
	let recipeDocState = new DocState<RecipeDoc, DBRecipeDoc>(
		firestore,
		`recipes/${pageRecipeId}`,
		recipeDocConverter
	);

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
				toast.error('Please fix the errors in the form.');
			}
		}
	});
	const { form: formData, enhance, errors, tainted, isTainted } = form;
	$inspect($errors);

	let dirty = $derived(isTainted($tainted));
	let searchInput = $state('');

	// Update the form data with the recipe document data whenever it changes
	$effect(() => {
		recipeDocState.data; // Subscribe to changes in firestore to trigger the effect

		formData.update(
			(f) => {
				if (!recipeDocState.data) return f;

				f.title = recipeDocState.data.title;
				f.description = recipeDocState.data.description;
				f.tools = recipeDocState.data.tools;
				f.timePrep = recipeDocState.data.time?.prep || 0;
				f.timeCook = recipeDocState.data.time?.cook || 0;
				f.timeRest = recipeDocState.data.time?.rest || 0;
				f.tools = recipeDocState.data.tools || [];
				f.motivationLevel = recipeDocState.data.motivationLevel?.toString() || '3';
				f.healthyLevel = recipeDocState.data.healthyLevel?.toString() || '3';
				f.dishWasherLevel = recipeDocState.data.dishesLevels?.dishwasher?.toString() || '3';
				f.dishHandLevel = recipeDocState.data.dishesLevels?.hand?.toString() || '3';
				f.timeOfDay = recipeDocState.data.timeOfDay || undefined;
				f.foodType = recipeDocState.data.foodType || undefined;
				f.cuisine = recipeDocState.data.cuisine || undefined;
				f.stepDescriptions = recipeDocState.data.steps?.map((step) => step.description) || [''];
				f.servings = recipeDocState.data.servings || 4;
				f.ingredientAmounts = recipeDocState.data.ingredients?.map((i) => i.amount) || [1, 1];
				f.ingredientUnits = recipeDocState.data.ingredients?.map((i) => i.unit) || ['g', 'g'];
				f.ingredientNames = recipeDocState.data.ingredients?.map((i) => i.name) || ['', ''];
				return f;
			},
			{ taint: false }
		);
	});

	// TODO this is temporary just for testing and fun with the Quantity library & embeddings
	let result = $state('');
	let debounceTimeout: NodeJS.Timeout; // Debounce the search input
	$effect(() => {
		searchInput; // Trigger the effect when the search input changes

		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!searchInput) return;

			result = `Searching for: ${searchInput}`;

			const quantity = await Quantity.freeDensity(100, 'g', searchInput, {
				region: 'EU',
				gramsPerWhole: {
					min: 30,
					mid: 33,
					max: 36
				}
			});

			result = `${quantity.toString()} is ${quantity.to('ml').mid.toFixed(2)} ml`;
		}, 1000);
	});

	let loading = $state(false);

	async function onSubmit(data: Infer<CreateRecipeFormSchema>) {
		if (!recipeDocState.data) return;

		loading = true;
		await recipeDocState.updateDoc({
			status: 'published',
			title: data.title,
			description: data.description,
			tools: data.tools as RecipeToolKey[],
			'time.total': data.timeCook + data.timePrep + data.timeRest,
			'time.cook': data.timeCook,
			'time.prep': data.timePrep,
			'time.rest': data.timeRest,
			motivationLevel: parseInt(data.motivationLevel),
			healthyLevel: parseInt(data.healthyLevel),
			'dishesLevels.dishwasher': parseInt(data.dishWasherLevel),
			'dishesLevels.hand': parseInt(data.dishHandLevel),
			'dishesLevels.total': parseInt(data.dishWasherLevel + data.dishHandLevel),
			timeOfDay: data.timeOfDay as RecipeTimeOfDayKey,
			foodType: data.foodType as RecipeFoodTypeKey,
			cuisine: data.cuisine as RecipeCuisineKey,
			steps: Object.values(data.stepDescriptions.filter((d) => d.trim() != '')).map(
				(d) =>
					({
						description: d,
						ingredients: [] // TODO ingredients
					}) as RecipeStep
			),
			servings: data.servings || 4,
			ingredients: data.ingredientAmounts.map((amount, i) => ({
				amount,
				unit: data.ingredientUnits[i] as Unit, // TODO add unit region support (e.g. eutsp, ...)
				name: capitalize(data.ingredientNames[i])
			}))
		});

		// Remove the banner query param if it exists
		const url = new URL(window.location.toString());
		url.searchParams.delete('banner');
		history.replaceState({}, '', url);
		openBanner = false;

		// Wait for 1 second for the loading spinner to show
		loading = false;

		// Go to the recipe view page
		goto(`/recipes/${recipeDocState.id}`);
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
							if (recipeDocState.data?.status == 'draft') dismissDialogMode = 'delete';
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
						{#if recipeDocState.data?.status == 'draft'}
							New recipe
						{:else}
							Edit recipe
						{/if}
					</h1>

					{#if recipeDocState.data?.status == 'draft'}
						<Badge class="ml-auto sm:ml-0 bg-yellow-600 text-white dark:bg-yellow-900">Draft</Badge>
					{/if}

					<div class="hidden items-center gap-2 md:ml-auto md:flex">
						{#if recipeDocState.data?.status == 'published'}
							<Button
								variant="outline"
								size="sm"
								disabled={loading}
								onclick={() => {
									showDismissDialog = true;
									dismissDialogMode = 'delete';
								}}
							>
								<!-- <Trash2 class="size-3.5" /> -->
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
								<ImportRecipeDialog recipeId={recipeDocState.id} />
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<Form.Field {form} name="title" class="grid">
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
								<!-- <Input
									disabled={loading}
									id="name"
									type="text"
									class="w-full shadow-sm"
									placeholder="Type to add 3 tomatoes, 200g of flour, ..."
									bind:value={searchInput}
								/>

								<p>{result}</p> -->

								{#each $formData.ingredientAmounts as _, i}
									<div class="grid gap-3">
										<div class="grid gap-2">
											<div class="flex gap-2 items-center">
												<GripVertical class="size-6 text-muted-foreground cursor-grab" />

												<div class="flex">
													<Form.Field {form} name="ingredientAmounts" class="space-y-0 w-full">
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
																		class="gap-1 bg-muted/40 rounded-l-none min-w-12"
																	>
																		{$formData.ingredientUnits[i]}
																	</Select.Trigger>
																	<Select.Content>
																		{#each Object.entries(unitLabels) as [key, label]}
																			<Select.Item value={key} {label} />
																		{/each}
																	</Select.Content>
																</Select.Root>
																<input hidden bind:value={$formData.foodType} name={props.name} />
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
													class="h-6 w-6 min-w-6"
													disabled={loading || $formData.ingredientAmounts.length <= 2}
													onclick={() => {
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
									</div>
								{/each}

								<!-- <Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="w-[0px]">Amount</Table.Head>
											<Table.Head class="w-[0px]">Unit</Table.Head>
											<Table.Head>Item</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										<Table.Row>
											<Table.Cell>
												<Label class="sr-only">Amount</Label>
												<Input type="number" class="w-[80px]" value="100" />
											</Table.Cell>
											<Table.Cell>
												<ToggleGroup.Root type="single" value="s" variant="outline">
													<ToggleGroup.Item value="s">g</ToggleGroup.Item>
													<ToggleGroup.Item value="m">mL</ToggleGroup.Item>
												</ToggleGroup.Root>
											</Table.Cell>
											<Table.Cell>
												<Label>Tomatoes</Label>
											</Table.Cell>
										</Table.Row>
									</Table.Body>
								</Table.Root> -->
							</Card.Content>
							<Card.Footer class="justify-center border-t p-4">
								<Button
									size="sm"
									variant="ghost"
									class="gap-1"
									disabled={loading || $formData.ingredientAmounts.length >= 10}
									onclick={() => {
										$formData.ingredientAmounts = [...$formData.ingredientAmounts, 1];
										$formData.ingredientUnits = [...$formData.ingredientUnits, 'g'];
										$formData.ingredientNames = [...$formData.ingredientNames, ''];
									}}
								>
									<CirclePlus class="h-3.5 w-3.5" />
									Add Ingredient
								</Button>
							</Card.Footer>
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
											class={$formData.tools.includes(key)
												? 'aspect-square rounded-md text-center border-2 font-semibold ' +
													`border-${activeSpace!.userHeader!.theme}-600 text-${activeSpace!.userHeader!.theme}-600`
												: 'border-2 aspect-square rounded-md text-center'}
											onclick={(e) => {
												e.preventDefault(); // Don't submit the form
												$formData.tools = $formData.tools.includes(key)
													? $formData.tools.filter((tool) => tool !== key)
													: [...$formData.tools, key];
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
									<ImgUploadButton {recipeDocState} />
									<div class="grid grid-cols-3 gap-2">
										{#each Array.from( { length: Math.min(recipeDocState.data?.imageIds?.length || 0, 3) } ) as _, i}
											<ImgUploadButton {recipeDocState} size="small" position={i + 1} />
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
								<div class="grid gap-6">
									<div class="grid gap-3">
										<Form.Field {form} name="motivationLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Motivation needed</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.motivationLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize(
																RecipeMotivationLevel[parseInt($formData.motivationLevel)]
															).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="1" label="Very low" />
															<Select.Item value="2" label="Low" />
															<Select.Item value="3" label="Medium" />
															<Select.Item value="4" label="High" />
															<Select.Item value="5" label="Very high" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.motivationLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="healthyLevel">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Motivation needed</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.healthyLevel}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{capitalize(
																RecipeHealthyLevel[parseInt($formData.healthyLevel)]
															).replace('_', ' ')}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="1" label="Very low" />
															<Select.Item value="2" label="Low" />
															<Select.Item value="3" label="Medium" />
															<Select.Item value="4" label="High" />
															<Select.Item value="5" label="Very high" />
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.healthyLevel} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div class="grid gap-3">
											<Form.Field {form} name="dishWasherLevel">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Dish washer</Form.Label>
														<Select.Root
															type="single"
															bind:value={$formData.dishWasherLevel}
															name={props.name}
														>
															<Select.Trigger {...props}>
																{capitalize(
																	DishesLevel[parseInt($formData.dishWasherLevel)]
																).replace('_', ' ')}
															</Select.Trigger>
															<Select.Content>
																<Select.Item value="0" label="None" />
																<Select.Item value="1" label="Very Low" />
																<Select.Item value="2" label="Low" />
																<Select.Item value="3" label="Medium" />
																<Select.Item value="4" label="High" />
																<Select.Item value="5" label="Very High" />
															</Select.Content>
														</Select.Root>
														<input
															hidden
															bind:value={$formData.dishWasherLevel}
															name={props.name}
														/>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										</div>

										<div class="grid gap-3">
											<Form.Field {form} name="dishHandLevel">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Dish washer</Form.Label>
														<Select.Root
															type="single"
															bind:value={$formData.dishHandLevel}
															name={props.name}
														>
															<Select.Trigger {...props}>
																{capitalize(DishesLevel[parseInt($formData.dishHandLevel)]).replace(
																	'_',
																	' '
																)}
															</Select.Trigger>
															<Select.Content>
																<Select.Item value="0" label="None" />
																<Select.Item value="1" label="Very Low" />
																<Select.Item value="2" label="Low" />
																<Select.Item value="3" label="Medium" />
																<Select.Item value="4" label="High" />
																<Select.Item value="5" label="Very High" />
															</Select.Content>
														</Select.Root>
														<input hidden bind:value={$formData.dishHandLevel} name={props.name} />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										</div>
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
								<Card.Title>Category</Card.Title>
								<Card.Description>Select the closest match</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<div class="grid gap-3">
										<Form.Field {form} name="timeOfDay">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Time of day</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.timeOfDay}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{recipeTimesOfDay[$formData.timeOfDay as RecipeTimeOfDayKey]}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeTimesOfDay) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.timeOfDay} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="foodType">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Food type</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.foodType}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{recipeFoodTypes[$formData.foodType as RecipeFoodTypeKey]}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeFoodTypes) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.foodType} name={props.name} />
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>

									<div class="grid gap-3">
										<Form.Field {form} name="cuisine">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Cuisine</Form.Label>
													<Select.Root
														type="single"
														bind:value={$formData.cuisine}
														name={props.name}
													>
														<Select.Trigger {...props}>
															{recipeCuisines[$formData.cuisine as RecipeCuisineKey]}
														</Select.Trigger>
														<Select.Content>
															{#each Object.entries(recipeCuisines) as [key, label]}
																<Select.Item value={key} {label} />
															{/each}
														</Select.Content>
													</Select.Root>
													<input hidden bind:value={$formData.cuisine} name={props.name} />
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
							<p>Status: {recipeDocState.data?.status}</p>
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
					if (dismissDialogMode == 'delete') deleteRecipe(recipeDocState);
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
