import { DocState } from '$lib/shared/db/doc-state.svelte';
import { auth, firestore } from '$lib/shared/db/firebase-client';
import { getContext, setContext, untrack } from 'svelte';
import { userDocConverter, type UserDoc, type DBUserDoc } from '../db/types';
import { onAuthStateChanged, type User } from 'firebase/auth';

class UserDocState {
	/** The current auth user, undefined if loading, null if not logged in */
	user: User | undefined | null = $state(undefined);

	/** The full DocState instance if needed to access all document methods */
	docState: DocState<UserDoc, DBUserDoc> | undefined = $state(undefined);

	/** The user document, undefined if loading, null if not logged in */
	private _doc: UserDoc | undefined | null = $derived.by(() => {
		if (this.user === null || this.user === undefined)
			return this.user; // null if not logged in or undefined if loading
		else if (!this.docState)
			return undefined; // loading
		else return this.docState?.data;
	});

	/**
	 * Get the doc from Firestore, returns undefined if loading or null if not logged in.
	 * @returns The user document, or undefined if loading, or null if not logged in
	 */
	get doc(): UserDoc | undefined | null {
		return this._doc;
	}

	/**
	 * Set the doc in Firestore, merges with the existing document.
	 * @param newData The new data to set, merges with the existing document
	 */
	set doc(newData: Partial<UserDoc>) {
		// Forbid setting the doc directly for better code maintainability
		throw new Error('Do not set doc directly, use docState.setDoc() instead');
		// this.setDoc(newData); // Uncomment this if we wanted to allow setting the doc directly
	}

	/** True if either the user or the userDoc are still loading */
	isLoading: boolean = $derived(this.user === undefined || this.doc === undefined);

	constructor() {
		// Track the auth user
		$effect(() => {
			return onAuthStateChanged(auth, (user) => (this.user = user));
		});

		// Subscribe to the user document
		$effect(() => {
			if (this.user === undefined) {
				this.docState = undefined; // this._doc will update through $derived
			} else if (this.user === null) {
				this.docState = undefined; // this._doc will update through $derived
			} else {
				// Subscribe to the user document
				this.docState = untrack(
					() =>
						new DocState<UserDoc, DBUserDoc>(firestore, `users/${this.user!.uid}`, userDocConverter)
				);
			}
		});
	}
}

// Only export the type to forbid creating new instances.
// Must use the create/getUserDocState() functions in components
export type { UserDocState };

const KEY = Symbol('USER_DOC_STATE');

export function createUserDocState(): UserDocState {
	return setContext(KEY, new UserDocState());
}

export function getUserDocState(): UserDocState {
	return getContext<ReturnType<typeof createUserDocState>>(KEY);
}
