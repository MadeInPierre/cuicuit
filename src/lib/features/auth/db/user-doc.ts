import type { SpaceIconKey, SpaceThemeKey } from '$lib/features/spaces/consts';
import { Timestamp, type FirestoreDataConverter, type DocumentData } from 'firebase/firestore';

// TODO Implement interface versioning, see tutorial:
// https://www.captaincodeman.com/schema-versioning-with-google-firestore

export interface UserDoc extends UserProfile {
	created_t: Date;
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	spaces: {
		[id: string]: SpaceUserHeader;
	};
}

export interface UserProfile {
	firstName: string;
	lastName: string;
	userName: string;
	avatar: UserDocAvatar;
}

export interface UserDocAvatar {
	type: string;
	icon: string;
	url: string | null;
	last_change_t: Date;
}

export interface SpaceUserHeader {
	name: string;
	icon: SpaceIconKey;
	theme: SpaceThemeKey;
}

export interface DBUserDoc extends DBUserProfile, DocumentData {
	created_t: Timestamp;
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	spaces: {
		[id: string]: SpaceUserHeader;
	};
}
export interface DBUserProfile {
	firstName: string;
	lastName: string;
	userName: string;
	avatar: DBUserDocAvatar;
}

export interface DBUserDocAvatar {
	type: string;
	icon: string;
	url: string | null;
	last_change_t: Timestamp;
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
