function createMealIngredientHoverState() {
	let hoveredMealIngredientId = $state<string | null>(null);

	return {
		get value() {
			return hoveredMealIngredientId;
		},
		set value(id: string | null) {
			hoveredMealIngredientId = id;
		}
	};
}

export const hoveredMealIngredientId = createMealIngredientHoverState();

function createMealIngredientSelectState() {
	let selectedMealIngredientId = $state<string | null>(null);

	return {
		get value() {
			return selectedMealIngredientId;
		},
		set value(id: string | null) {
			selectedMealIngredientId = id;
		}
	};
}

export const selectedMealIngredientId = createMealIngredientSelectState();
