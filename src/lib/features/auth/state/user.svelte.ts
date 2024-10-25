import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, firestore } from '$lib/shared/db/firebase-client';
import { readable } from 'svelte/store';
import { DocState } from '$lib/shared/db/doc-state.svelte';
import { type UserDoc, type DBUserDoc, userDocConverter } from '../db/types';

// State version of the current firebase user
function createUserState() {
	// User firebase auth state
	let userState = $state<User | undefined | null>(undefined);
	onAuthStateChanged(auth, (user) => (userState = user));

	return {
		get user() {
			return userState;
		}
	};
}
export const userState = createUserState();

// Store version of the current firebase user
function createUserStore() {
	const { subscribe } = readable<User | null>(undefined, (set) => onAuthStateChanged(auth, set));

	const known = new Promise<void>((resolve) => {
		let unsub = () => {};
		unsub = subscribe((user) => {
			if (user !== undefined) {
				resolve();
				unsub();
			}
		});
	});

	return { subscribe, known };
}
export const userStore = createUserStore();
