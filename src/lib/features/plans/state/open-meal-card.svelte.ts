function createMealCardOpenState() {
	let openMealCardId = $state<string | null>(null);

	return {
		get value() {
			return openMealCardId;
		},
		set value(id: string | null) {
			openMealCardId = id;
		}
	};
}

export const openMealCardId = createMealCardOpenState();
