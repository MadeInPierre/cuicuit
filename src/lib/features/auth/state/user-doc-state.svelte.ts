import { DocState } from '$lib/shared/db/doc-state.svelte';
import { auth, firestore } from '$lib/shared/db/firebase-client';
import { untrack } from 'svelte';
import { userDocConverter, type UserDoc, type DBUserDoc } from '../db/types';
import { onAuthStateChanged, type User } from 'firebase/auth';

export class UserDocState {
	/** The current auth user, undefined if loading, null if not logged in */
	user: User | undefined | null = $state(undefined);

	private _doc: UserDoc | undefined | null = $state(undefined);

	/** True if either the user or the userDoc are still loading */
	isLoading: boolean = $derived(this.user === undefined || this.doc === undefined);

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
		// this.setDoc(newData); // if we wanted to allow setting the doc directly
	}

	// Unsubscribe function for the docState
	private unsub: () => void = () => {};

	/** The full DocState instance if needed to access all document methods */
	docState: DocState<UserDoc, DBUserDoc> | undefined;

	constructor() {
		// Track the auth user
		$effect(() => {
			return onAuthStateChanged(auth, (user) => (this.user = user));
		});

		// Subscribe to the user document
		$effect(() => {
			if (this.user === undefined) {
				this._doc = undefined; // Loading
				this.docState = undefined;
			} else if (this.user === null) {
				this._doc = null; // Not logged in
				this.docState = undefined;
			} else {
				// Subscribe to the user document
				this.docState = untrack(
					() =>
						new DocState<UserDoc, DBUserDoc>(firestore, `users/${this.user!.uid}`, userDocConverter)
				);

				// TODO How to subscribe to the doc without the store (using $state)?
				this.unsub = this.docState.store.subscribe((doc) => {
					this._doc = doc.data;
				});
			}

			// Unsubscribe when the user changes
			return this.unsub;
		});
	}
}
