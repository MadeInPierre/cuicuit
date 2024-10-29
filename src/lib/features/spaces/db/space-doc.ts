import type { DBUserProfile, UserProfile } from '$lib/features/auth/db/user-doc';
import { Timestamp, type FirestoreDataConverter, type DocumentData } from 'firebase/firestore';
import type { SpaceIconKey } from '../consts';

export interface SpaceDoc {
	// TODO this model comes from V1, anything to change?
	name: string;
	icon: SpaceIconKey;
	created_t: Date;
	updated_t: Date;
	memberProfiles: {
		[uid: string]: UserProfile;
	};
	locale: string;
}

export interface DBSpaceDoc extends DocumentData {
	name: string;
	icon: SpaceIconKey;
	created_t: Timestamp;
	updated_t: Timestamp;
	memberProfiles: {
		[uid: string]: DBUserProfile;
	};
	locale: string;
}

export const spaceDocConverter: FirestoreDataConverter<SpaceDoc, DBSpaceDoc> = {
	toFirestore(spaceDoc: SpaceDoc) {
		return {
			...spaceDoc,
			created_t: Timestamp.fromDate(spaceDoc.created_t),
			updated_t: Timestamp.fromDate(spaceDoc.updated_t)
		} as DBSpaceDoc;
	},

	fromFirestore(snapshot, options) {
		const dbDoc = snapshot.data(options) as DBSpaceDoc;

		return {
			...dbDoc,
			created_t: dbDoc.created_t.toDate(),
			updated_t: dbDoc.updated_t.toDate()
		} as SpaceDoc;
	}
};
