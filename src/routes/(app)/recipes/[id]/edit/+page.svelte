<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
	import type { EditRecipeInput, EditRecipeOutput } from '$lib/core/operations/recipes/edit';
	import {
		buildCustomIngredientName,
		resolveIngredientName
	} from '$lib/features/ingredients/utils/ingredient-display';
	import { deleteRecipe } from '$lib/features/recipes/actions/delete-recipe';
	import {
		recipeCourses,
		recipeCuisineGroups,
		recipeCuisines,
		recipeTimesOfDay
	} from '$lib/features/recipes/db/recipe-doc';
	import { emptyRecipeStepHints } from '$lib/features/recipes/models/recipe-step';
	import {
		createRecipeFormSchema,
		type CreateRecipeFormSchema
	} from '$lib/features/recipes/models/schemas';
	import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
	import { getRecipeDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import OptionPills from '$lib/shared/components/OptionPills.svelte';
	import SearchResultsSidebar from '$lib/shared/components/search/SearchResultsSidebar.svelte';
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input/index.js';
	import { Label } from '$lib/shared/components/ui/label/index.js';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import VoteForFeatures from '$lib/shared/components/VoteForFeatures.svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import {
		CURATED_LANGUAGES,
		DEFAULT_LANGUAGE,
		normalizeLanguageCode
	} from '$lib/shared/language.js';
	import { cn } from '$lib/utils';
	import {
		ArrowUpDown,
		ChevronDown,
		ChevronUp,
		LoaderCircle,
		Minus,
		Plus,
		Trash2,
		Users,
		X
	} from '@lucide/svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import Heart from '@lucide/svelte/icons/heart';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import ImgUploadButton from './ImgUploadButton.svelte';
	import IngredientEditItem from './IngredientEditItem.svelte';
	import { customOptionKey, type StepIngredientOption } from './step-hints';
	import StepHintsEditor from './StepHintsEditor.svelte';

	const pageRecipeId = page.params.id as string;
	const isNewRecipe = pageRecipeId === 'new';

	const banner = page.url.searchParams.get('banner') || undefined;
	let openBanner = $state(banner ? true : false);

	const activeSpace = getActiveSpaceState();

	// Validate the form data using zod
	const form = superForm(
		defaults({ stepHints: [emptyRecipeStepHints()] }, zod4(createRecipeFormSchema)),
		{
			SPA: true,
			dataType: 'json',
			validators: zod4(createRecipeFormSchema),
			resetForm: false,
			taintedMessage: null,
			async onUpdate({ form }) {
				if (form.valid) {
					await onSubmit(form.data);
					toast.success('Recipe saved! 👨‍🍳');
				} else {
					console.error('Form validation failed:', form.errors);
					toast.error('Please fix the errors in the form.');
				}
			}
		}
	);
	const { form: formData, enhance, errors, tainted, isTainted, submit } = form;

	let dirty = $derived(isTainted($tainted));

	/** Top-level ingredients exposed to the per-step hint editor. */
	const stepIngredientOptions = $derived.by(() =>
		$formData.ingredientIds.map((id, index) => {
			const customName = $formData.ingredientCustomNames[index] ?? null;
			const name = $formData.ingredientNames[index] || customName || 'Ingredient';
			return {
				key: id ? `id:${id}` : customOptionKey(name),
				ingredientId: id,
				name,
				customName,
				amount: $formData.ingredientAmounts[index] ?? 1,
				unit: $formData.ingredientUnits[index] || 'whole'
			} satisfies StepIngredientOption;
		})
	);

	// Update the form data with the recipe document data whenever it changes

	$effect(() => {
		// If it's a new recipe, we don't need to fetch the recipe data
		const lang = normalizeLanguageCode(activeSpace.language?.lang);
		if (isNewRecipe || !lang) return;

		// Fetch the recipe from Supabase
		getRecipeDetailed(pageRecipeId, lang).then(({ data: recipeData, error: recipeError }) => {
			console.log('Fetched recipe data:', recipeData, 'Error:', recipeError);

			if (recipeError || !recipeData) {
				console.error('Error fetching recipe:', recipeError);
				return;
			}

			formData.update(
				(f) => {
					// General info
					f.lang = normalizeLanguageCode(recipeData.language?.lang) ?? DEFAULT_LANGUAGE;
					f.title = recipeData.title || 'New recipe';
					f.short_title = recipeData.short_title || 'New';
					f.description = recipeData.description || 'Delicious new recipe';

					// Source
					f.source_url = recipeData.source_url;

					// Images
					f.imageIds = recipeData.image_ids || [];

					// Filters
					f.timesofday_ids = recipeData.times_of_day || [];
					f.course_ids = recipeData.courses || [];
					f.cuisine_ids = recipeData.cuisines || [];
					// f.tag_ids = recipeData.tags || []; // TODO revisit later
					f.tool_ids = recipeData.tools || [];

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
					f.ingredientCustomNames = recipeData.ingredients.map((ing) => ing.custom_name || null);
					f.ingredientAmounts = recipeData.ingredients.map((ing) => ing.quantity || 1);
					f.ingredientUnits = recipeData.ingredients.map((ing) => ing.unit || 'whole');
					f.ingredientIsOptional = recipeData.ingredients.map((ing) => ing.is_optional || false);
					f.ingredientRawInputs = recipeData.ingredients.map((ing) => ing.raw_input || '');
					f.ingredientDetails = recipeData.ingredients.map((ing) => ing.details || '');
					f.ingredientNotes = recipeData.ingredients.map((ing) => ing.notes || '');
					f.ingredientPreparations = recipeData.ingredients.map((ing) => ing.preparation || '');

					f.ingredientNames = recipeData.ingredients.map((ing) => {
						const amount = ing.quantity || 1;
						return resolveIngredientName(ing.ingredient?.translations, {
							lang: recipeData.language?.lang,
							plural: amount > 1,
							customName: ing.custom_name
						});
					});

					// Steps (keep the enrichment hints aligned with the editable text)
					f.stepDescriptions = recipeData.steps?.map((step) => step.text) || [''];
					f.stepHints =
						recipeData.steps?.map((step) => ({
							ingredients: step.ingredients,
							timer_minutes: step.timer_minutes,
							temperature_amount: step.temperature_amount,
							temperature_unit: step.temperature_unit
						})) || [emptyRecipeStepHints()];
					return f;
				},
				{ taint: false }
			);
		});
	});

	/** Moves a step's text and its enrichment hints together. */
	function moveStep(sourceIndex: number, targetIndex: number) {
		const text = $formData.stepDescriptions[sourceIndex];
		$formData.stepDescriptions[sourceIndex] = $formData.stepDescriptions[targetIndex];
		$formData.stepDescriptions[targetIndex] = text;

		const hints = $formData.stepHints[sourceIndex] ?? emptyRecipeStepHints();
		$formData.stepHints[sourceIndex] = $formData.stepHints[targetIndex] ?? emptyRecipeStepHints();
		$formData.stepHints[targetIndex] = hints;
	}

	function removeStep(index: number) {
		$formData.stepDescriptions = $formData.stepDescriptions.filter((_, i) => i !== index);
		$formData.stepHints = $formData.stepHints.filter((_, i) => i !== index);
	}

	function addStep() {
		$formData.stepDescriptions = [...$formData.stepDescriptions, ''];
		$formData.stepHints = [...$formData.stepHints, emptyRecipeStepHints()];
	}

	function onAddIngredient(
		ingredientProcessed: IngredientProcessed | null,
		chosenMatchIndex: number | null
	) {
		if (!ingredientProcessed) {
			toast.error('Some error occurred while processing your input.');
			return;
		}

		const amount = ingredientProcessed.parsed.quantity?.amount ?? 1;
		const unit = ingredientProcessed.parsed.quantity?.unitKey ?? 'whole';
		const isOptional = ingredientProcessed.parsed.isOptional ?? false;

		// Custom ingredient (not in the catalog): no match selected
		if (chosenMatchIndex === null) {
			const customName = buildCustomIngredientName(ingredientProcessed.parsed.ingredientText);
			if (!customName) {
				toast.error('Failed to add ingredient. Please try again.');
				return;
			}

			// Exit if there is already a custom ingredient with the same name to avoid duplicates
			if (
				$formData.ingredientCustomNames.some(
					(name) => name?.toLowerCase() === customName.toLowerCase()
				)
			) {
				toast.error('Already in the list.', {
					description: 'Please edit the existing ingredient instead.'
				});
				return;
			}

			formData.update(
				(f) => {
					f.ingredientIds.push(null);
					f.ingredientCustomNames.push(customName);
					f.ingredientAmounts.push(amount);
					f.ingredientUnits.push(unit);
					f.ingredientNames.push(customName);
					f.ingredientIsOptional.push(isOptional);
					f.ingredientRawInputs.push('');
					f.ingredientDetails.push('');
					f.ingredientNotes.push('');
					f.ingredientPreparations.push('');
					return f;
				},
				{ taint: true }
			);
			return;
		}

		const chosenMatch = ingredientProcessed.matches[chosenMatchIndex];

		// Exit if there is already an ingredient with the same ID in the list to avoid duplicates
		if ($formData.ingredientIds.includes(chosenMatch.id)) {
			toast.error('Already in the list.', {
				description: 'Please edit the existing ingredient instead.'
			});
			return;
		}

		const translation =
			chosenMatch.translations.find((t) => t.language?.lang === $formData.lang) ||
			chosenMatch.translations[0];
		const name =
			amount > 1
				? translation.name_plural || translation.name_singular
				: translation.name_singular || translation.name_plural;

		if (!chosenMatch.id || !name) {
			toast.error('Failed to add ingredient. Please try again.');
			return;
		}

		formData.update(
			(f) => {
				f.ingredientIds.push(chosenMatch.id);
				f.ingredientCustomNames.push(null);
				f.ingredientAmounts.push(amount);
				f.ingredientUnits.push(unit);
				f.ingredientNames.push(name);
				f.ingredientIsOptional.push(isOptional);
				f.ingredientRawInputs.push(/*ingredientProcessed.sourceText ||*/ ''); // Users typing are incomplete, ugly raw input
				f.ingredientDetails.push('');
				f.ingredientNotes.push('');
				f.ingredientPreparations.push('');
				return f;
			},
			{ taint: true }
		);
	}

	let loading = $state(false);

	async function onSubmit(data: Infer<CreateRecipeFormSchema>) {
		loading = true;
		try {
			// M2: persistence lives in the `recipes.edit` core op (upsert +
			// delete + re-insert of ingredients); toast/goto stay here.
			const { id } = await runOp<EditRecipeInput, EditRecipeOutput>(
				'recipes.edit',
				await getClientCtx(),
				{ recipeId: isNewRecipe ? null : pageRecipeId, data }
			);

			// Go to the recipe view page
			await goto(`/recipes/${id}`);
		} catch (error) {
			console.error('Error saving recipe:', error);
			toast.error(error instanceof OpError ? error.message : 'Failed to save recipe.');
		} finally {
			loading = false;
		}
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

	function onDeleteIngredient(index: number) {
		formData.update(
			(f) => {
				if (index < 0 || index >= f.ingredientIds.length) return f;

				f.ingredientIds.splice(index, 1);
				f.ingredientCustomNames.splice(index, 1);
				f.ingredientAmounts.splice(index, 1);
				f.ingredientUnits.splice(index, 1);
				f.ingredientNames.splice(index, 1);
				f.ingredientIsOptional.splice(index, 1);
				f.ingredientRawInputs.splice(index, 1);
				f.ingredientDetails.splice(index, 1);
				f.ingredientNotes.splice(index, 1);
				f.ingredientPreparations.splice(index, 1);
				return f;
			},
			{ taint: true }
		);
	}

	let showDismissDialog = $state(false);
	let dismissDialogMode: 'discard' | 'delete' = $state('discard');

	const media = useMedia();
</script>

<form method="POST" use:enhance class="space-y-8">
	<div class="flex flex-col">
		<main class="grid flex-1 gap-4 md:gap-8">
			<div class="mx-auto grid max-w-236 flex-1 auto-rows-max gap-4">
				<div class="flex items-center gap-4">
					<Button
						variant="secondary"
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

					<div class="items-center gap-2 ml-auto flex">
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
								<span class="hidden md:block">Delete</span>
							</Button>
						{/if}

						<Button
							size="sm"
							type="submit"
							class="w-14 flex gap-2"
							disabled={loading}
							onclick={submit}
						>
							{#if loading}
								<LoaderCircle class="h-4 w-4 animate-spin" />
							{:else}
								Save
							{/if}
						</Button>
					</div>
				</div>

				{#if banner == 'import-incomplete' && openBanner}
					<div
						class="w-full bg-green-50 dark:bg-green-900 flex gap-8 p-4 items-start text-green-800 dark:text-white rounded-md"
						out:slide
					>
						<div class="rounded-md text-sm">
							<span class="font-semibold">Almost there!</span>
							<span>
								It seems the recipe is missing some information. Please take a moment to fill in the
								remaining details.
							</span>
						</div>
						<button class="ml-auto" onclick={() => (openBanner = false)}>
							<X class="h-4 w-4" />
						</button>
					</div>
				{/if}

				{#each Object.entries($errors) || [] as [key, messages] (key)}
					<Label class="text-red-600 ml-auto">
						{`${typeof messages == 'string' ? messages : Object.values(messages).join(', ')}`}
					</Label>
				{/each}

				<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						<Card.Root class="bg-card">
							<Card.Header class="flex-row items-center">
								<div class="grid space-y-1.5">
									<Card.Title>Recipe Details</Card.Title>
									<Card.Description>This is the main information about the recipe</Card.Description>
								</div>
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
											<Form.FieldErrors class="text-red-600" />
										</Form.Field>

										<Form.Field {form} name="short_title" class="w-50 grid">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Short title</Form.Label>
													<Input
														disabled={loading}
														{...props}
														bind:value={$formData.short_title}
														placeholder="Cookies"
														maxlength={40}
													/>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors class="text-red-600" />
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
													class="min-h-24 text-wrap"
												/>
											{/snippet}
										</Form.Control>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<div class="flex gap-4">
										<Form.Field {form} name="source_url" class="w-full grid">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Source URL (optional)</Form.Label>
													<Input
														disabled={loading}
														{...props}
														bind:value={$formData.source_url}
														placeholder="https://... (leave empty for a manual recipe)"
													/>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors class="text-red-600" />
										</Form.Field>

										<Form.Field {form} name="lang" class="grid">
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Language</Form.Label>
													<Select.Root
														{...props}
														type="single"
														name="lang"
														bind:value={$formData.lang}
													>
														<Select.Trigger class="h-9 w-24">
															{CURATED_LANGUAGES[$formData.lang]?.emoji || '?'}
														</Select.Trigger>
														<Select.Content>
															<Select.Group>
																<Select.GroupHeading>Ingredient search language</Select.GroupHeading
																>
																{#each Object.entries(CURATED_LANGUAGES) as [value, lang] (value)}
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
											<Form.FieldErrors class="text-red-600" />
										</Form.Field>
									</div>
								</div>
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Header>
								<div class="flex">
									<div class="flex flex-col space-y-1.5">
										<Card.Title>Ingredients</Card.Title>
										<Card.Description>List ingredients needed</Card.Description>
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

								<SearchResultsSidebar
									onSelect={onAddIngredient}
									class="mb-3 min-w-0 flex-1"
									displayColumns={media.sm ? 5 : 3}
									displayRows={media.sm ? 1 : 2}
									display="ingredients"
									allowCustom
								/>

								<Label>Required</Label>
								{@render ingredientList(false)}

								<Label class="mt-3">Optional</Label>
								{@render ingredientList(true)}
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Header>
								<Card.Title>Instructions</Card.Title>
								<Card.Description>
									Add each step and link the ingredients, timer and temperature it mentions.
								</Card.Description>
							</Card.Header>
							<Card.Content class="grid gap-6">
								{#each $formData.stepDescriptions as _, i (i)}
									<div animate:flip={{ duration: 200 }}>
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
																	onclick={() => moveStep(i, i - 1)}
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
																	onclick={() => moveStep(i, i + 1)}
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
																	onclick={() => removeStep(i)}
																>
																	<X class="size-4" />
																	<span class="sr-only">Delete</span>
																</Button>
															{/if}
														</div>

														<Textarea
															{...props}
															id="description"
															placeholder="In a large bowl, cream together the butter, brown sugar, and white sugar until smooth."
															class="min-h-20 max-h-52"
															bind:value={$formData.stepDescriptions[i]}
														/>

														<StepHintsEditor
															bind:hints={$formData.stepHints[i]}
															options={stepIngredientOptions}
															disabled={loading}
														/>

														{#if $errors.stepDescriptions?.[i]}
															<p class="text-destructive text-sm font-medium">
																{$errors.stepDescriptions[i]}
															</p>
														{/if}
													</div>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors class="text-red-600" />
										</Form.Field>
									</div>
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
									onclick={addStep}
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
									<p class="text-[11px] text-muted-foreground/80">
										<strong>Tip:</strong>
										YouTube recipes have their video thumbnail as default, upload to override.
									</p>
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
									<Form.Field {form} name="skillLevel" class="grid gap-1.5">
										<Label>Skill needed</Label>
										<OptionPills
											bind:value={$formData.skillLevel}
											options={[
												{ value: 'beginner', label: 'Beginner' },
												{ value: 'intermediate', label: 'Intermediate' },
												{ value: 'advanced', label: 'Advanced' },
												{ value: 'chef', label: 'Chef' }
											]}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<Form.Field {form} name="effortLevel" class="grid gap-1.5">
										<Label>Effort needed</Label>
										<OptionPills
											bind:value={$formData.effortLevel}
											options={[
												{ value: 'none', label: 'None' },
												{ value: 'low', label: 'Low' },
												{ value: 'medium', label: 'Medium' },
												{ value: 'high', label: 'High' }
											]}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<Form.Field {form} name="costLevel" class="grid gap-1.5">
										<Label>Cost</Label>
										<OptionPills
											bind:value={$formData.costLevel}
											options={[
												{ value: 'minimal', label: 'Minimal' },
												{ value: 'budget', label: 'Budget' },
												{ value: 'average', label: 'Average' },
												{ value: 'premium', label: 'Premium' }
											]}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<Form.Field {form} name="cleanupLevel" class="grid gap-1.5">
										<Label>Cleanup effort</Label>
										<OptionPills
											bind:value={$formData.cleanupLevel}
											options={[
												{ value: 'none', label: 'None' },
												{ value: 'low', label: 'Low' },
												{ value: 'medium', label: 'Medium' },
												{ value: 'high', label: 'High' }
											]}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

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
											<Form.FieldErrors class="text-red-600" />
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
											<Form.FieldErrors class="text-red-600" />
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
											<Form.FieldErrors class="text-red-600" />
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
									<Form.Field {form} name="timesofday_ids" class="grid gap-1.5">
										<Label>Time of day</Label>
										<OptionPills
											multiple
											bind:values={$formData.timesofday_ids}
											options={Object.entries(recipeTimesOfDay).map(([value, label]) => ({
												value,
												label
											}))}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<Form.Field {form} name="course_ids" class="grid gap-1.5">
										<Label>Courses</Label>
										<OptionPills
											multiple
											bind:values={$formData.course_ids}
											options={Object.entries(recipeCourses).map(([value, label]) => ({
												value,
												label
											}))}
										/>
										<Form.FieldErrors class="text-red-600" />
									</Form.Field>

									<Form.Field {form} name="cuisine_ids" class="grid gap-1.5">
										<Label>Cuisines</Label>
										<OptionPills
											multiple
											bind:values={$formData.cuisine_ids}
											groups={recipeCuisineGroups.map((group) => ({
												label: group.label,
												options: group.keys.map((key) => ({
													value: key,
													label: recipeCuisines[key]
												}))
											}))}
										/>
										<Form.FieldErrors class="text-red-600" />
										<p class="text-[11px] text-muted-foreground/80">
											<strong>Tip:</strong>
											Ask for more options on Discord!
										</p>
									</Form.Field>
								</div>
							</Card.Content>
						</Card.Root>

						<VoteForFeatures
							title="Want nutrition facts, custom filters, tags, nested recipes, and more?"
						/>
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
				class={dismissDialogMode == 'delete' ? 'bg-red-700' : ''}
				onclick={async () => {
					if (dismissDialogMode == 'delete') {
						await deleteRecipe(pageRecipeId);
						goto('/recipes');
					} else {
						if (window) window.history.back();
					}
					// goto('/recipes' + (isNewRecipe ? '' : `/${pageRecipeId}`));
				}}
			>
				{#if dismissDialogMode == 'delete'}
					Delete forever
				{:else}
					Discard changes
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#snippet ingredientList(isOptional: boolean)}
	{#each $formData.ingredientIds
		.map((id, idx) => ({ id, idx }))
		.filter(({ idx }) => $formData.ingredientIsOptional?.[idx] === isOptional) as { id, idx } (id ?? `custom:${$formData.ingredientCustomNames[idx]}`)}
		<IngredientEditItem
			{form}
			{id}
			bind:name={$formData.ingredientNames[idx]}
			bind:amount={$formData.ingredientAmounts[idx]}
			bind:unit={$formData.ingredientUnits[idx]}
			bind:isOptional={$formData.ingredientIsOptional[idx]}
			disabled={loading}
			disableDelete={$formData.ingredientIds.length <= 2}
			onDelete={() => {
				onDeleteIngredient(idx);
			}}
		/>
	{:else}
		<p
			class="text-xs text-muted-foreground text-center bg-muted/40 p-4 rounded-md flex items-center justify-center gap-1"
		>
			Click <ArrowUpDown class="size-4" /> on existing ingredients to make them
			{isOptional ? 'optional' : 'required'}
		</p>
	{/each}
{/snippet}
