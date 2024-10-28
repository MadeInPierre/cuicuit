import { DocState } from '$lib/shared/db/doc-state.svelte';
import { getContext, setContext } from 'svelte';
import { spaceDocConverter, type DBSpaceDoc, type SpaceDoc } from '../db/space-doc';
import { firestore } from '$lib/shared/db/firebase-client';

export interface SpaceUserHeader {
	name: string;
	icon: string;
	theme: string;
}

// TODO fetch from db
export const spaces: Record<string, SpaceUserHeader> = {
	id1: {
		name: 'Lyon',
		icon: 'cat',
		theme: 'yellow'
	},
	id2: {
		name: 'Saint Gély',
		icon: 'armchair',
		theme: 'green'
	},
	id3: {
		name: 'Poissy',
		icon: 'lamp-desk',
		theme: 'blue'
	}
};

class ActiveSpaceState {
	/** The current space ID, undefined if loading, null if not logged in */
	id: string | undefined | null = $state("id1");

	userHeader: SpaceUserHeader | undefined | null = $derived(this.id ? spaces[this.id] : null);

	/** The full DocState instance if needed to access all document methods */
	docState: DocState<SpaceDoc, DBSpaceDoc> | undefined = $state(undefined);
	doc: SpaceDoc | undefined | null = $derived(this.docState?.data);

	// constructor() {
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
	// }
}

// Only export the type to forbid creating new instances.
// Must use the create/getActiveSpaceState() functions in components
export type { ActiveSpaceState };

const KEY = Symbol('USER_DOC_STATE');

export function createActiveSpaceState(): ActiveSpaceState {
	return setContext(KEY, new ActiveSpaceState());
}

export function getActiveSpaceState(): ActiveSpaceState {
	return getContext<ReturnType<typeof createActiveSpaceState>>(KEY);
}
