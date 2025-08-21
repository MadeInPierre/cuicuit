<script>
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Card } from '$lib/shared/components/ui/card';
	import { Clock, Users, ChefHat } from 'lucide-svelte';

	const mealPlan = [
		{
			id: 1,
			title: 'Grilled Salmon',
			time: '25 min',
			servings: 4,
			difficulty: 'Medium',
			ingredients: ['Salmon fillets', 'Lemon', 'Garlic', 'Olive oil', 'Herbs'],
			notes: 'Perfect for dinner tonight!',
			image: '/placeholder.svg?height=120&width=160'
		},
		{
			id: 2,
			title: 'Caesar Salad',
			time: '15 min',
			servings: 2,
			difficulty: 'Easy',
			ingredients: ['Romaine lettuce', 'Parmesan', 'Croutons', 'Caesar dressing'],
			notes: 'Quick lunch option',
			image: '/placeholder.svg?height=120&width=160'
		},
		{
			id: 3,
			title: 'Beef Tacos',
			time: '30 min',
			servings: 6,
			difficulty: 'Easy',
			ingredients: ['Ground beef', 'Taco shells', 'Cheese', 'Lettuce', 'Tomatoes'],
			notes: 'Family favorite!',
			image: '/placeholder.svg?height=120&width=160'
		},
		{
			id: 4,
			title: 'Mushroom Risotto',
			time: '45 min',
			servings: 4,
			difficulty: 'Hard',
			ingredients: ['Arborio rice', 'Mushrooms', 'Parmesan', 'White wine', 'Broth'],
			notes: 'Weekend special',
			image: '/placeholder.svg?height=120&width=160'
		},
		{
			id: 5,
			title: 'Chicken Stir Fry',
			time: '20 min',
			servings: 3,
			difficulty: 'Easy',
			ingredients: ['Chicken breast', 'Mixed vegetables', 'Soy sauce', 'Ginger'],
			notes: 'Quick weeknight meal',
			image: '/placeholder.svg?height=120&width=160'
		},
		{
			id: 6,
			title: 'Chocolate Cake',
			time: '60 min',
			servings: 8,
			difficulty: 'Medium',
			ingredients: ['Flour', 'Cocoa powder', 'Eggs', 'Sugar', 'Butter'],
			notes: 'Birthday dessert',
			image: '/placeholder.svg?height=120&width=160'
		}
	];
</script>

<div class="min-h-screen bg-muted p-6">
	<div class="max-w-7xl mx-auto">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each mealPlan as recipe, index}
				<Card
					class="bg-card border border-border shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 relative"
					style="transform: rotate({((index % 3) - 1) * 0.5}deg);"
				>
					<!-- Recipe Image -->
					<div class="relative h-32 overflow-hidden rounded-t-lg">
						<img
							src={recipe.image || '/placeholder.svg'}
							alt={recipe.title}
							class="w-full h-full object-cover"
						/>
						<Badge
							variant={recipe.difficulty === 'Easy'
								? 'secondary'
								: recipe.difficulty === 'Medium'
									? 'default'
									: 'destructive'}
							class="absolute top-2 right-2"
						>
							{recipe.difficulty}
						</Badge>
					</div>

					<!-- Recipe Content -->
					<div class="p-4 space-y-3">
						<!-- Title -->
						<h3 class="text-lg font-semibold text-card-foreground font-sans">
							{recipe.title}
						</h3>

						<!-- Time and Servings -->
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<div class="flex items-center gap-1">
								<Clock class="w-4 h-4" />
								<span>{recipe.time}</span>
							</div>
							<div class="flex items-center gap-1">
								<Users class="w-4 h-4" />
								<span>{recipe.servings} servings</span>
							</div>
						</div>

						<!-- Ingredients -->
						<div class="space-y-2">
							<div class="flex items-center gap-1 text-sm font-medium text-card-foreground">
								<ChefHat class="w-4 h-4" />
								<span>Ingredients:</span>
							</div>
							<div class="flex flex-wrap gap-1">
								{#each recipe.ingredients.slice(0, 3) as ingredient, idx}
									<Badge variant="outline" class="text-xs">
										{ingredient}
									</Badge>
								{/each}
								{#if recipe.ingredients.length > 3}
									<Badge variant="outline" class="text-xs">
										+{recipe.ingredients.length - 3} more
									</Badge>
								{/if}
							</div>
						</div>

						<!-- Notes -->
						<div class="bg-muted rounded-md p-2 border-l-4 border-primary">
							<p class="text-sm text-muted-foreground italic">
								"{recipe.notes}"
							</p>
						</div>
					</div>

					<!-- Paper clip effect -->
					<div
						class="absolute top-0 left-1/2 -translate-y-2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full shadow-md border-2 border-background"
					></div>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Add Recipe Button -->
	<div class="max-w-7xl mx-auto mt-8 text-center">
		<button
			class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
		>
			+ Add New Recipe
		</button>
	</div>
</div>
