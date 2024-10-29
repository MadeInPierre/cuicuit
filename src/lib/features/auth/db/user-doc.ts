import type { SpaceIconKey, SpaceThemeKey } from '$lib/features/spaces/consts';
import type { Modify } from '$lib/utils';
import { Timestamp, type FirestoreDataConverter, type DocumentData } from 'firebase/firestore';

// TODO Implement interface versioning, see tutorial:
// https://www.captaincodeman.com/schema-versioning-with-google-firestore

/**
 * App model
 */

export type UserProfile = {
	firstName: string;
	lastName: string;
	userName: string;
	avatar: UserDocAvatar;
};

export type UserDoc = UserProfile & {
	created_t: Date;
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	spaces: {
		[id: string]: SpaceUserHeader;
	};
};

export type UserDocAvatar = {
	type: string;
	icon: string;
	url: string | null;
};

export type SpaceUserHeader = {
	name: string;
	icon: SpaceIconKey;
	theme: SpaceThemeKey;
};

/**
 * Firestore model
 */

export type DBUserProfile = {
	firstName: string;
	lastName: string;
	userName: string;
	avatar: DBUserDocAvatar;
};

export type DBUserDoc = Modify<
	UserDoc,
	DocumentData &
		DBUserProfile & {
			created_t: Timestamp; // Replace Date with Firestore Timestamp
		}
>;

export type DBUserDocAvatar = {
	type: string;
	icon: string;
	url: string | null;
};

/**
 * Firestore converter
 */

export const userDocConverter: FirestoreDataConverter<UserDoc, DBUserDoc> = {
	toFirestore(userDoc: UserDoc) {
		return {
			...userDoc,
			created_t: Timestamp.fromDate(userDoc.created_t)
		} as DBUserDoc;
	},

	fromFirestore(snapshot, options) {
		const dbUserDoc = snapshot.data(options) as DBUserDoc;

		return {
			...dbUserDoc,
			created_t: dbUserDoc.created_t.toDate()
		} as UserDoc;
	}
};
