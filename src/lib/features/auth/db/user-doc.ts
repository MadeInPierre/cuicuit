import { Timestamp, type FirestoreDataConverter, type DocumentData } from 'firebase/firestore';

// TODO Implement interface versioning, see tutorial:
// https://www.captaincodeman.com/schema-versioning-with-google-firestore

export interface UserDoc {
	created_t: Date;
	firstName: string;
	lastName: string;
	userName: string;
	avatar: {
		type: string;
		icon: string;
		url: string | null;
		last_change_t: Date;
	};
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	listIds: {
		[id: string]: boolean;
	};
}

export interface DBUserDoc extends DocumentData {
	created_t: Timestamp;
	firstName: string;
	lastName: string;
	userName: string;
	avatar: {
		type: string;
		icon: string;
		url: string | null;
		last_change_t: Timestamp;
	};
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	listIds: {
		[id: string]: boolean;
	};
}

export const userDocConverter: FirestoreDataConverter<UserDoc, DBUserDoc> = {
	toFirestore(userDoc: UserDoc) {
		return {
			...userDoc,
			created_t: Timestamp.fromDate(userDoc.created_t),
			avatar: {
				...userDoc.avatar,
				last_change_t: Timestamp.fromDate(userDoc.avatar.last_change_t)
			}
		} as DBUserDoc;
	},

	fromFirestore(snapshot, options) {
		const dbUserDoc = snapshot.data(options) as DBUserDoc;

		return {
			...dbUserDoc,
			created_t: dbUserDoc.created_t.toDate(),
			avatar: {
				...dbUserDoc.avatar,
				last_change_t: dbUserDoc.avatar.last_change_t.toDate()
			}
		} as UserDoc;
	}
};
