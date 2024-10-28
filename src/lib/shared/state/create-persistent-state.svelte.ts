import { browser } from '$app/environment';

export function createPersistentState(key: string, initialValue: string | undefined | null) {
	// read the value from localStorage, defaulting to local
	const start: string | undefined | null = browser
		? (localStorage.getItem(key) as string) || initialValue
		: initialValue;

	let activeId = $state<string | undefined | null>(start);

	function set(newValue: string | undefined | null) {
		// Persist the new mode for next startup
		localStorage.setItem(key, newValue || '');

		// Update the state
		activeId = newValue;
	}

	return {
		get id() {
			return activeId;
		},
		set
	};
}
