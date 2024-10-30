<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Upload from 'lucide-svelte/icons/upload';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import { Input } from '$lib/shared/components/ui/input/index.js';
	import { Label } from '$lib/shared/components/ui/label/index.js';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import * as Table from '$lib/shared/components/ui/table/index.js';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import * as ToggleGroup from '$lib/shared/components/ui/toggle-group/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { ChevronDown, ChevronUp, Download, Plus, Trash2, TriangleAlert, X } from 'lucide-svelte';
</script>

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
					<Button variant="outline" size="sm">Discard</Button>
					<ButtonThemed size="sm">Save Recipe</ButtonThemed>
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
							<ButtonThemed class="ml-auto" size="sm">
								<Download class="mr-2 h-4 w-4" />
								<span>Web import</span>
							</ButtonThemed>
						</Card.Header>
						<Card.Content>
							<div class="grid gap-6">
								<div class="grid gap-3">
									<Label for="name">Title</Label>
									<Input id="name" type="text" class="w-full" placeholder="Chocolate cookies" />
								</div>
								<div class="grid gap-3">
									<Label for="description">Description</Label>
									<Textarea
										id="description"
										placeholder="A delicious recipe for chocolate cookies that will make your day! It is easy to make and will be ready in no time."
										class="min-h-32"
									/>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
					<Card.Root>
						<Card.Header>
							<Card.Title>Ingredients</Card.Title>
							<Card.Description>List all the ingredients required for the recipe</Card.Description>
						</Card.Header>
						<Card.Content>
							<Table.Root>
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
										<Table.Cell>
											<Label for="stock-1" class="sr-only">Stock</Label>
											<Input id="stock-1" type="number" value="100" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-1" class="sr-only">Price</Label>
											<Input id="price-1" type="number" value="99.99" />
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
										<Table.Cell class="font-semibold">GGPC-002</Table.Cell>
										<Table.Cell>
											<Label for="stock-2" class="sr-only">Stock</Label>
											<Input id="stock-2" type="number" value="143" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-2" class="sr-only">Price</Label>
											<Input id="price-2" type="number" value="99.99" />
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
										<Table.Cell class="font-semibold">GGPC-003</Table.Cell>
										<Table.Cell>
											<Label for="stock-3" class="sr-only">Stock</Label>
											<Input id="stock-3" type="number" value="32" />
										</Table.Cell>
										<Table.Cell>
											<Label for="price-3" class="sr-only">Stock</Label>
											<Input id="price-3" type="number" value="99.99" />
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
							</Table.Root>
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
								<div class="grid grid-cols-5 gap-3">
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
								<div class="grid grid-cols-5 gap-3">
									<div class="bg-muted w-full aspect-square rounded-md"></div>
									<div class="border w-full aspect-square rounded-md">
										<Plus class="size-8 m-auto h-full text-muted-foreground" />
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
							<div class="grid grid-cols-5 gap-3">
								<div class="w-full aspect-square rounded-md bg-yellow-900/40"></div>
								<div class="w-full aspect-square rounded-md bg-yellow-900/40"></div>
								<div class="w-full aspect-square rounded-md bg-yellow-900/40"></div>
								<div class="w-full aspect-square rounded-md bg-yellow-900/40"></div>
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
							<Card.Title>Recipe Images</Card.Title>
							<Card.Description>Make your recipe stand out!</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="grid gap-2">
								<img
									src="/signup-bg.jpg"
									alt="Recipe"
									class="aspect-square w-full rounded-md object-cover"
									height="300"
									width="300"
								/>
								<div class="grid grid-cols-3 gap-2">
									<button>
										<img
											src="/login-bg.jpeg"
											alt="Recipe"
											class="aspect-square w-full rounded-md object-cover"
											height="84"
											width="84"
										/>
									</button>
									<button>
										<img
											src="/cuicuit_logo.jpg"
											alt="Recipe"
											class="aspect-square w-full rounded-md object-cover"
											height="84"
											width="84"
										/>
									</button>
									<button
										class="flex aspect-square w-full items-center justify-center rounded-md border border-dashed"
									>
										<Upload class="text-muted-foreground h-4 w-4" />
										<span class="sr-only">Upload</span>
									</button>
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
									<Label for="cuisine">Cuisine</Label>
									<Select.Root>
										<Select.Trigger id="cuisine" aria-label="Select cuisine">
											<Select.Value placeholder="Select cuisine" />
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="italian" label="Italian">Italian</Select.Item>
											<Select.Item value="mexican" label="Mexican">Mexican</Select.Item>
											<Select.Item value="french" label="French">French</Select.Item>
											<Select.Item value="japanese" label="Japanese">Japanese</Select.Item>
											<Select.Item value="chinese" label="Chinese">Chinese</Select.Item>
											<Select.Item value="indian" label="Indian">Indian</Select.Item>
											<Select.Item value="thai" label="Thai">Thai</Select.Item>
											<Select.Item value="greek" label="Greek">Greek</Select.Item>
											<Select.Item value="mediterranean" label="Mediterranean">
												Mediterranean
											</Select.Item>
											<Select.Item value="american" label="American">American</Select.Item>
											<Select.Item value="spanish" label="Spanish">Spanish</Select.Item>
											<Select.Item value="german" label="German">German</Select.Item>
											<Select.Item value="brazilian" label="Brazilian">Brazilian</Select.Item>
											<Select.Item value="portuguese" label="Portuguese">Portuguese</Select.Item>
											<Select.Item value="russian" label="Russian">Russian</Select.Item>
											<Select.Item value="turkish" label="Turkish">Turkish</Select.Item>
											<Select.Item value="korean" label="Korean">Korean</Select.Item>
											<Select.Item value="vietnamese" label="Vietnamese">Vietnamese</Select.Item>
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
					<!-- <Card.Root>
							<Card.Header>
								<Card.Title>Archive Recipe</Card.Title>
								<Card.Description>
									Lipsum dolor sit amet, consectetur adipiscing elit.
								</Card.Description>
							</Card.Header>
							<Card.Content>
								<div></div>
								<Button size="sm" variant="secondary">Archive Recipe</Button>
							</Card.Content>
						</Card.Root> -->
				</div>
			</div>
			<div class="flex items-center justify-center gap-2 md:hidden">
				<Button variant="outline" size="sm">Discard</Button>
				<Button size="sm">Save Recipe</Button>
			</div>
		</div>
	</main>
</div>
