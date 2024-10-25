import { DocState, DocSyncStatus } from '$lib/shared/db/doc-state.svelte';
import { auth, firestore } from '$lib/shared/db/firebase-client';
import { untrack } from 'svelte';
import { userDocConverter, type UserDoc, type DBUserDoc } from '../db/types';
import { onAuthStateChanged, type User } from 'firebase/auth';

export class UserDocState {
	user: User | undefined | null = $state(undefined);
	doc: UserDoc | undefined | null = $state(undefined);

	docFromCache: boolean = $state(false);
	docHasPendingWrites: boolean = $state(false);
	syncStatus: DocSyncStatus = $state('loading');

	private unsub: () => void = () => {};

	constructor() {
		// Track the auth user
		$effect(() => {
			return onAuthStateChanged(auth, (user) => (this.user = user));
		});

		// Subscribe to the user document
		$effect(() => {
			if (this.user === undefined) {
				this.doc = undefined; // Loading
			} else if (this.user === null) {
				this.doc = null; // Not logged in
				this.syncStatus = 'does-not-exist';
			} else {
				// Subscribe to the user document
				const docState = untrack(
					() =>
						new DocState<UserDoc, DBUserDoc>(firestore, `users/${this.user!.uid}`, userDocConverter)
				);

				this.unsub = docState.store.subscribe((doc) => {
					this.doc = doc.data;
					this.docFromCache = doc.fromCache;
					this.docHasPendingWrites = doc.hasPendingWrites;
					this.syncStatus = doc.syncStatus;
				});
			}

			// Unsubscribe when the user changes
			return this.unsub;
		});
	}
}
