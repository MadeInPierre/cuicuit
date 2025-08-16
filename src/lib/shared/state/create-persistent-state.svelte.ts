import { browser } from '$app/environment';

export function createPersistentState<T>(
	key: string,
	initialValue: T | null,
	options?: {
		toString?: (value: T) => string;
		fromString?: (value: string) => T | null;
	}
) {
	// read the value from localStorage, defaulting to local
	const start: T | null = browser
		? (options?.fromString
				? options.fromString(localStorage.getItem(key) as string)
				: (localStorage.getItem(key) as T)) || initialValue
		: initialValue;

	let activeId = $state<T | null>(start);

	function set(newValue: T | null) {
		if (newValue === null) {
			// If the new value is null, remove it from localStorage
			localStorage.removeItem(key);
			activeId = newValue;
			return;
		}

		// Persist the new mode for next startup
		localStorage.setItem(
			key,
			options?.toString ? options.toString(newValue) : (newValue as unknown as string)
		);

		// Update the state
		activeId = newValue;
	}

	return {
		get value() {
			return activeId;
		},
		set value(newValue: T | null) {
			set(newValue);
		},
		set
	};
}
