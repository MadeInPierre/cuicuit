import type { UserProfile } from '$lib/features/auth/db/user-doc';
import { Timestamp, type FirestoreDataConverter } from 'firebase/firestore';
import type { SpaceIconKey } from '../consts';
import type { Modify } from '$lib/utils';

/**
 * App model
 */

export type SpaceDoc = {
	// TODO this model comes from V1, anything to change?
	name: string;
	icon: SpaceIconKey;
	created_t: Date;
	updated_t: Date;
	memberProfiles: {
		[uid: string]: UserProfile;
	};
	locale: string;
};

/**
 * Firestore model
 */

export type DBSpaceDoc = Modify<
	SpaceDoc,
	{
		created_t: Timestamp; // Replace Date with Firestore Timestamp
		updated_t: Timestamp;
	}
>;

/**
 * Firestore converter
 */

export const spaceDocConverter: FirestoreDataConverter<SpaceDoc, DBSpaceDoc> = {
	toFirestore(spaceDoc: SpaceDoc) {
		return {
			...spaceDoc,
			created_t: Timestamp.fromDate(spaceDoc.created_t),
			updated_t: Timestamp.fromDate(spaceDoc.updated_t)
		} satisfies DBSpaceDoc;
	},

	fromFirestore(snapshot, options) {
		const dbDoc = snapshot.data(options) as DBSpaceDoc;

		return {
			...dbDoc,
			created_t: dbDoc.created_t.toDate(),
			updated_t: dbDoc.updated_t.toDate()
		} satisfies SpaceDoc;
	}
};
