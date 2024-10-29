import { syncMode } from '$lib/shared/state/persistent-sync-mode.svelte';
import type { PartialWithFieldValue } from 'firebase/firestore';
import {
	doc,
	onSnapshot,
	type Firestore,
	DocumentReference,
	type DocumentData,
	setDoc,
	type SetOptions,
	type UpdateData,
	updateDoc
} from 'firebase/firestore';
import { type FirestoreDataConverter } from 'firebase/firestore';

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
	// TODO add support for debouncing the setDoc method, maybe a way to cancel it, and an offline mode
	// scoped to this document that squashes the writes until we come back online (or queue that applies all
	// the changes when we come back online)

	/** The Firestore document reference */
	ref: DocumentReference<DocT, DBDocT>;

	/** The document ID */
	id: string;

	/** True if the document is still loading */
	isLoading: boolean = $state(true);

	private _data: DocT | undefined | null = $state(undefined);

	/**
	 * Get the doc from Firestore, returns undefined if loading or null if not found.
	 * @returns The document data, or undefined if loading, or null if not found
	 */
	get data(): DocT | undefined | null {
		return this._data;
	}

	/**
	 * Set the doc in Firestore, merges with the existing document.
	 * @param value The new data to set, merges with the existing document
	 */
	set data(value: Partial<DocT>) {
		this.setDoc(value);
	}

	/**
	 * Alternative to setting the doc directly to update the document in Firestore, more explicit.
	 * Also allows to control the firestore set options, e.g. merge true/false.
	 * @param newData The new data to set, merges with the existing document
	 */
	setDoc(newData: PartialWithFieldValue<DocT>, options: SetOptions = { merge: true }) {
		if (!this.data) throw new Error('Document has not been loaded yet');
		if (!newData) throw new Error('Cannot set doc to null'); // TODO add support?
		console.log('Setting doc following type <DocT>', this.ref.path, newData, options);

		// Write the data to Firestore, this._data will be updated by the snapshot listener
		setDoc(this.ref, newData, options);
	}

	/**
	 * CAUTION: The update method uses the DBDocT type, not the DocT type.
	 *
	 * Alternative to updating the doc directly to update the document in Firestore, more explicit.
	 * @param newData The new data to update, merges with the existing document
	 */
	updateDoc(newData: UpdateData<DBDocT>) {
		if (!this.data) throw new Error('Document has not been loaded yet');
		if (!newData) throw new Error('Cannot update doc to null'); // TODO add support?
		console.log('Updating doc following type <DBDocT>', this.ref.path, newData);

		// Update the data in Firestore, this._data will be updated by the snapshot listener
		updateDoc(this.ref, newData);
	}

	/** True if the available document has been loaded from cache */
	fromCache: boolean = $state(false);

	/** True if the document has local pending writes */
	hasPendingWrites: boolean = $state(false);

	/** The sync status of the document */
	syncStatus: DocSyncStatus = $state('loading');

	private _unsubscribe: () => void = () => {};

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
		this._data = startWith;
		this.ref = typeof ref === 'string' ? doc(firestore, ref).withConverter(converter) : ref;
		this.id = this.ref.id;

		// Subscribe and cleanup the doc subscription when the component is destroyed
		$effect(() => {
			// let timeout = 0;

			this._unsubscribe = onSnapshot(this.ref, { includeMetadataChanges: true }, (snapshot) => {
				// Update the sync status
				this.fromCache = snapshot.metadata.fromCache;
				this.hasPendingWrites = snapshot.metadata.hasPendingWrites;

				// Debounce the `hasPendingWrites` for a more pleasant UI without flickering
				// if (timeout) window.clearTimeout(timeout);
				// timeout = window.setTimeout(
				// 	() => (this.hasPendingWrites = snapshot.metadata.hasPendingWrites),
				// 	snapshot.metadata.hasPendingWrites ? 60 : 240
				// );

				// Update the sync status based on fromCache, hasPendingWrites, and syncMode
				this.syncStatus = this.getSyncStatus();

				// Update the state
				this.isLoading = false;

				// Update the document data if it exists
				if (snapshot.exists()) {
					this._data = (snapshot.data({ serverTimestamps: 'estimate' }) as DocT) ?? null;
				} else {
					this._data = null;
					this.syncStatus = 'does-not-exist';
				}
			});

			// Cleanup the subscription when the component is destroyed
			// (or the effect runs again which shouldn't happen here)
			return () => {
				this._unsubscribe();
				this._unsubscribe = () => {};
			};
		});
	}

	/**
	 * Derive the sync status of the document based on the current sync mode
	 */
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

	/**
	 * Unsubscribe from the Firestore document
	 */
	destroy() {
		this._unsubscribe();
	}
}
