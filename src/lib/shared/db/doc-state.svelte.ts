import { syncMode } from '$lib/shared/state/sync.svelte';
import {
	doc,
	onSnapshot,
	type Firestore,
	DocumentReference,
	type DocumentData
} from 'firebase/firestore';
import { type FirestoreDataConverter } from 'firebase/firestore';
import { writable, type Readable, type Writable, get } from 'svelte/store';

// Helper interface to make sure the state and store have the same properties
interface IDocState<DocT, DBDocT extends DocumentData> {
	ref: DocumentReference<DocT, DBDocT>;
	id: string;
	isLoading: boolean;
	data: DocT | undefined | null;

	fromCache: boolean;
	hasPendingWrites: boolean;
	syncStatus: DocSyncStatus;
}

// Sync status of the Firestore document
export const DocSyncStatus = [
	'does-not-exist',
	'loading',
	'offline',
	'pending',
	'uploading',
	'downloading',
	'synchronized'
] as const;
export type DocSyncStatus = (typeof DocSyncStatus)[number];

/**
 * A reactive svelte state and store that listens to a Firestore document
 * DocT: The type of the data model
 * DBDocT: The type of the data model in the Firestore database
 * @param firestore The Firestore instance
 * @param ref The Firestore document reference object, or path string
 * @param converter The Firestore data converter from DocT to DBDocT and vice versa
 * @param startWith The initial data to start with
 * @returns Reactive state properties and a store version of the same properties
 */
export class DocState<DocT, DBDocT extends DocumentData> implements IDocState<DocT, DBDocT> {
	// Document properties
	ref: DocumentReference<DocT, DBDocT>;
	id: string;
	isLoading: boolean = $state(true);
	data: DocT | undefined | null = $state(undefined);

	// Sync properties
	fromCache: boolean = $state(false);
	hasPendingWrites: boolean = $state(false);
	syncStatus: DocSyncStatus = $state('loading');

	// Store version of the properties
	private _store: Writable<IDocState<DocT, DBDocT>>;
	get store(): Readable<IDocState<DocT, DBDocT>> {
		return { subscribe: this._store.subscribe };
	}

	constructor(
		firestore: Firestore,
		ref: DocumentReference<DocT, DBDocT> | string,
		converter: FirestoreDataConverter<DocT, DBDocT>,
		startWith: DocT | undefined = undefined
	) {
		// Check if Firestore instance is provided
		if (!firestore) {
			throw new Error('Firestore instance is required');
		}

		// Initialize the doc state
		this.data = startWith;
		this.ref = typeof ref === 'string' ? doc(firestore, ref).withConverter(converter) : ref;
		this.id = this.ref.id;

		// Create a readable store as an alternative to using state
		this._store = writable({
			isLoading: true,
			data: this.data,
			ref: this.ref,
			id: this.id,
			fromCache: this.fromCache,
			hasPendingWrites: this.hasPendingWrites,
			syncStatus: this.syncStatus
		});

		// Subsribe and cleanup the doc subscription when the component is destroyed
		$effect(() => {
			let timeout = 0;

			return onSnapshot(this.ref, { includeMetadataChanges: true }, (snapshot) => {
				// Update the sync status
				this.fromCache = snapshot.metadata.fromCache;

				// Debounce the `hasPendingWrites` for a more pleasant UI without flickering
				if (timeout) window.clearTimeout(timeout);
				timeout = window.setTimeout(
					() => (this.hasPendingWrites = snapshot.metadata.hasPendingWrites),
					snapshot.metadata.hasPendingWrites ? 60 : 240
				);

				this.syncStatus = this.getSyncStatus();

				// Update the state
				this.isLoading = false;

				// Update the document data if it exists
				if (snapshot.exists()) {
					this.data = (snapshot.data({ serverTimestamps: 'estimate' }) as DocT) ?? null;
				} else {
					this.data = null;
					this.syncStatus = 'does-not-exist';
				}

				// Update the store as well
				this._store.set({
					isLoading: this.isLoading,
					data: this.data,
					ref: this.ref,
					id: this.id,
					fromCache: this.fromCache,
					hasPendingWrites: this.hasPendingWrites,
					syncStatus: this.syncStatus
				});
			});
		});
	}

	private getSyncStatus(): DocSyncStatus {
		if (syncMode.mode === 'offline') {
			if (this.hasPendingWrites) {
				return 'pending';
			} else {
				return 'offline';
			}
		} else if (syncMode.mode === 'online') {
			if (this.hasPendingWrites) {
				return 'uploading';
			} else {
				return this.fromCache ? 'downloading' : 'synchronized';
			}
		} else {
			throw new Error('Invalid sync mode');
		}
	}
}
