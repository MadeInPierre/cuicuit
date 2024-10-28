import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { firestore } from '../db/firebase-client';
import { browser } from '$app/environment';

export type SyncMode = 'offline' | 'online';

function createSyncMode() {
	// read the mode from localStorage, defaulting to local
	const initialMode = browser
		? (localStorage.getItem('sync-mode') as SyncMode) || 'online'
		: 'online';

	// Start with the initial mode
	if (initialMode === 'offline') {
		disableNetwork(firestore);
	}

	let mode = $state(initialMode);

	function set(newMode: SyncMode) {
		// Persist the new mode for next startup
		localStorage.setItem('sync-mode', newMode);

		// Update the state
		mode = newMode;

		// Set network based on mode
		if (newMode == 'offline') {
			console.log('disabling network');
			disableNetwork(firestore);
		} else if (newMode == 'online') {
			console.log('enabling network');
			enableNetwork(firestore);
		}
	}

	function toggle() {
		set(mode === 'offline' ? 'online' : 'offline');
	}

	return {
		get mode() {
			return mode;
		},
		set,
		toggle
	};
}

export const syncMode = createSyncMode();
