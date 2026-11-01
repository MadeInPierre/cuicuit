// Used to store the selected meal in the shopping list's horizontal scroll meals list.
// Shared by the shopping list page and the mobile bottom navbar to display the active pill.
export const selectedShoppingMeal = $state<{ id: string | null; title: string | null }>({
	id: null,
	title: null
});
