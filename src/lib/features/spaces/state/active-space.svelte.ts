import { DocState } from '$lib/shared/db/doc-state.svelte';
import { getContext, setContext } from 'svelte';
import { spaceDocConverter, type DBSpaceDoc, type SpaceDoc } from '../db/space-doc';
import { firestore } from '$lib/shared/db/firebase-client';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { SpaceUserHeader } from '$lib/features/auth/db/user-doc';
import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';

const activeSpaceIdState = createPersistentState('active-space-id', undefined);

class ActiveSpaceState {
	private _userDocState: UserDocState | undefined = undefined;

	/** Repeat the activeSpaceIdState.id here for easier access */
	private _id: string | undefined | null = $derived(activeSpaceIdState.id);
	get id(): string | undefined | null {
		return this._id;
	}
	set id(newId: string) {
		activeSpaceIdState.set(newId);
	}

	/** All the space headers stored in the UserDoc */
	userHeaders: Record<string, SpaceUserHeader> = $derived(this._userDocState?.doc?.spaces || {});

	/** Data about the active space stored in the UserDoc */
	userHeader: SpaceUserHeader | undefined | null = $derived(
		this.id ? this.userHeaders[this.id] : undefined
	);

	/** TODO The full DocState instance if needed to access all document methods */
	docState: DocState<SpaceDoc, DBSpaceDoc> | undefined = $state(undefined);
	doc: SpaceDoc | undefined | null = $derived(this.docState?.data);

	constructor(userDocState: UserDocState) {
		this._userDocState = userDocState;

		// If the user has spaces but none active, set the first one as active
		$effect(() => {
			if (
				userDocState.docState?.data &&
				Object.keys(userDocState.docState.data.spaces).length > 0 &&
				!this._id
			) {
				this.id = Object.keys(userDocState.docState.data.spaces)[0];
			}
		});

		// TODO fetch the space document
		// 	$effect(() => {
		// 		if (this.id) {
		// 			// Subscribe to the space document. DocState will stop listening when its instance is destroyed
		// 			this.docState = new DocState<SpaceDoc, DBSpaceDoc>(
		// 				firestore,
		// 				`spaces/${this.id}`,
		// 				spaceDocConverter
		// 			);
		// 		} else {
		// 			this.docState = undefined;
		// 		}
		// 	});
	}
}

// Only export the type to forbid creating new instances.
// Must use the create/getActiveSpaceState() functions in components
export type { ActiveSpaceState };

const KEY = Symbol('USER_DOC_STATE');

export function createActiveSpaceState(userDocState: UserDocState): ActiveSpaceState {
	return setContext(KEY, new ActiveSpaceState(userDocState));
}

export function getActiveSpaceState(): ActiveSpaceState {
	return getContext<ReturnType<typeof createActiveSpaceState>>(KEY);
}
