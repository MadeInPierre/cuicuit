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
	import * as ToggleGroup from '$lib/shared/components/ui/toggle-group/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import { superForm, defaults, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import {
		ChevronDown,
		ChevronUp,
		Download,
		Plus,
		FileImage,
		FileText,
		TriangleAlert,
		X,
		Globe,
		Trash2
	} from 'lucide-svelte';
	import { Quantity } from '$lib/shared/utils/quantity';
	import {
		createRecipeFormSchema,
		type CreateRecipeFormSchema
	} from '$lib/features/recipes/models/schemas';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import ImgUploadButton from './ImgUploadButton.svelte';
	import { page } from '$app/stores';
	import { DocState } from '$lib/shared/db/doc-state.svelte';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		recipeDocConverter,
		type DBRecipeDoc,
		type RecipeDoc
	} from '$lib/features/recipes/db/recipe-doc';

	// Load the recipe document
	const pageRecipeId = $page.params.id;
	let recipeDocState = new DocState<RecipeDoc, DBRecipeDoc>(
		firestore,
		`recipes/${pageRecipeId}`,
		recipeDocConverter
	);

	// Validate the form data using zod
	const form = superForm(defaults(zod(createRecipeFormSchema)), {
		SPA: true,
		validators: zod(createRecipeFormSchema),
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
		}
	});
	const { form: formData, enhance } = form;

	const userDocState = getUserDocState();

	let searchInput = $state('');
	let result = $state('');

	// Update the form data with the recipe document data
	$effect(() => {
		if (!recipeDocState.data) return;

		$formData.title = recipeDocState.data.title;
		$formData.description = recipeDocState.data.description;
	});

	// Debounce the search input
	// TODO this is temporary just for testing and fun with the Quantity library & embeddings
	let debounceTimeout: NodeJS.Timeout;
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

	function onSubmit(data: Infer<CreateRecipeFormSchema>) {
		if (!recipeDocState.data) return;

		recipeDocState.updateDoc({
			title: data.title,
			description: data.description
		});
	}
</script>

<form method="POST" use:enhance class="space-y-8">
	<div class="bg-muted/40 w-full min-h-screen flex flex-col sm:gap-4 sm:py-4">
		<main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			<div class="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
				<div class="flex items-center gap-4">
					<Button variant="outline" size="icon" class="h-7 w-7" href="/recipes">
						<ChevronLeft class="h-4 w-4" />
						<span class="sr-only">Back</span>
					</Button>
					<h1
						class="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0"
					>
						New Recipe
					</h1>
					<!-- <Badge variant="outline" class="ml-auto sm:ml-0">In stock</Badge> -->
					<div class="hidden items-center gap-2 md:ml-auto md:flex">
						<Button variant="outline" size="sm">
							{#if recipeDocState.data?.status == 'draft'}
								Discard
							{:else}
								<Trash2 class="h-4 w-4" />
								Delete
							{/if}
						</Button>
						<ButtonThemed size="sm" type="submit">Save</ButtonThemed>
					</div>
				</div>
				<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						<Card.Root>
							<Card.Header class="flex-row items-center">
								<div class="grid space-y-1.5">
									<Card.Title>Recipe Details</Card.Title>
									<Card.Description>This is the main information about the recipe</Card.Description>
								</div>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild let:builder>
										<ButtonThemed builders={[builder]} class="ml-auto" size="sm">
											<Download class="mr-2 h-4 w-4" />
											<span>Import</span>
										</ButtonThemed>
										<!-- <Button builders={[builder]} variant="outline">Open</Button> -->
									</DropdownMenu.Trigger>
									<DropdownMenu.Content class="w-44" align="start">
										<DropdownMenu.Item href="/recipes/new">
											<Globe class="mr-2 h-4 w-4" />
											<span>From the web...</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<FileImage class="mr-2 h-4 w-4" />
											<span>Photo or PDF...</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<FileText class="mr-2 h-4 w-4" />
											<span>Text or document...</span>
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<Form.Field {form} name="title" class="grid">
										<Form.Control let:attrs>
											<Form.Label>Title</Form.Label>
											<Input
												{...attrs}
												bind:value={$formData.title}
												placeholder="Chocolate cookies"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="description" class="grid">
										<Form.Control let:attrs>
											<Form.Label>Description</Form.Label>
											<Textarea
												{...attrs}
												bind:value={$formData.description}
												placeholder="A delicious recipe for chocolate cookies that will make your day! It is easy to make and will be ready in no time."
												class="min-h-32 text-wrap"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Ingredients</Card.Title>
								<Card.Description>List all the ingredients required for the recipe</Card.Description
								>
							</Card.Header>
							<Card.Content class="grid gap-3">
								<Input
									id="name"
									type="text"
									class="w-full shadow-sm"
									placeholder="Search for an ingredient..."
									bind:value={searchInput}
								/>

								<p>{result}</p>

								<!-- <Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-[100px]">Item</Table.Head>
										<Table.Head>Quantity</Table.Head>
										<Table.Head>Details</Table.Head>
										<Table.Head class="w-[100px]">Size</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									<Table.Row>
										<Table.Cell class="font-semibold">Tomatoes</Table.Cell>
										<Table.Cell class="flex gap-2">
											<Label for="stock-1" class="sr-only">Stock</Label>
											<Input id="stock-1" type="number" value="100" />
											<Input id="stock-1" value="g" class="w-16" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-1" class="sr-only">Price</Label>
											<Input id="price-1" placeholder="Fresh" />
										</Table.Cell>
										<Table.Cell>
											<ToggleGroup.Root type="single" value="s" variant="outline">
												<ToggleGroup.Item value="s">S</ToggleGroup.Item>
												<ToggleGroup.Item value="m">M</ToggleGroup.Item>
												<ToggleGroup.Item value="l">L</ToggleGroup.Item>
											</ToggleGroup.Root>
										</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell class="font-semibold">Garlic</Table.Cell>
										<Table.Cell class="flex gap-2">
											<Label for="stock-1" class="sr-only">Stock</Label>
											<Input id="stock-1" type="number" value="100" class="w-16" />
											<Input id="stock-1" value="g" class="w-16" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-2" class="sr-only">Price</Label>
											<Input id="price-2" placeholder="Fresh" />
										</Table.Cell>
										<Table.Cell>
											<ToggleGroup.Root type="single" value="m" variant="outline">
												<ToggleGroup.Item value="s">S</ToggleGroup.Item>
												<ToggleGroup.Item value="m">M</ToggleGroup.Item>
												<ToggleGroup.Item value="l">L</ToggleGroup.Item>
											</ToggleGroup.Root>
										</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell class="font-semibold">Flour</Table.Cell>
										<Table.Cell class="flex gap-2">
											<Label for="stock-1" class="sr-only">Stock</Label>
											<Input id="stock-1" type="number" value="100" />
											<Input id="stock-1" value="g" class="w-16" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-3" class="sr-only">Stock</Label>
											<Input id="price-3" placeholder="Fresh" />
										</Table.Cell>
										<Table.Cell>
											<ToggleGroup.Root type="single" value="s" variant="outline">
												<ToggleGroup.Item value="s">S</ToggleGroup.Item>
												<ToggleGroup.Item value="m">M</ToggleGroup.Item>
												<ToggleGroup.Item value="l">L</ToggleGroup.Item>
											</ToggleGroup.Root>
										</Table.Cell>
									</Table.Row>
								</Table.Body>
							</Table.Root> -->
							</Card.Content>
							<Card.Footer class="justify-center border-t p-4">
								<Button size="sm" variant="ghost" class="gap-1">
									<CirclePlus class="h-3.5 w-3.5" />
									Add Ingredient
								</Button>
							</Card.Footer>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Tools</Card.Title>
								<Card.Description
									>Please select the tools needed to make this recipe</Card.Description
								>
							</Card.Header>
							<Card.Content>
								<div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
									<button
										class="bg-orange-50 aspect-square rounded-md text-center border-2 border-orange-600 text-orange-600"
									>
										Oven
									</button>
									<button class="border aspect-square rounded-md text-center">Microwave</button>
									<button class="border aspect-square rounded-md text-center">Stove</button>
									<button class="border aspect-square rounded-md text-center">Blender</button>
									<button class="border aspect-square rounded-md text-center">Fryer</button>
									<button class="border aspect-square rounded-md text-center">Grill</button>
									<button class="border aspect-square rounded-md text-center">Steamer</button>
									<button class="border aspect-square rounded-md text-center">Toaster</button>
									<button class="border aspect-square rounded-md text-center">Juicer</button>
									<button class="border aspect-square rounded-md text-center">Kettle</button>
								</div>

								<!-- <p>
									TODO Tools will have a dishwasher-safe property to automatically calculate the
									dishwasher level.

									Oven, Microwave, Stove, Fridge, Freezer, Blender, Mixer, Food processor, Toaster, Grill,
									Pressure cooker, Slow cooker, Rice cooker, Steamer, Coffee maker, Kettle, Juicer, Scale,
									Measuring cups, Measuring spoons, Cutting board, Knife, Peeler, Grater, Zester, Slicer,
									Strainer, Colander, Mixing bowl, Whisk, Spatula, Tongs, Ladle, Slotted spoon, Wooden spoon,
									Skillet, Saucepan, Pot, Baking dish, Baking sheet, Cake pan, Muffin tin, Pie dish, Casserole
									dish, Roasting pan, Cooling rack, Parchment paper, Aluminum foil, Plastic wrap, Wax paper,
									Parchment paper, Kitchen timer, Thermometer, Oven mitts, Pot holders, Apron, Kitchen scale,
									Blender, Food processor, Stand mixer, Hand mixer, Immersion blender, Toaster, Toaster oven,
									Coffee maker, Espresso machine, French press, Tea kettle.
								</p> -->
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
								<div class="grid gap-3">
									<div class="flex items-end">
										<Label for="description">Step 1</Label>
										<Button variant="ghost" size="icon" class="size-6 ml-auto">
											<ChevronUp class="size-4" />
											<span class="sr-only">Move up</span>
										</Button>
										<Button variant="ghost" size="icon" class="size-6 ml-2">
											<ChevronDown class="size-4" />
											<span class="sr-only">Move down</span>
										</Button>
										<Button variant="ghost" size="icon" class="size-6 ml-2">
											<X class="size-4" />
											<span class="sr-only">Delete</span>
										</Button>
									</div>
									<Textarea
										id="description"
										placeholder="Preheat the oven to 350 degrees F (175 degrees C). Grease cookie sheets."
										class="min-h-20"
									/>
									<div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
										<div class="bg-muted w-full aspect-square rounded-md"></div>
										<div class="bg-muted w-full aspect-square rounded-md"></div>
										<div class="border w-full aspect-square rounded-md">
											<Plus class="size-8 m-auto h-full text-muted-foreground" />
										</div>
									</div>
								</div>
								<div class="grid gap-3">
									<div class="flex items-end">
										<Label for="description">Step 2</Label>
										<Button variant="ghost" size="icon" class="size-6 ml-auto">
											<ChevronUp class="size-4" />
											<span class="sr-only">Move up</span>
										</Button>
										<Button variant="ghost" size="icon" class="size-6 ml-2">
											<ChevronDown class="size-4" />
											<span class="sr-only">Move down</span>
										</Button>
										<Button variant="ghost" size="icon" class="size-6 ml-2">
											<X class="size-4" />
											<span class="sr-only">Delete</span>
										</Button>
									</div>
									<Textarea
										id="description"
										placeholder="In a large bowl, cream together the butter, brown sugar, and white sugar until smooth."
										class="min-h-20"
									/>
									<div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
										<div class="bg-muted w-full aspect-square rounded-md"></div>
										<div
											class="border w-full aspect-square rounded-md flex flex-col justify-center items-center text-muted-foreground"
										>
											<Plus class="size-8 mb-1" />
											<span class="text-xs">Link</span>
											<span class="text-xs">ingredient</span>
										</div>
									</div>
								</div>
							</Card.Content>
							<Card.Footer class="grid gap-3 border-t p-6">
								<div class="flex flex-col space-y-1.5">
									<div class="flex items-center">
										<Label for="description" class="text-yellow-600 flex gap-2 items-center">
											Unlinked ingredients
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
							</Card.Footer>
							<Card.Footer class="justify-center border-t p-4">
								<Button size="sm" variant="ghost" class="gap-1">
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
										{#each Array.from( { length: Math.min(recipeDocState.data?.imageIds.length || 0, 3) } ) as _, i}
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
										<Label for="motivationLevel">Motivation needed</Label>
										<Select.Root>
											<Select.Trigger id="motivationLevel" aria-label="Select level">
												<Select.Value placeholder="Select level" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="0" label="None" />
												<Select.Item value="1" label="Very low" />
												<Select.Item value="2" label="Low" />
												<Select.Item value="3" label="Medium" />
												<Select.Item value="4" label="High" />
												<Select.Item value="5" label="Very high" />
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid gap-3">
										<Label for="healtyLevel">Healthy level</Label>
										<Select.Root>
											<Select.Trigger id="healtyLevel" aria-label="Select level">
												<Select.Value placeholder="Select level" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="0" label="Terrible" />
												<Select.Item value="1" label="Bad" />
												<Select.Item value="2" label="Okay" />
												<Select.Item value="3" label="Good" />
												<Select.Item value="4" label="Great" />
												<Select.Item value="5" label="Excellent" />
											</Select.Content>
										</Select.Root>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div class="grid gap-3">
											<Label for="dishwasherLevel">Dishwasher</Label>
											<Select.Root>
												<Select.Trigger id="dishwasherLevel" aria-label="Select level">
													<Select.Value placeholder="Select level" />
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
										</div>

										<div class="grid gap-3">
											<Label for="handwashingLevel">Hand washing</Label>
											<Select.Root>
												<Select.Trigger id="handwashingLevel" aria-label="Select level">
													<Select.Value placeholder="Select level" />
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
										</div>
									</div>

									<div class="grid gap-3">
										<Label for="dishwasherLevel">Time</Label>
										<div class="ml-2 flex items-center gap-3">
											<Label class="font-normal text-muted-foreground" for="dishwasherLevel">
												Prep
											</Label>
											<Input placeholder="10" type="number" class="w-20 ml-auto" />
											<ToggleGroup.Root type="single" value="m" variant="outline">
												<ToggleGroup.Item value="m">min</ToggleGroup.Item>
												<ToggleGroup.Item value="h">h</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>

										<div class="ml-2 flex items-center gap-3">
											<Label class="font-normal text-muted-foreground" for="handwashingLevel">
												Cook
											</Label>
											<Input placeholder="10" type="number" class="w-20 ml-auto" />
											<ToggleGroup.Root type="single" value="m" variant="outline">
												<ToggleGroup.Item value="m">min</ToggleGroup.Item>
												<ToggleGroup.Item value="h">h</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>

										<div class="ml-2 flex items-center gap-3">
											<Label class="font-normal text-muted-foreground" for="handwashingLevel">
												Rest
											</Label>
											<Input placeholder="10" type="number" class="w-20 ml-auto" />
											<ToggleGroup.Root type="single" value="m" variant="outline">
												<ToggleGroup.Item value="m">min</ToggleGroup.Item>
												<ToggleGroup.Item value="h">h</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>
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
										<Label for="timeOfDay">Time of day</Label>
										<Select.Root>
											<Select.Trigger id="timeOfDay" aria-label="Select time of day">
												<Select.Value placeholder="Select time of day" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="appetizers" label="Appetizers" />
												<Select.Item value="main" label="Main Dishes" />
												<Select.Item value="side" label="Side Dishes" />
												<Select.Item value="salads" label="Salads" />
												<Select.Item value="breads" label="Breads" />
												<Select.Item value="desserts" label="Desserts" />
												<Select.Item value="breakfast" label="Breakfast and Brunch" />
												<Select.Item value="soups" label="Soups" />
												<Select.Item value="beverages" label="Beverages" />
												<Select.Item value="lunch" label="Lunch" />
												<Select.Item value="cocktails" label="Cocktails" />
												<Select.Item value="condiments" label="Condiments and Sauces" />
												<Select.Item value="snacks" label="Snacks" />
												<Select.Item value="nonfood" label="Non-Food" />
												<Select.Item value="dressings" label="Dressings and Marinades" />
												<Select.Item value="sauces" label="Sauces and Gravies" />
												<Select.Item value="smoothies" label="Smoothies" />
												<Select.Item value="burgers" label="Burgers and Sandwiches" />
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid gap-3">
										<Label for="cuisine">Cuisine</Label>
										<Select.Root>
											<Select.Trigger id="cuisine" aria-label="Select cuisine">
												<Select.Value placeholder="Select cuisine" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="italian" label="Italian" />
												<Select.Item value="mexican" label="Mexican" />
												<Select.Item value="french" label="French" />
												<Select.Item value="japanese" label="Japanese" />
												<Select.Item value="chinese" label="Chinese" />
												<Select.Item value="indian" label="Indian" />
												<Select.Item value="thai" label="Thai" />
												<Select.Item value="greek" label="Greek" />
												<Select.Item value="mediterranean" label="Mediterranean" />
												<Select.Item value="american" label="American" />
												<Select.Item value="spanish" label="Spanish" />
												<Select.Item value="german" label="German" />
												<Select.Item value="brazilian" label="Brazilian" />
												<Select.Item value="portuguese" label="Portuguese" />
												<Select.Item value="russian" label="Russian" />
												<Select.Item value="turkish" label="Turkish" />
												<Select.Item value="korean" label="Korean" />
												<Select.Item value="vietnamese" label="Vietnamese" />
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid gap-3">
										<Label for="foodType">Food type</Label>
										<Select.Root>
											<Select.Trigger id="foodType" aria-label="Select food type">
												<Select.Value placeholder="Select food type" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="appetizer" label="Appetizer">Appetizer</Select.Item>
												<Select.Item value="main" label="Main">Main</Select.Item>
												<Select.Item value="dessert" label="Dessert">Dessert</Select.Item>
												<Select.Item value="drink" label="Drink">Drink</Select.Item>
												<Select.Item value="side" label="Side">Side</Select.Item>
												<Select.Item value="salad" label="Salad">Salad</Select.Item>
											</Select.Content>
										</Select.Root>
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

						<p class="text-xs text-muted-foreground text-center">
							Recipe id: {pageRecipeId}
							{recipeDocState.data?.status}
						</p>
					</div>
				</div>
				<div class="flex items-center justify-center gap-2 md:hidden">
					<Button variant="outline" size="sm">Discard</Button>
					<Button size="sm">Save Recipe</Button>
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
